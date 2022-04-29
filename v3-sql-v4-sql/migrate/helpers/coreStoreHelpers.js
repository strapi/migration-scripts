const apiTokenEntry = {
  key: "plugin_content_manager_configuration_content_types::admin::api-token",
  type: "object",
  environment: null,
  tag: null,
  value: {
    uid: "admin::api-token",
    settings: {
      bulkable: true,
      filterable: true,
      searchable: true,
      pageSize: 10,
      mainField: "name",
      defaultSortBy: "name",
      defaultSortOrder: "ASC",
    },
    metadatas: {
      id: { edit: {}, list: { label: "id", searchable: true, sortable: true } },
      name: {
        edit: {
          label: "name",
          description: "",
          placeholder: "",
          visible: true,
          editable: true,
        },
        list: { label: "name", searchable: true, sortable: true },
      },
      description: {
        edit: {
          label: "description",
          description: "",
          placeholder: "",
          visible: true,
          editable: true,
        },
        list: { label: "description", searchable: true, sortable: true },
      },
      type: {
        edit: {
          label: "type",
          description: "",
          placeholder: "",
          visible: true,
          editable: true,
        },
        list: { label: "type", searchable: true, sortable: true },
      },
      accessKey: {
        edit: {
          label: "accessKey",
          description: "",
          placeholder: "",
          visible: true,
          editable: true,
        },
        list: { label: "accessKey", searchable: true, sortable: true },
      },
      createdAt: {
        edit: {
          label: "createdAt",
          description: "",
          placeholder: "",
          visible: false,
          editable: true,
        },
        list: { label: "createdAt", searchable: true, sortable: true },
      },
      updatedAt: {
        edit: {
          label: "updatedAt",
          description: "",
          placeholder: "",
          visible: false,
          editable: true,
        },
        list: { label: "updatedAt", searchable: true, sortable: true },
      },
    },
    layouts: {
      list: ["id", "name", "description", "type"],
      editRelations: [],
      edit: [
        [
          { name: "name", size: 6 },
          { name: "description", size: 6 },
        ],
        [
          { name: "type", size: 6 },
          { name: "accessKey", size: 6 },
        ],
      ],
    },
  },
};

module.exports = {
  apiTokenEntry,
};
