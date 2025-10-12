const bulkAccounts = [];
const startAccountId = 8000000000;
const productId = 1;
const status = "ACTIVE";
const domainPrefix = "route-iq-test-";
const domainSuffix = ".freshservice.com";
const now = new Date();
for (let i = 0; i < 150; i++) {
    const accountId = startAccountId + i;
    bulkAccounts.push({
        account_id: accountId,
        product_id: productId,
        domain_name: domainPrefix + i + domainSuffix,
        status: status,
        created_at: now,
        updated_at: now,
        last_modified_at: now
    });
}
db.accounts.insertMany(bulkAccounts);
