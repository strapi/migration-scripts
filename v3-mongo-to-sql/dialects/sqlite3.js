module.exports = {
  async delAllTables(knex) {
    const res = await knex.raw(`
    SELECT 
      name
    FROM 
      sqlite_schema
    WHERE 
      type ='table' AND 
      name NOT LIKE 'sqlite_%';
    `);

    const tableList = res.map(r => r.name)

    // clear all tables
    for (const table of tableList) {
      await knex(table).del();
    }

    await knex('sqlite_sequence').del().whereIn('name', tableList)

  },
};
