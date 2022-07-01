const path = require("path");
const fse = require("fs-extra");
const chalk = require("chalk");
const { migrateApiFolder, migrateDependencies } = require("./helpers");
const { isPathStrapiApp, isCleanGitRepo } = require("./utils");

const NO_COPY_PATHS = ["node_modules", ".cache", "build"];

module.exports = {
  projectStructure,
};

async function projectStructure(appPath, ctx) {
  const { spinner } = ctx;

  spinner.start("Migrating project structure");

  // backup
  const backupPath = path.join(appPath, "..", "app.bak/");

  await fse.remove(backupPath);
  await fse.copy(appPath, backupPath, {
    filter(src, dest) {
      const ignorePath = NO_COPY_PATHS.some((ignore) =>
        src.startsWith(path.join(appPath, ignore))
      );

      if (ignorePath) {
        return false;
      }
      return true;
    },
  });

  spinner.info(`Application backup available at ${chalk.blue(backupPath)}`);

  await migration(appPath);

  spinner.succeed();
}

async function migration(appPath) {
  await isCleanGitRepo(appPath);
  await isPathStrapiApp(appPath);
  await migrateDependencies(appPath);
  await migrateApiFolder(appPath);
}
