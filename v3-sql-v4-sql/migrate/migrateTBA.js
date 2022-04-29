const processedTables = ["upload_file", "upload_file_morph"];

async function migrateTables() {
  // TODO have to migrate values
  console.log("Migrating TBA", processedTables);
}

const migrateTBA = {
  processedTables,
  migrateTables,
};

module.exports = {
  migrateTBA,
};
