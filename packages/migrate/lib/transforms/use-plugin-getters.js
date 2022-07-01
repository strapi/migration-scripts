const pluralize = require('pluralize');

module.exports = function usePluginGetters(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const getters = ['services', 'controllers', 'models', 'policy', 'middleware'];

  getters.forEach((getter) => {
    const foundGetter = root.find(j.MemberExpression, {
      object: {
        object: {
          callee: {
            object: {
              name: 'strapi',
            },
            property: {
              name: 'plugin',
            },
          },
        },
        property: {
          name: getter,
        },
      },
    });

    foundGetter.replaceWith(({ node }) => {
      const name = node.property.name || node.property.value;
      const property = j.callExpression(j.identifier(pluralize.singular(getter)), [
        j.literal(name),
      ]);

      return { ...node.object, property };
    });
  });

  return root.toSource({ quote: 'single' });
};
