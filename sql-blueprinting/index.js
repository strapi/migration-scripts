import chalk from 'chalk';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

const db1 = process.env.DATABASE_BLUEPRINT_NAME; //reference database
const db2 = process.env.DATABASE_TARGET_NAME; // target database

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

connection.connect((err) => {
  if (err) throw err;
  console.log(chalk.bold.greenBright('Connected to the database!'));
});

const getTables = async (db) => {
  const [tables] = await connection.query(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
    [db]
  );
  return tables;
};

const dropTable = async (db, table) => {
  await connection.query(`DROP TABLE IF EXISTS ??.??`, [db, table]);
  return `The table ${chalk.bold.redBright(table)} does not exists in both databases. Dropping...`;
};

const getColumns = async (db, table) => {
  const [columns] = await connection.query(
    'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [db, table]
  );
  return columns;
};

const dropColumn = async (db, table, column) => {
  await connection.query(`ALTER TABLE ??.?? DROP COLUMN ??`, [db, table, column]);
  return `The column ${chalk.bold.redBright(column)} does not exists in both ${chalk.bold.redBright(
    table
  )} tables. Dropping...`;
};

const dropRow = async (db, table, column, value) => {
  await connection.query(`DELETE FROM ??.?? WHERE ?? = ?`, [db, table, column, value]);
  return `The row ${chalk.bold.redBright(value)} does not exists in both ${chalk.bold.redBright(
    table
  )} tables. Dropping...`;
};

const toggleForeignKeyCheck = async (state) => {
  await connection.query(`SET FOREIGN_KEY_CHECKS = ${state}`);
  return 'Foreign Key Check is set to ' + state + '!';
};

const getCoreStore = async (db) => {
  const [coreStore] = await connection.query('SELECT * FROM ??.core_store', [db]);
  return coreStore;
};

(async () => {
  try {
    let foreignKeyCheckState = 0;
    toggleForeignKeyCheck(foreignKeyCheckState).then((res) =>
      console.log(chalk.bold.yellowBright(res))
    );
    const tableNames_db1 = await getTables(db1);
    const tableNames_db2 = await getTables(db2);

    for (const tableName_db2 of tableNames_db2) {
      let tableExistanceFlag = false;
      let targetTableName = tableName_db2.TABLE_NAME;
      tableNames_db1.forEach((table_db1) => {
        if (targetTableName === table_db1.TABLE_NAME) {
          tableExistanceFlag = true;
        }
      });
      if (tableExistanceFlag && targetTableName !== 'core_store') {
        console.log(
          `The table ${chalk.bold.greenBright(targetTableName)} exists in both databases.`
        );
        const columns_db1 = await getColumns(db1, targetTableName);
        const columns_db2 = await getColumns(db2, targetTableName);

        for (const column_db2 of columns_db2) {
          let columnExistanceFlag = false;
          let columnNameDB2 = column_db2.COLUMN_NAME;
          columns_db1.forEach((column_db1) => {
            if (columnNameDB2 === column_db1.COLUMN_NAME) {
              columnExistanceFlag = true;
            }
          });
          if (!columnExistanceFlag) {
            const dropColumnMsg = await dropColumn(db2, targetTableName, columnNameDB2);
            console.log(dropColumnMsg);
          }
        }
      } else if (targetTableName === 'core_store') {
        const coreStore1 = await getCoreStore(db1);
        const coreStore2 = await getCoreStore(db2);
        for (const coreStore2Item of coreStore2) {
          let coreStoreExistanceFlag = false;
          let coreStore2ItemKey = coreStore2Item.key;
          coreStore1.forEach((coreStore1Item) => {
            if (coreStore2ItemKey === coreStore1Item.key) {
              coreStoreExistanceFlag = true;
            }
          });
          if (!coreStoreExistanceFlag) {
            const dropRowMsg = await dropRow(db2, targetTableName, 'key', coreStore2ItemKey);
            console.log(dropRowMsg);
          }
        }
      } else {
        const dropTableMsg = await dropTable(db2, targetTableName);
        console.log(dropTableMsg);
      }
    }
    foreignKeyCheckState = 1;
    toggleForeignKeyCheck(foreignKeyCheckState)
      .then((res) => console.log(chalk.bold.yellowBright(res)))
      .then(() => {
        console.log('Database cleanup is done, closing connection...');
        connection.end();
      });
  } catch (err) {
    console.log(err);
  }
})();
