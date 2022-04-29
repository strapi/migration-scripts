const { migrate } = require("./helpers/migrate");

async function migrateTables() {
  console.log("Migrate locales (i18n)");

  const source = "i18n_locales";
  const destination = "i18n_locale";

  await migrate(source, destination);
}

module.exports = {
  migrateI18n: {
    processedTables: ["i18n_locales"],
    migrateTables,
  },

};
