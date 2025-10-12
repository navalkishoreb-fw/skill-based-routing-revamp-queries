const ACCOUNTS_START = 8000000000;
const ACCOUNTS_END = 8000004000;
const DOCS_PER_ACCOUNT = 500000;
const AGENT_ID_START = 8000000000;
const AGENT_ID_END = 8000000699;
const SKILL_ID_START = 8000000000;
const SKILL_ID_END = 8000009999;
let ticketIdCounter = 8000000000;
function getRandomInt(min, max) {


 return Math.floor(Math.random() * (max - min + 1)) + min;
}
const bulkOps = [];
const BATCH_SIZE = 1000;
for (let accountId = ACCOUNTS_START; accountId <= ACCOUNTS_END; accountId++) {
 print(`Starting documents for account_id: ${accountId}`);
  for (let i = 0; i < DOCS_PER_ACCOUNT; i++) {
   const agentId = getRandomInt(AGENT_ID_START, AGENT_ID_END);
   const skillId = getRandomInt(SKILL_ID_START, SKILL_ID_END);
   const now = new Date();
   bulkOps.push({
     insertOne: {
       document: {
         account_id: accountId,
         product_id: 1,
         ticket_id: ticketIdCounter++,
         agent_id: agentId,
         created_at: now,
         last_modified_at: now,
         updated_at: now,
         resolution_time: getRandomInt(1000, 50000), // example resolution time in seconds
         resolution_timestamp: now,
         skill_id: skillId,
         is_deleted: false
       }
     }
   });
   if (bulkOps.length === BATCH_SIZE) {
     db.task_event_logs.bulkWrite(bulkOps);
     bulkOps.length = 0;
     print(`Inserted ${i + 1} documents for account_id ${accountId}`);
   }
 }
 // Insert any remaining docs for this account
 if (bulkOps.length > 0) {
   db.task_event_logs.bulkWrite(bulkOps);
   bulkOps.length = 0;
 }
 print(`Completed documents for account_id: ${accountId}`);
}
print("Data insertion completed!");

