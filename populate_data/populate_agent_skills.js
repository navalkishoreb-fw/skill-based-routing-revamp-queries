// --- Helper Functions ---
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomScore() {
  return Math.random(); // Changed to full 0.0 - 1.0 range for proficiency variation
}

function determineProficiency(score) {
  if (score < 0.3) return 1;
  if (score < 0.7) return 2;
  return 3;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Shuffle array in place - Fisher-Yates
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Constants ---
const totalSkills = 10000;
const skillsPerAgent = 8000;

const timestamp = new Date("2025-10-07T10:00:00Z");
const lastUsedTaskStart = new Date("2025-01-01T00:00:00Z");
const lastUsedTaskEnd = new Date("2025-08-10T23:59:59Z");

const agentBatchSize = 100;
const skillInsertBatchSize = 20000;

let totalInserted = 0;
let batch = [];

// Generate full skill set (1 to 10000)
const fullSkillSet = Array.from({ length: totalSkills }, (_, i) => i + 1);

// --- Checkpoint Setup ---
const checkpointCollection = db.checkpoint;
const checkpointId = "agentSkillImport";
let checkpointDoc = checkpointCollection.findOne({ _id: checkpointId });
let lastProcessedId = checkpointDoc ? checkpointDoc.lastProcessedId : null;

// --- New agent filter date ---
const newAgentCreatedAfter = new Date("2025-10-05T10:00:00Z");  // Adjust this date!

// --- Processing Loop ---
let hasMore = true;

while (hasMore) {
  const agentQuery = lastProcessedId
    ? { _id: { $gt: lastProcessedId }, created_at: { $gte: newAgentCreatedAfter } }
    : { created_at: { $gte: newAgentCreatedAfter } };

  const agents = db.agents
    .find(agentQuery, { account_id: 1, product_id: 1, agent_id: 1, created_at: 1 })
    .sort({ _id: 1 })
    .limit(agentBatchSize)
    .toArray();

  if (agents.length === 0) {
    hasMore = false;
    break;
  }

  for (let agent of agents) {
    if (!agent.account_id || !agent.product_id || !agent.agent_id) continue;

    // Shuffle full skill set copy and pick first 8000 skills for this agent
    const agentSkillSet = shuffle(fullSkillSet.slice()).slice(0, skillsPerAgent);

    for (let skill_id of agentSkillSet) {
      const score = getRandomScore();
      const proficiency = determineProficiency(score);
      const roundedScore = Math.round(score * 100) / 100;

      batch.push({
        insertOne: {
          document: {
            account_id: agent.account_id,
            product_id: agent.product_id,
            skill_id,
            agent_id: agent.agent_id,
            proficiency,
            system_suggested_proficiency: proficiency,
            proficiency_updated_at: timestamp,
            score: roundedScore,
            associated_by_system: true,
            proficiency_updated_manually: false,
            is_deleted: false,
            enabled: true,
            last_used_in_task_at: randomDate(lastUsedTaskStart, lastUsedTaskEnd),
            created_at: timestamp,
            updated_at: timestamp,
            last_modified_at: timestamp,
            max_ticket_resolved: getRandomInt(1, 3000),
            avg_resolution_time:  getRandomInt(200, 30000),
            agent_skill_metric_modified_at: randomDate(lastUsedTaskStart, lastUsedTaskEnd),
            score_calculated_at: randomDate(lastUsedTaskStart, lastUsedTaskEnd)
          }
        }
      });

      // Bulk insert in batches
      if (batch.length >= skillInsertBatchSize) {
        db.agent_skills.bulkWrite(batch);
        totalInserted += batch.length;
        batch = [];
      }
    }

    lastProcessedId = agent._id;
  }

  // Insert remaining batch after each agent batch
  if (batch.length > 0) {
    db.agent_skills.bulkWrite(batch);
    totalInserted += batch.length;
    batch = [];
  }

  checkpointCollection.updateOne(
    { _id: checkpointId },
    { $set: { lastProcessedId } },
    { upsert: true }
  );

  print(`Checkpoint updated. Last agent _id: ${lastProcessedId}, Total Inserted: ${totalInserted}`);
}

print(`\n✅ Completed. Total agent skill mappings inserted: ${totalInserted}`);

