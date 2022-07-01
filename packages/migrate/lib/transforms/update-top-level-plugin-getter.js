// Update plugin getters
// strapi.plugins['plugin-name'] => strapi.plugin("plugin-name")
// strapi.plugins.pluginName => strapi.plugin("plugin-name")
const _ = require('lodash');

module.exports = function updateTopLevelGetter(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const foundPlugin = root.find(j.MemberExpression, {
    object: {
      object: {
        name: 'strapi',
      },
      property: {
        name: 'plugins',
      },
    },
  });

  foundPlugin.replaceWith(({ node }) => {
    const name = node.property.name ? node.property.name : node.property.value;

    return j.callExpression(j.memberExpression(j.identifier('strapi'), j.identifier('plugin')), [
      j.literal(_.kebabCase(name)),
    ]);
  });

  return root.toSource({ quote: 'single' });
};
