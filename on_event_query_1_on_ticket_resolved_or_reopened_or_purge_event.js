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
      'skill_id': 8000000000, 
      'agent_id': 8000000319, 
      'resolution_timestamp': {
        '$gte': new Date('Thu, 01 May 2025 00:00:00 GMT'), 
        '$lt': new Date('Sat, 01 Nov 2025 00:00:00 GMT')
      }, 
      'is_deleted': false
    }
  }, {
    '$group': {
      '_id': {
        'account_id': '$account_id', 
        'product_id': '$product_id', 
        'skill_id': '$skill_id', 
        'agent_id': '$agent_id'
      }, 
      'total_ticket_resolved': {
        '$sum': 1
      }, 
      'avg_resolution_time': {
        '$avg': '$resolution_time'
      }
    }
  }, {
    '$project': {
      '_id': 0, 
      'account_id': '$_id.account_id', 
      'product_id': '$_id.product_id', 
      'skill_id': '$_id.skill_id', 
      'agent_id': '$_id.agent_id', 
      'total_ticket_resolved': 1, 
      'avg_resolution_time': 1
    }
  }, {
    '$addFields': {
      'is_deleted': false, 
      'agent_skill_metrics_modified_at': '$$NOW'
    }
  }, {
    '$merge': {
      'into': 'agent_skills', 
      'on': [
        'account_id', 'product_id', 'skill_id', 'agent_id'
      ], 
      'whenMatched': 'merge', 
      'whenNotMatched': 'insert'
    }
  }
];

const client = await MongoClient.connect(
  'mongodb://localhost:27017/'
);
const coll = client.db('route_iq').collection('task_event_logs');
const cursor = coll.aggregate(agg);
const result = await cursor.toArray();
await client.close();
