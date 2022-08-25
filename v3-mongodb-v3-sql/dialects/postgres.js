module.exports = (knex) => ({
  async delAllTables() {
    console.log(knex);
    const res = await knex.raw(`
    SELECT 
      tablename
    FROM 
      pg_tables
    WHERE 
      schemaname='public';
    `);

    const tableList = res.map((r) => r.name);

    // clear all tables
    for (const table of tableList) {
      await knex(table).del();

      await knex.raw(`
      TRUNCATE TABLE
        ${table}
      RESTART IDENTITY CASCADE;
      `)
    }

    return tableList;
  },
});
