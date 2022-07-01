const { join } = require('path');
const fs = require('fs-extra');

const chalk = require('chalk');

const { logger } = require('../../global/utils');

/**
 *
 * @param {string} apiPath Path to the current api
 */
const updatePolicies = async (apiPath) => {
  const v3PoliciesPath = join(apiPath, 'config', 'policies');

  const exists = await fs.exists(v3PoliciesPath);
  if (!exists) return;

  const v3Policies = await fs.readdir(v3PoliciesPath, { withFileTypes: true });
  const policyFiles = v3Policies.filter((fd) => fd.isFile());

  if (!policyFiles.length) {
    await fs.remove(v3PoliciesPath);
  }

  const v4PoliciesPath = join(apiPath, 'policies');
  try {
    for (const policy of policyFiles) {
      await fs.copy(join(v3PoliciesPath, policy.name), join(v4PoliciesPath, policy.name));
    }
    // delete the v3 policy folder
    await fs.remove(v3PoliciesPath);
  } catch (error) {
    logger.error(
      `an error occured when migrating a policy from ${chalk.yellow(
        v3PoliciesPath
      )} to ${chalk.yellow(v4PoliciesPath)}`
    );
  }
};

module.exports = updatePolicies;
