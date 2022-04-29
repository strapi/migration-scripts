const { cloneDeepWith, camelCase, isObject, isString } = require("lodash");

function migrateUids(uid) {
  if (!uid) {
    return uid;
  }
  var result = uid;
  result = result.replace("strapi::", "admin::");
  result = result.replace("application::", "api::");
  result = result.replace(
    "plugins::users-permission",
    "plugin::users-permissions"
  );
  result = result.replace("plugins::", "plugin::");
  return result;
}

function migrateItemValues(item) {
  return cloneDeepWith(item, (value, key) => {
    if (key === "label" && !isObject(value)) {
      return camelCase(value);
    }
    if (key === "uid" && !isObject(value)) {
      return migrateUids(value);
    }
  });
}

module.exports = {
  migrateUids,
  migrateItemValues,
};
