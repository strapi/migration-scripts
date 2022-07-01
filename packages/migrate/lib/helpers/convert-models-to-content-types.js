/**
 * Migrate API folder structure to v4
 */

const { join } = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const pluralize = require("pluralize");

/**
 * @description Migrates settings.json to schema.json
 *
 * @param {string} apiPath Path to the current api
 * @param {string} contentTypeName Name of the current contentType
 */
const convertModelToContentType = async (apiPath, contentTypeName) => {
  const settingsJsonPath = join(
    apiPath,
    "models",
    `${contentTypeName}.settings.json`
  );

  const settingsExists = await fs.exists(settingsJsonPath);
  if (!settingsExists) {
    logger.error(`${contentTypeName}.settings.json does not exist`);
    return;
  }

  const v4SchemaJsonPath = join(
    apiPath,
    "content-types",
    contentTypeName,
    "schema.json"
  );

  try {
    // Read the settings.json file
    const settingsJson = await fs.readJSON(settingsJsonPath);
    // Create a copy
    const schemaJson = { ...settingsJson };
    const infoUpdate = {
      singularName: _.kebabCase(pluralize.singular(contentTypeName)),
      pluralName: _.kebabCase(pluralize(contentTypeName)),
      displayName: _.upperFirst(contentTypeName),
      name: contentTypeName,
    };

    // Modify the JSON
    _.set(schemaJson, "info", infoUpdate);
    // Create the new content-types/api/schema.json file
    await fs.ensureFile(v4SchemaJsonPath);
    // Write modified JSON to schema.json
    await fs.writeJSON(v4SchemaJsonPath, schemaJson, {
      spaces: 2,
    });
  } catch (error) {
    logger.error(
      `an error occured when migrating the model at ${settingsJsonPath} to a contentType at ${v4SchemaJsonPath} `
    );
  }

  const lifecyclePath = join(apiPath, "models", `${contentTypeName}.js`);
  const lifecyclesExist = await fs.exists(lifecyclePath);

  const v4LifecyclesPath = join(
    apiPath,
    "content-types",
    contentTypeName,
    "lifecycle.js"
  );

  if (lifecyclesExist) {
    try {
      await fs.move(lifecyclePath, v4LifecyclesPath);
    } catch (error) {
      logger.error(
        `failed to migrate lifecycles from ${lifecyclePath} to ${v4LifecyclesPath}`
      );
    }
  } else {
    logger.info(
      `will not create lifecycles since ${contentTypeName}.js was not found`
    );
  }
};

/**
 *
 * @param {string} apiPath Path to the current API
 */
const updateContentTypes = async (apiPath) => {
  const exists = await fs.exists(join(apiPath, "models"));

  if (!exists) return;

  const allModels = await fs.readdir(join(apiPath, "models"), {
    withFileTypes: true,
  });

  const allModelFiles = allModels.filter(
    (f) => f.isFile() && f.name.includes("settings")
  );

  if (!allModelFiles.length) {
    await fs.remove(join(apiPath, "models"));
  }

  for (const model of allModelFiles) {
    const [contentTypeName] = model.name.split(".");
    await convertModelToContentType(apiPath, contentTypeName);
  }

  // all models have been deleted, remove the directory
  await fs.remove(join(apiPath, "models"));
};

module.exports = updateContentTypes;
