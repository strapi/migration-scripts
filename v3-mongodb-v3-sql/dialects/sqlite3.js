module.exports = (knex, inspector) => ({
  async clearSequences(tableList) {
    const hasTable = await knex.schema.hasTable(`sqlite_sequence`);

    if (hasTable) {
      await knex('sqlite_sequence').del().whereIn('name', tableList);
    }
  },

  async delAllTables() {
    const tableList = await inspector.tables();

    // clear all tables
    for (const table of tableList) {
      await knex(table).del();
    }

    return this.clearSequences(tableList);
  },

  async beforeMigration() {
    // do nothing because sqlite3 doesn't have foreign key checks
  },

  async afterMigration() {
    // do nothing because sqlite3 doesn't have foreign key checks
  },
});
