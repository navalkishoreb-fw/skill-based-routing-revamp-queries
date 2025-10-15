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
      'updated_at': {
        '$gte': new Date('Sat, 01 Nov 2025 00:00:00 GMT'), 
        '$lt': new Date('Fri, 07 Nov 2025 00:00:00 GMT')
      }
    }
  }, {
    '$project': {
      '_id': 0, 
      'product_id': 1, 
      'account_id': 1, 
      'skill_id': 1, 
      'min_avg_resolution_time': 1, 
      'max_ticket_resolved': 1
    }
  }
];

const client = await MongoClient.connect(
  'mongodb://localhost:27017/'
);
const coll = client.db('route_iq').collection('global_skill_metrics');
const cursor = coll.aggregate(agg);
const result = await cursor.toArray();
await client.close();
