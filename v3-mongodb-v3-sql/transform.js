const _ = require('lodash/fp');

const isScalar = (attribute) =>
  _.has('type', attribute) && !['component', 'dynamiczone'].includes(attribute.type);

const DEFAULT_TIMESTAMPS = ['createdAt', 'updatedAt'];
const getTimestampKeys = (model) => {
  const tsOption = _.getOr(DEFAULT_TIMESTAMPS, 'options.timestamps', model);

  if (tsOption === true) {
    return DEFAULT_TIMESTAMPS;
  }

  if (tsOption === false) {
    return [];
  }

  if (!Array.isArray(tsOption) || tsOption.length != 2) {
    throw new Error(`Expected model.options.timestamps to be true or an array with 2 string`);
  }

  return tsOption;
};

function transformEntry(entry, model) {
  // transform attributes
  const res = {};

  const [createdAtKey, updatedAtKey] = getTimestampKeys(model);

  if (createdAtKey) {
    res.created_at = entry[createdAtKey];
  }

  if (updatedAtKey) {
    res.updated_at = entry[updatedAtKey];
  }

  Object.entries(model.attributes).forEach(([key, attribute]) => {
    if (isScalar(attribute)) {
      if(!Object.keys(entry).includes(key)) {//handle undefined attribute in entry w/ default value
        if (attribute.default && attribute.type === 'json') res[key] = JSON.stringify(attribute.default);
        else if (attribute.default) res[key] = attribute.default;
        return;
      }

      if (attribute.type === 'json') {
        res[key] = JSON.stringify(entry[key]);
        return;
      }

      res[key] = entry[key];
    }
  });

  return res;
}

module.exports = {
  transformEntry,
};
