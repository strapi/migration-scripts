const path = require("path");
const fse = require("fs-extra");

const { program } = require("commander");
const ora = require("ora");
const chalk = require("chalk");
const inquirer = require("inquirer");

const migrate = require("./migrate");

const pkgJson = require("../package.json");

const getAppPath = async (dir) => {
  if (dir) {
    return path.resolve(dir);
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "path",
      message: "Enter the path to your Strapi application",
    },
  ]);

  return answers.path;
};

program
  .name("@strap/migrate")
  .version(pkgJson.version)
  .showHelpAfterError()
  .argument("[dir]", "Application path")
  .action(async function run(dir) {
    const appPath = await getAppPath(dir);

    // Check the path exists
    const exists = await fse.pathExists(appPath);
    if (!exists) {
      console.error(
        `${chalk.red("Error")} path ${chalk.blue(appPath)} does not exist`
      );
      process.exit(1);
    }

    console.log(`> Migration Strapi app at ${chalk.blue(appPath)}`);

    const spinner = ora({ spinner: "dots" });

    const ctx = { spinner };

    await migrate.projectStructure(appPath, ctx);

    spinner.start("Migrating database");

    await new Promise((res) => setTimeout(res, 1000));

    spinner.succeed();

    console.log("> Migration complete ✅");
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch(console.dir);
