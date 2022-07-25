const { migrate } = require("../migrate/helpers/migrate");
const { omit } = require("lodash");

const processedTables = ["categoryGroups"];

async function migrateTables() {
  await migrate("categoryGroups", "category_groups", (item) =>
    omit(
      {
        ...item,
        created_by_id: item.created_by,
        updated_by: item.updated_by_id,
      },
      ["shortDescription", "created_by", "updated_by"]
    )
  );
}

module.exports = {
  processedTables,
  migrateTables,
};
