import { MongoClient } from 'mongodb';

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const agg = [
  {
    '$match': {
      'product_id': 1, 
      'account_id': 8000000000, 
      'agent_skill_metrics_modified_at': {
        '$gte': new Date('Sat, 01 Nov 2025 00:00:00 GMT'), 
        '$lt': new Date('Fri, 07 Nov 2025 00:00:00 GMT')
      }, 
      'is_deleted': false
    }
  }, {
    '$group': {
      '_id': {
        'product_id': '$product_id', 
        'account_id': '$account_id', 
        'skill_id': '$skill_id'
      }, 
      'max_ticket_resolved': {
        '$max': '$max_ticket_resolved'
      }, 
      'min_avg_resolution_time': {
        '$min': '$avg_resolution_time'
      }
    }
  }, {
    '$project': {
      '_id': 0, 
      'product_id': '$_id.product_id', 
      'account_id': '$_id.account_id', 
      'skill_id': '$_id.skill_id', 
      'max_ticket_resolved': 1, 
      'min_avg_resolution_time': 1, 
      'created_at': {
        '$literal': new Date()
      }, 
      'last_modified_at': {
        '$literal': new Date()
      }, 
      'updated_at': {
        '$literal': new Date()
      }, 
      'is_deleted': {
        '$literal': false
      }
    }
  }, {
    '$merge': {
      'into': 'global_skill_metrics', 
      'on': [
        'product_id', 'account_id', 'skill_id'
      ], 
      'whenMatched': [
        {
          '$set': {
            'max_ticket_resolved': {
              '$cond': {
                'if': {
                  '$gt': [
                    '$$new.max_ticket_resolved', '$$ROOT.max_ticket_resolved'
                  ]
                }, 
                'then': '$$new.max_ticket_resolved', 
                'else': '$$ROOT.max_ticket_resolved'
              }
            }, 
            'min_avg_resolution_time': {
              '$cond': {
                'if': {
                  '$lt': [
                    '$$new.min_avg_resolution_time', '$$ROOT.min_avg_resolution_time'
                  ]
                }, 
                'then': '$$new.min_avg_resolution_time', 
                'else': '$$ROOT.min_avg_resolution_time'
              }
            }, 
            'last_modified_at': '$$new.last_modified_at', 
            'updated_at': '$$new.updated_at', 
            'is_deleted': '$$new.is_deleted'
          }
        }
      ], 
      'whenNotMatched': 'insert'
    }
  }
];

const client = await MongoClient.connect(
  'mongodb://localhost:27017/'
);
const coll = client.db('route_iq').collection('agent_skills');
const cursor = coll.aggregate(agg);
const result = await cursor.toArray();
await client.close();
