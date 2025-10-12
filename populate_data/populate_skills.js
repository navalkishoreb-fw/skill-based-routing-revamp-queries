const intents = ["request", "alert", "issue", "notification", "others"];
const commonFields = {
  product_id: 1,
  entities: "user, account"
};
const batchSize = 1000;
const totalSkillsPerAccount = 10000;
const startAccountId = 8000000000;
const endAccountId = 8000004000;
for (let accountId = startAccountId; accountId <= endAccountId; accountId++) {
  print(`Inserting skills for account_id: ${accountId}`);
  for (let i = 0; i < totalSkillsPerAccount; i += batchSize) {
    const bulk = [];
    for (let j = 0; j < batchSize; j++) {
      const skillIndex = i + j;
      const skillId = 8000000000 + skillIndex;  // skill_id per account starts at 8000000000
      const intent = intents[Math.floor(Math.random() * intents.length)];
      const now = new Date();
      bulk.push({
        account_id: accountId,
        skill_id: skillId,
        intent: intent,
        skill_name: `${intent} | ${commonFields.entities}`,
        product_id: commonFields.product_id,
        entities: commonFields.entities,
        created_at: now,
        updated_at: now,
        last_modified_at: now
      });
    }
    db.skills.insertMany(bulk);
    print(`Inserted ${Math.min(i + batchSize, totalSkillsPerAccount)} / ${totalSkillsPerAccount} skills for account_id: ${accountId}`);
  }
}

