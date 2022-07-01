const { resolve } = require('path');
const execa = require('execa');
const chalk = require('chalk');
const logger = require('./logger');

const isCleanGitRepo = async (path) => {
  try {
    await execa('git', ['-C', resolve(path), 'rev-parse']);
  } catch (error) {
    logger.error(
      `A ${chalk.yellow('git')} directory was not found at ${chalk.yellow(resolve(path))}.`
    );
    logger.error(`You should not run this command without ${chalk.yellow('git')}.`);
    process.exit(1);
  }

  try {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    if (stdout.length)
      throw Error(
        `The ${chalk.yellow('git')} directory at ${chalk.yellow(resolve(path))} is not clean`
      );
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
};

module.exports = isCleanGitRepo;
