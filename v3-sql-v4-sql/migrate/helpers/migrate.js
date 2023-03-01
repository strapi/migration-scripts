const { dbV3, dbV4, isPGSQL, isMYSQL, isSQLITE } = require('../../config/database');
const { BATCH_SIZE } = require('./constants');
const { migrateItems } = require('./migrateFields');
const { pick, isEmpty } = require('lodash');
const { resolveDestTableName, resolveSourceTableName } = require('./tableNameHelpers');

async function migrate(source, destination, itemMapper = undefined) {
  if (isMYSQL) {
    const sourceNotExists = (await dbV3.raw(`SHOW TABLES LIKE '%${source}%';`))[0].length === 0;
    const destinationNotExists =
      (await dbV4.raw(`SHOW TABLES LIKE "%${destination}%";`))[0].length === 0;

    if (sourceNotExists) {
      console.log(`SOURCE TABLE ${source} DOES NOT EXISTS`);
      return false;
    }

    if (destinationNotExists) {
      console.log(`DESTINATION TABLE ${destination} DOES NOT EXISTS`);
      return false;
    }
  }

  if (isSQLITE) {
    // SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';

    const sourceNotExists =
      (
        await dbV3('sqlite_master')
          .select('name')
          .where('type', 'table')
          .where('name', source)
          .first()
          .count()
      )['count(*)'] === 0;

    const destinationNotExists =
      (
        await dbV4('sqlite_master')
          .select('name')
          .where('type', 'table')
          .where('name', destination)
          .first()
          .count()
      )['count(*)'] === 0;

    if (sourceNotExists) {
      console.log(`SOURCE TABLE ${source} DOES NOT EXISTS`);
      return false;
    }

    if (destinationNotExists) {
      console.log(`DESTINATION TABLE ${destination} DOES NOT EXISTS`);
      return false;
    }
  }

  if (isPGSQL) {
    //  SELECT FROM information_schema.tables
    //  WHERE  table_schema = 'schema_name'
    //  AND    table_name   = 'table_name'

    const sourceNotExists =
      (
        await dbV3('information_schema.tables')
          .select('table_name')
          .where('table_schema', process.env.DATABASE_V3_SCHEMA)
          .where('table_name', source)
      ).length === 0;

    const destinationNotExists =
      (
        await dbV4('information_schema.tables')
          .select('table_name')
          .where('table_schema', process.env.DATABASE_V4_SCHEMA)
          .where('table_name', destination)
      ).length === 0;

    if (sourceNotExists) {
      console.log(`SOURCE TABLE ${source} DOES NOT EXISTS`);
      return false;
    }

    if (destinationNotExists) {
      console.log(`DESTINATION TABLE ${destination} DOES NOT EXISTS`);
      return false;
    }
  }

  const count =
    (await dbV3(resolveSourceTableName(source)).count().first()).count ||
    (await dbV3(resolveSourceTableName(source)).count().first())['count(*)'];
  const columnsInfo = await dbV3(source).withSchema(process.env.DATABASE_V3_SCHEMA).columnInfo();

  const jsonFields = Object.keys(columnsInfo).filter((column) => {
    return columnsInfo[column].type === 'jsonb';
  });

  console.log(`Migrating ${count} items from ${source} to ${destination}`);
  await dbV4(resolveDestTableName(destination)).del();

  let tableColumnsInfo = await dbV4(destination).withSchema(process.env.DATABASE_V4_SCHEMA).columnInfo();

  if (isPGSQL) {
    // https://github.com/knex/knex/issues/1490
    tableColumnsInfo = await dbV4(destination)
      .withSchema(process.env.DATABASE_V4_SCHEMA)
      .columnInfo();
  }

  const tableColumns = Object.keys(tableColumnsInfo);

  for (let page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await dbV3(resolveSourceTableName(source))
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);

    const withParsedJsonFields = items.map((item) => {
      if (jsonFields.length > 0) {
        jsonFields.forEach((field) => {
          item[field] = JSON.stringify(item[field]);
        });
      }

      return item;
    });

    const migratedItems = migrateItems(withParsedJsonFields, itemMapper).map((item) => {
      const filteredItems = pick(item, tableColumns);
      if (isEmpty(filteredItems)) {
        console.log(`WARNING - parsed json field ${JSON.stringify(item)} of ${destination} not found in table columns ${JSON.stringify(tableColumns)}`)
        return null;
      }

      if (Object.keys(item).length !== Object.keys(filteredItems).length) {
        const filteredColumns = Object.keys(item).filter(function (obj) {
          return Object.keys(filteredItems).indexOf(obj) == -1;
        });

        console.log(
          'WARNING - items of ' + destination + ' was filtered ' + JSON.stringify(filteredColumns)
        );
      }

      return filteredItems;
    }).filter(Boolean);

    if (migratedItems.length > 0) {
      await dbV4(resolveDestTableName(destination)).insert(migratedItems);
    }
  }

  await resetTableSequence(destination);
}

async function resetTableSequence(destination) {
  if (isPGSQL) {
    const hasId = await dbV4.schema.hasColumn(destination, 'id');
    if (hasId) {
      const seq = `${destination.slice(0, 56)}_id_seq`;
      await dbV4.raw(`SELECT SETVAL ('"${seq}"', (SELECT MAX(id) + 1 FROM "${destination}"))`);
    }
  }
}

module.exports = {
  migrate,
  resetTableSequence,
};
