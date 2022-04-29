const pluralize = require("pluralize");

function mapAction(action) {
  switch (action) {
    case "findone":
      return "findOne";
    case "bulkdelete":
      return "bulkDelete";
    case "findcontenttypes":
      return "findContentTypes";
    case "generateuid":
      return "generateUid";
    case "deletecomponent":
      return "deleteComponent";
    case "createcontenttype":
      return "createContentType";
    case "getsettings":
      return "getSettings";
    case "createlocale":
      return "createLocale";
    case "findcontenttypeconfiguration":
      return "findContentTypeConfiguration";
    case "createorupdate":
      return "createOrUpdate";
    case "checkuidavailability":
      return "checkUidAvailability";
    case "createcomponent":
      return "createComponent";
    case "getconnections":
      return "getConnections";
    case "updatecontenttype":
      return "updateContentType";
    case "listisolocales":
      return "listIsoLocales";
    case "emailconfirmation":
      return "emailConfirmation";
    case "deleterole":
      return "deleteRole";
    case "getproviders":
      return "getProviders";
    case "searchusers":
      return "searchUsers";
    case "updaterole":
      return "updateRole";
    case "previewmanyrelations":
      return "previewManyRelations";
    case "findcomponents":
      return "findComponents";
    case "editcategory":
      return "editCategory";
    case "getcomponents":
      return "getComponents";
    case "getcontenttypes":
      return "getContentTypes";
    case "getnonlocalizedattributes":
      return "getNonLocalizedAttributes";
    case "updatelocale":
      return "updateLocale";
    case "sendemailconfirmation":
      return "sendEmailConfirmation";
    case "updatesettings":
      return "updateSettings";
    case "forgotpassword":
      return "forgotPassword";
    case "getemailtemplate":
      return "getEmailTemplate";
    case "getroles":
      return "getRoles";
    case "updateemailtemplate":
      return "updateEmailTemplate";
    case "updatecomponentconfiguration":
      return "updateComponentConfiguration";
    case "updatecontenttypeconfiguration":
      return "updateContentTypeConfiguration";
    case "deletecategory":
      return "deleteCategory";
    case "updatecomponent":
      return "updateComponent";
    case "getcontenttype":
      return "getContentType";
    case "listlocales":
      return "listLocales";
    case "resetpassword":
      return "resetPassword";
    case "destroyall":
      return "destroyAll";
    case "createrole":
      return "createRole";
    case "getpolicies":
      return "getPolicies";
    case "findcomponentconfiguration":
      return "findComponentConfiguration";
    case "findcontenttypessettings":
      return "findContentTypesSettings";
    case "getpermissions":
      return "getPermissions";
    case "getroutes":
      return "getRoutes";
    case "updateproviders":
      return "updateProviders";
    case "getadvancedsettings":
      return "getAdvancedSettings";
    case "getrole":
      return "getRole";
    case "updateadvancedsettings":
      return "updateAdvancedSettings";
    case "getreservednames":
      return "getReservedNames";
    case "getcomponent":
      return "getComponent";
    case "deletecontenttype":
      return "deleteContentType";
    case "deletelocale":
      return "deleteLocale";
    default:
      return action;
  }
}

function migrateUserPermissionAction(type, controller, action) {
  var uid = "";
  if (type === "application") {
    uid = `api::${controller}`;
  } else {
    uid = `plugin::${type}`;
  }
  const migratedController = pluralize(controller, 1);
  const migratedAction = mapAction(action);
  return `${uid}.${migratedController}.${migratedAction}`;
}

module.exports = {
  migrateUserPermissionAction,
};
