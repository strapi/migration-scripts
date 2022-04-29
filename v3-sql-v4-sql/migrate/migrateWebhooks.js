const { dbV3, dbV4 } = require("../config/database");
const { BATCH_SIZE } = require("./helpers/constants");
const { migrate } = require("./helpers/migrate");

async function migrateTables() {
  console.log("Migrate webhooks");

  const source = "strapi_webhooks";
  const destination = "strapi_webhooks";

  await migrate(source, destination);
}

module.exports = {
  migrateWebhooks: {
    processedTables: ["strapi_webhooks"],
    migrateTables,
  },
};
