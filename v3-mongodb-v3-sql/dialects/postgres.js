module.exports = (knex, inspector) => ({
  async delAllTables() {
    const tableList = await inspector.tables();

    // clear all tables
    for (const table of tableList) {
      await knex(table).del();
    }

    return tableList;
  },

  async beforeMigration() {
    // await knex.raw(`SET session_replication_role = 'replica';`);
  },

  async afterMigration() {
    const tableList = await inspector.tables();

    // restart sequence for tables
    for (const table of tableList) {
      let result = await knex.raw("select max(id) from ??", [table]);
      const max = result.rows[0].max;

      if (max) {
        await knex.raw(
          `
        ALTER SEQUENCE ?? RESTART WITH ??;
        `,
          [table + "_id_seq", max + 1]
        );
      }
    }
    // await knex.raw(`SET session_replication_role = 'origin';`);
  },
});
