const { snakeCase } = require("lodash/fp");

function migrateField(fieldName) {
  switch (fieldName) {
    case "created_by":
      return "created_by_id";
    case "updated_by":
      return "updated_by_id";
    default:
      return snakeCase(fieldName);
  }
}

function migrateItem(item) {
  const migratedItem = {};
  for (const [key, value] of Object.entries(item)) {
    migratedItem[migrateField(key)] = value;
  }
  // TODO use lodash mapKeys
  return migratedItem;
}

function migrateItems(items, itemMapper = undefined) {
  return items
    .map(itemMapper ?? migrateItem)
    .filter((item) => item !== undefined);
}

module.exports = {
  migrateField,
  migrateItem,
  migrateItems,
};
