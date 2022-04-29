// Tables that should not be proccessed later
const processedTables = [];

// Custom migration function, handles DB reads and writes
async function migrateTables() {}

module.exports = {
  processedTables,
  migrateTables,
};
