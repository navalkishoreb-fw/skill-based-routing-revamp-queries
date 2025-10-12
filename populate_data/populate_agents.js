const startTime = new Date();
// Helper functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomUniqueNumbers(count, min, max) {
    const numbers = new Set();
    while (numbers.size < count) {
        numbers.add(getRandomInt(min, max));
    }
    return Array.from(numbers);
}
const workspaceTypes = ["it", "business"];
const agent_types = ["it_agent", "business_agent"];
let agentId = 8000000000;  // Start agent_id here
let businessCalendarId = 1000;
const agentBulkOps = [];
var schedules = [
    { id: 1, tz: "America/New_York", start: "09:00", end: "17:00" },
    { id: 2, tz: "America/Los_Angeles", start: "08:00", end: "16:00" },
    { id: 3, tz: "Europe/London", start: "10:00", end: "18:00" },
    { id: 4, tz: "Asia/Tokyo", start: "09:30", end: "17:30" },
    { id: 5, tz: "Australia/Sydney", start: "08:30", end: "16:30" },
    { id: 6, tz: "America/Chicago", start: "07:00", end: "15:00" },
    { id: 7, tz: "America/Denver", start: "08:30", end: "16:30" },
    { id: 8, tz: "Europe/Paris", start: "09:00", end: "18:00" },
    { id: 9, tz: "Asia/Shanghai", start: "08:00", end: "17:00" },
    { id: 10, tz: "Australia/Sydney", start: "09:00", end: "17:30" },
    { id: 11, tz: "America/Toronto", start: "08:00", end: "16:00" },
    { id: 12, tz: "Europe/Berlin", start: "07:30", end: "15:30" },
    { id: 13, tz: "Asia/Mumbai", start: "10:00", end: "19:00" },
    { id: 14, tz: "America/Phoenix", start: "06:00", end: "14:00" },
    { id: 15, tz: "Europe/Madrid", start: "09:30", end: "18:30" },
    { id: 16, tz: "Asia/Seoul", start: "08:30", end: "17:30" },
    { id: 17, tz: "America/Vancouver", start: "07:00", end: "16:00" },
    { id: 18, tz: "Europe/Rome", start: "08:00", end: "17:00" },
    { id: 19, tz: "Asia/Singapore", start: "09:00", end: "18:00" },
    { id: 20, tz: "Australia/Melbourne", start: "08:00", end: "16:30" }
];
// Loop over accounts 8000000000 to 8000004000
for (let accountId = 8000000000; accountId <= 8000004000; accountId++) {
    const startCal = businessCalendarId;
    const endCal = businessCalendarId + 19;
    businessCalendarId = endCal + 1;
    for (let k = 1; k <= 700; k++) {  // 700 agents per account
        const workspaces = getRandomUniqueNumbers(getRandomInt(1, 10), 1, 19);
        const workspacePermissions = [];
        workspaces.forEach(workspace => {
            const specGroupIds = getRandomUniqueNumbers(getRandomInt(0, 6), 1, 20);
            const groupIds = getRandomUniqueNumbers(getRandomInt(0, 15), 1, 20);
            const workspaceType = workspaceTypes[getRandomInt(0, workspaceTypes.length - 1)];
            // helpdesk_ticket module
            workspacePermissions.push({
                workspace_id: workspace,
                workspace_type: workspaceType,
                module: "helpdesk_ticket",
                group_ids: specGroupIds
            });
            // Possibly add itil_change module
            if (Math.random() < 0.5) {
                workspacePermissions.push({
                    workspace_id: workspace,
                    workspace_type: workspaceType,
                    module: "itil_change",
                    group_ids: groupIds
                });
            }
        });
        const limit = getRandomInt(450, 650);
        const calId = getRandomInt(startCal, endCal);
        const scheduleIndex = (calId - 1) % schedules.length; // zero-based index
        const selectedSchedule = schedules[scheduleIndex];
        const [startHour, startMin] = selectedSchedule.start.split(':').map(Number);
        const [endHour, endMin] = selectedSchedule.end.split(':').map(Number);
        const agentSchedule = {};
        for (let day = 0; day < 7; day++) {
            agentSchedule[day] = {
                start_time_score: (startHour * 60 + startMin) + day * 1440,
                end_time_score: (endHour * 60 + endMin) + day * 1440
            };
        }
        agentBulkOps.push({
            insertOne: {
                document: {
                    account_id: accountId,
                    product_id: 1,
                    agent_id: agentId++,
                    available: Math.random() < 0.5,
                    type: agent_types[getRandomInt(0, agent_types.length - 1)],
                    deleted: false,
                    business_calendar_id: calId,
                    agent_module_configs: {
                        "helpdesk_ticket": {
                            load: 0,
                            limit: limit,
                            last_assigned_at: new Date(),
                            load_ratio: 0,
                            available_bandwidth: limit
                        }
                    },
                    workspace_permissions: workspacePermissions,
                    created_at: new Date(),
                    updated_at: new Date(),
                    last_modified_at: new Date(),
                    schedule: agentSchedule
                }
            }
        });
        if (agentBulkOps.length >= 1000) {
            db.agents.bulkWrite(agentBulkOps);
            agentBulkOps.length = 0;
        }
        if (agentId % 500 === 0) {
            print(`Added agent_id ${agentId} for account_id ${accountId}`);
        }
    }
}
// Flush remaining bulk ops
if (agentBulkOps.length > 0) {
    db.agents.bulkWrite(agentBulkOps);
}
const endTime = new Date();
const executionTimeSeconds = (endTime - startTime) / 1000;
print("Data generation completed!");
print("Final AgentId: " + agentId);
print("Final BusinessCalendarId: " + businessCalendarId);
print("Execution time: " + executionTimeSeconds + " seconds");

