const { resolve, join } = require("path");
const _ = require("lodash");

const isPathStrapiApp = (appPath) => {
  const pkgJSON = require(resolve(join(appPath, "package.json")));

  if (!_.has(pkgJSON, "dependencies.strapi")) {
    throw new Error(
      "The specified path is not a Strapi project. Please check the path and try again."
    );
  }
};

module.exports = isPathStrapiApp;
