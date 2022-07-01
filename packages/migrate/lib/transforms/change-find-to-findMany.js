/**
 * Replaces .query().find() with .query().findMany()
 *
 */
module.exports = function changeFindToFindMany(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const strapiQueries = root.find(j.CallExpression, {
    callee: {
      object: {
        callee: {
          object: {
            name: 'strapi',
          },
          property: {
            name: 'query',
          },
        },
      },
      property: {
        name: 'find',
      },
    },
  });

  strapiQueries.forEach(({ node }) => {
    return (node.callee.property.name = 'findMany');
  });

  return root.toSource({ quote: 'single' });
};
