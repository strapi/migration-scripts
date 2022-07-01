module.exports = function changeModelGettersToContentTypes(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const models = root.find(j.Identifier, { name: 'models' });

  models.forEach(({ node }) => {
    node.name = 'contentTypes';
  });

  return root.toSource({ quote: 'single' });
};
