const _ = require("lodash/fp");

function transformEntry(entry, model) {
  // transform attributes
  // transform relations

  const scalarAttributes = Object.keys(model.attributes).filter((key) => {
    return (
      _.has("type", model.attributes[key]) &&
      !["component", "dynamiczone"].includes(model.attributes[key].type)
    );
  });

  const cleanEntry = _.pipe(
    _.pick(scalarAttributes),
    _.omit(["_id", "__v", "createdAt", "updatedAt"])
  )(entry);

  const tmp = {
    ...cleanEntry,
  };

  if (
    _.has("createdAt", entry) &&
    (model.options.timestamps === true ||
      _.isUndefined(model.options.timestamps) ||
      model.options.timestamps[0] === "created_at")
  ) {
    tmp.created_at = entry.createdAt;
  }

  if (
    _.has("updatedAt", entry) &&
    (model.options.timestamps === true ||
      _.isUndefined(model.options.timestamps) ||
      model.options.timestamps[0] === "updated_at")
  ) {
    tmp.updated_at = entry.updatedAt;
  }

  return tmp;
}

module.exports = {
  transformEntry,
};
