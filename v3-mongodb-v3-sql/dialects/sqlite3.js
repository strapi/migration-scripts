module.exports = (knex) => ({
  async clearSequences(tableList) {
    const hasTable = await knex.schema.hasTable(`sqlite_sequence`);

    if (hasTable) {
      await knex("sqlite_sequence").del().whereIn("name", tableList);
    }
  },

  async delAllTables() {
    const res = await knex.raw(`
    SELECT 
      name
    FROM 
      sqlite_schema
    WHERE 
      type ='table' AND 
      name NOT LIKE 'sqlite_%';
    `);

    const tableList = res.map((r) => r.name);

    // clear all tables
    for (const table of tableList) {
      await knex(table).del();
    }

    return this.clearSequences(tableList);
  },
});
