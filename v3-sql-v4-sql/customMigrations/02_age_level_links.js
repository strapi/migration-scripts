// const { BATCH_SIZE } = require('./constants');
// const { migrateItems } = require('./migrateFields');
// const { pick } = require('lodash');
// const { resolveDestTableName, resolveSourceTableName } = require('./tableNameHelpers');
const { dbV3, dbV4 } = require('../config/database');
const {
  resolveSourceTableName,
  resolveDestTableName,
} = require('../migrate/helpers/tableNameHelpers');

// Tables that should not be proccessed later

const tableInstructions = {
  age_levels_parents__age_levels_children: {
    destTable: 'age_levels_parents_links',
    ids: [
      ['age_level_id', 'age-level_id'],
      ['inv_age_level_id', 'parent_id'],
    ],
    counts: [
      ['age_level_order', 'age-level_id'],
      ['inv_age_level_order', 'parent_id'],
    ],
  },
  age_levels_programs__programs_sub_age_levels: [
    {
      destTable: 'programs_age_levels_links',
      ids: [
        ['program_id', 'program_id'],
        ['age_level_id', 'age-level_id'],
      ],
      counts: [
        ['age_level_order', 'age-level_id'],
        ['program_order', 'program_id'],
      ],
    },
    {
      destTable: 'programs_sub_age_levels_links',
      ids: [
        ['program_id', 'program_id'],
        ['age_level_id', 'age-level_id'],
      ],
      counts: [
        ['age_level_order', 'age-level_id'],
        ['program_order', 'program_id'],
      ],
    },
  ],
  age_levels_item_suggestions__item_suggestions_age_levels: {
    destTable: 'item_suggestions_age_levels_links',
    ids: [
      ['item_suggestion_id', 'item-suggestion_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [
      ['age_level_order', 'age-level_id'],
      ['item_suggestion_order', 'item-suggestion_id'],
    ],
  },
  categories_programs__programs_categories: {
    destTable: 'programs_categories_links',
    ids: [
      ['program_id', 'program_id'],
      ['category_id', 'category_id'],
    ],
    counts: [
      ['category_order', 'category_id'],
      ['program_order', 'program_id'],
    ],
  },
  item_categories_item_suggestions__item_suggestions_categories: {
    destTable: 'item_suggestions_categories_links',
    ids: [
      ['item_suggestion_id', 'item-suggestion_id'],
      ['item_category_id', 'item-category_id'],
    ],
    counts: [
      ['item_category_order', 'item-category_id'],
      ['item_suggestion_order', 'item-suggestion_id'],
    ],
  },
  macros_macros_categories__macros_categories_macros: {
    destTable: 'macros_macros_categories_links',
    ids: [
      ['macro_id', 'macro_id'],
      ['macros_category_id', 'macros-category_id'],
    ],
    counts: [
      ['macros_category_order', 'macros-category_id'],
      ['macro_order', 'macro_id'],
    ],
  },
  masterclasses__age_levels: {
    destTable: 'masterclasses_age_levels_links',
    ids: [
      ['masterclass_id', 'masterclass_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  masterclasses__sub_age_levels: {
    destTable: 'masterclasses_sub_age_levels_links',
    ids: [
      ['masterclass_id', 'masterclass_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  posts__age_levels: {
    destTable: 'posts_age_levels_links',
    ids: [
      ['post_id', 'post_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  posts__sub_age_levels: {
    destTable: 'posts_sub_age_levels_links',
    ids: [
      ['post_id', 'post_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  programs_program_experts__program_experts_programs: {
    destTable: 'programs_program_experts_links',
    ids: [
      ['program_id', 'program_id'],
      ['program_expert_id', 'program-expert_id'],
    ],
    counts: [
      ['program_expert_order', 'program-expert_id'],
      ['program_order', 'program_id'],
    ],
  },
  recipes__food_restrictions: {
    destTable: 'recipes_food_restrictions_links',
    ids: [
      ['recipe_id', 'recipe_id'],
      ['food_restriction_id', 'food-restriction_id'],
    ],
    counts: [['food_restriction_order', 'food-restriction_id']],
  },
  todo_list_suggestions__age_levels: {
    destTable: 'todo_list_suggestions_age_levels_links',
    ids: [
      ['todo_list_suggestion_id', 'todo_list_suggestion_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  todo_list_suggestions__coming_age_levels: {
    destTable: 'todo_list_suggestions_coming_age_levels_links',
    ids: [
      ['todo_list_suggestion_id', 'todo_list_suggestion_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  Guide__age_levels: {
    destTable: 'guide_age_levels_links',
    ids: [
      ['guide_id', 'Guide_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
  Guide__sub_age_levels: {
    destTable: 'guide_sub_age_levels_links',
    ids: [
      ['guide_id', 'Guide_id'],
      ['age_level_id', 'age-level_id'],
    ],
    counts: [['age_level_order', 'age-level_id']],
  },
};
const processedTables = Object.values(tableInstructions).map((t) => t.destTable);

async function runOneTable(tableV3, instructions) {
  const tableV4 = instructions.destTable;

  const originalData = await dbV3(resolveSourceTableName(tableV3)).select('*');

  const counts = instructions.counts.reduce((acc, [newName]) => {
    acc[newName] = {};
    return acc;
  }, {});

  const addedList = {};
  const migratedItems = originalData
    .map((item) => {
      const result = {};
      let added = [];
      instructions.ids.forEach(([newName, oldName]) => {
        result[newName] = item[oldName];
        added.push(item[oldName]);
      });

      const path = added.join(';;');
      if (addedList[path]) {
        return;
      }
      addedList[path] = true;

      instructions.counts.forEach(([newName, oldName]) => {
        counts[newName][item[oldName]] = (counts[newName][item[oldName]] || 0) + 1;
        result[newName] = counts[newName][item[oldName]];
      });
      return result;
    })
    .filter(Boolean);

  if (migratedItems.length) {
    await dbV4(resolveDestTableName(tableV4)).truncate();
    await dbV4(resolveDestTableName(tableV4)).insert(migratedItems);
  }
}

// Custom migration function, handles DB reads and writes
async function migrateTables() {
  for (const [tableV3, instructions] of Object.entries(tableInstructions)) {
    if (Array.isArray(instructions)) {
      for (const instruction of instructions) {
        await runOneTable(tableV3, instruction);
      }
    } else {
      await runOneTable(tableV3, instructions);
    }
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
