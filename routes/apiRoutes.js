// const verifySignUp = require('./verifySignUp');
const authJwt = require("./verifyJwtToken");

module.exports = function (app) {
  console.log("apiRoutes.js routes work");
  // const express=require('express')

  const controller = require("../controller/user.controller.js");
  const roleController = require("../controller/roles.controller.js");
  // const client_role_getController = require('../controller/client_role_get.controller.js');
  const subscription_packagesController = require("../controller/subscription_packages.controller.js");
  const librariesController = require("../controller/libraries.controller.js");
  const organization_librariesController = require("../controller/organization_libraries.controller.js");
  const organizationController = require("../controller/organization.controller.js");
  const countriesController = require("../controller/countries.controller.js");
  const chaptersController = require("../controller/chapters.controller.js");
  const standardsController = require("../controller/standards.controller.js");
  const sub_standardsController = require("../controller/sub_standards.controller.js");
  const surveyor_categoriesController = require("../controller/surveyor_categories.controller.js");
  const session_classesController = require("../controller/session_classes.controller.js");
  const upload = require("../middleware/upload.js");
  const csv = require("../middleware/csv.js");
  const unit_focus_areasController = require("../controller/unit_focus_areas.controller.js");
  const admin_activitiesController = require("../controller/admin_activities.controller.js");
  const activity_elementsController = require("../controller/activity_elements.controller.js");

  // app.post('/api/auth/signup', [verifySignUp.checkDuplicateUserNameOrEmail, verifySignUp.checkRolesExisted], controller.signup);

  // app.post('/api/auth/signin', controller.signin);

  // app.get('/api/test/user', [authJwt.verifyToken], controller.userContent);

  // app.get('/api/test/pm', [authJwt.verifyToken, authJwt.isPmOrAdmin], controller.managementBoard);

  // app.get('/api/test/admin', [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);

  app.post("/api/user/create", [authJwt.verifyToken], controller.create);
  app.get("/api/user/get", [authJwt.verifyToken], controller.get);
  app.get(
    "/api/user/getAssignedCompany",
    [authJwt.verifyToken],
    controller.getAssignedCompany
  );
  app.get(
    "/api/clientuserlist/get",
    [authJwt.verifyToken],
    controller.getClientUserList
  );
  app.delete("/api/user/delete/:id", [authJwt.verifyToken], controller.delete);
  app.post("/api/admin/create", [authJwt.verifyToken], controller.AdminCreate);
  app.post("/api/user/register", controller.register);
  app.post("/api/auth/login", controller.login);
  app.put("/api/passwordset", controller.passwordset);
  app.post("/api/forget", controller.forgot);
  app.post("/api/forgetfinal", controller.forgotFinal);
  app.post("/api/userforget", controller.userforget);
  app.get(
    "/api/user/statusChange/:id/:status",
    [authJwt.verifyToken],
    controller.statusChange
  );

  app.post("/api/role/create", [authJwt.verifyToken], roleController.create);
  app.put("/api/role/update", [authJwt.verifyToken], roleController.update);
  app.get("/api/role/get", [authJwt.verifyToken], roleController.get);
  app.get(
    "/api/role/getById/:id",
    [authJwt.verifyToken],
    roleController.getById
  );
  app.delete(
    "/api/role/delete/:id",
    [authJwt.verifyToken],
    roleController.delete
  );

  // app.post('/api/client_role_get/create', client_role_getController.create)
  // app.put('/api/client_role_get/update', client_role_getController.update)
  // app.get('/api/client_role_get/get', client_role_getController.get)
  // app.get('/api/client_role_get/getById', client_role_getController.getById)
  // app.delete('/api/client_role_get/delete', client_role_getController.delete)

  // app.post('/api/companies/create', companiesController.create)
  // apupost('/api/companies/update', companiesController.update)
  // app.get('/api/companies/get', companiesController.get)
  // app.get('/api/mastercompanies/get', companiesController.mastercompanies)
  // app.get('/api/companies/getById/:id', companiesController.getById)
  // app.get('/api/companies/getByMasterCompanyId/:id', companiesController.getByMasterCompanyId)
  // app.delete('/api/companies/delete/:id', companiesController.delete)
  // app.get('/api/companies/statusChange/:id/:status', companiesController.statusChange)
  app.get(
    "/api/organization/packageStartdateupdate",
    organizationController.packageStartDateUpdate
  );
  app.post(
    "/api/organization/create",
    [authJwt.verifyToken],
    organizationController.create
  );
  app.put(
    "/api/organization/update",
    [authJwt.verifyToken],
    organizationController.update
  );

  app.put(
    "/api/organization/manageUser",
    [authJwt.verifyToken],
    organizationController.manageUserupdate
  ); //this api is for superadmin manage user
  app.put(
    "/api/organization/organizationuserupdate",
    [authJwt.verifyToken],
    organizationController.organizationuserupdate
  );
  app.get(
    "/api/organization/get",
    [authJwt.verifyToken],
    organizationController.get
  );
  app.get(
    "/api/organization/getById/:id",
    [authJwt.verifyToken],
    organizationController.getById
  );
  app.delete(
    "/api/organization/delete/:id",
    [authJwt.verifyToken],
    organizationController.delete
  );

  app.get(
    "/api/organization/statusChange/:id/:status",
    [authJwt.verifyToken],
    organizationController.statusChange
  );
  app.get(
    "/api/organization/getByMasterCompanyId/:id",
    [authJwt.verifyToken],
    organizationController.getByMasterCompanyId
  );

  app.get(
    "/api/organization/getByMasterCompanyId2/:id",
    [authJwt.verifyToken],
    organizationController.getByMasterCompanyIdWithSub
  ); //parent compant with sub company

  app.get(
    "/api/masterorganization/get",
    [authJwt.verifyToken],
    organizationController.masterorganization
  );
  app.get(
    "/api/city/get",
    [authJwt.verifyToken],
    organizationController.cityGet
  );
  app.get(
    "/api/organization/getMasterWithsub",
    [authJwt.verifyToken],
    organizationController.getMasterWithsub
  );

  app.get(
    "/api/organization/reportget",
    [authJwt.verifyToken],
    organizationController.Reportget
  );

  app.post(
    "/api/subscription_packages/create",
    [authJwt.verifyToken],
    subscription_packagesController.create
  );
  app.put(
    "/api/subscription_packages/update",
    [authJwt.verifyToken],
    subscription_packagesController.update
  );
  app.get(
    "/api/subscription_packages/get",
    [authJwt.verifyToken],
    subscription_packagesController.get
  );
  app.get(
    "/api/subscription_packages/getById/:id",
    [authJwt.verifyToken],
    subscription_packagesController.getById
  );
  app.delete(
    "/api/subscription_packages/delete/:id",
    [authJwt.verifyToken],
    subscription_packagesController.delete
  );

  //client admin with company and role
  app.get(
    "/api/ClientAdminGet/get",
    [authJwt.verifyToken],
    controller.ClientAdminGet
  );

  // app.post('/api/organization_libraries/create', organization_librariesController.create)
  // app.put('/api/organization_libraries/update', organization_librariesController.update)
  // app.get('/api/organization_libraries/get', organization_librariesController.get)
  app.get(
    "/api/organization_libraries/getByOrganizationId/:id",
    [authJwt.verifyToken],
    organization_librariesController.getByOrganizationId
  );
  app.get(
    "/api/organization_libraries/getByLibraryId/:id",
    [authJwt.verifyToken],
    organization_librariesController.getByLibraryId
  );

  // app.delete('/api/organization_libraries/delete/:id', organization_librariesController.delete)
  // app.delete('/api/organization_libraries/statusChange/:id/:status', organization_librariesController.statusChange)

  app.post(
    "/api/libraries/create",
    [authJwt.verifyToken],
    librariesController.create
  );
  app.put(
    "/api/libraries/update",
    [authJwt.verifyToken],
    librariesController.update
  );
  app.get(
    "/api/librarychildcount/:id",
    [authJwt.verifyToken],
    librariesController.count
  );
  app.put(
    "/api/libraries/archive/:id",
    [authJwt.verifyToken],
    librariesController.archive
  );
  app.get("/api/libraries/get", [authJwt.verifyToken], librariesController.get);
  app.get(
    "/api/libraries/getById/:id",
    [authJwt.verifyToken],
    librariesController.getById
  );
  app.delete(
    "/api/libraries/delete/:id",
    [authJwt.verifyToken],
    librariesController.delete
  );
  app.get(
    "/api/libraries/deleteCheck/:id",
    [authJwt.verifyToken],
    librariesController.deleteCheck
  );
  app.get(
    "/api/libraries/statusChange/:id/:status",
    [authJwt.verifyToken],
    librariesController.statusChange
  );

  app.post(
    "/api/countries/create",
    [authJwt.verifyToken],
    countriesController.create
  );
  app.put(
    "/api/countries/update",
    [authJwt.verifyToken],
    countriesController.update
  );
  app.get("/api/countries/get", [authJwt.verifyToken], countriesController.get);
  app.get(
    "/api/countries/getById/:id",
    [authJwt.verifyToken],
    countriesController.getById
  );
  app.delete(
    "/api/countries/delete/:id",
    [authJwt.verifyToken],
    countriesController.delete
  );
  app.get(
    "/api/countries/statusChange/:id/:status",
    [authJwt.verifyToken],
    countriesController.statusChange
  );

  app.post(
    "/api/chapters/create",
    [authJwt.verifyToken],
    chaptersController.create
  );
  app.put(
    "/api/chapters/update",
    [authJwt.verifyToken],
    chaptersController.update
  );
  app.get("/api/chapters/get", [authJwt.verifyToken], chaptersController.get);
  app.get(
    "/api/chapters/getById/:id",
    [authJwt.verifyToken],
    chaptersController.getById
  );
  app.get(
    "/api/chapters/getByLibraryId",
    [authJwt.verifyToken],
    chaptersController.getByLibraryId
  );

  app.delete(
    "/api/chapters/delete/:id",
    [authJwt.verifyToken],
    chaptersController.delete
  );
  app.get(
    "/api/chapters/statusChange/:id/:status",
    [authJwt.verifyToken],
    chaptersController.statusChange
  );

  app.post(
    "/api/standards/create",
    [authJwt.verifyToken],
    standardsController.create
  );
  app.put(
    "/api/standards/update",
    [authJwt.verifyToken],
    standardsController.update
  );
  app.get("/api/standards/get", [authJwt.verifyToken], standardsController.get);
  app.get(
    "/api/standards/getById/:id",
    [authJwt.verifyToken],
    standardsController.getById
  );
  app.delete(
    "/api/standards/delete/:id",
    [authJwt.verifyToken],
    standardsController.delete
  );
  app.get(
    "/api/standards/statusChange/:id/:status",
    [authJwt.verifyToken],
    standardsController.statusChange
  );
  app.get(
    "/api/standards/getChapterById/:id",
    [authJwt.verifyToken],
    standardsController.getChapterById
  );
  app.get(
    "/api/standards/getBylibraryId",
    [authJwt.verifyToken],
    standardsController.getBylibraryId
  );
  // app.get('/api/standards/getByIdCommon', standardsController.getByIdCommon)

  app.post(
    "/api/sub_standards/create",
    upload.single("file"),
    [authJwt.verifyToken],
    sub_standardsController.create
  );
  app.put(
    "/api/sub_standards/update",
    upload.single("file"),
    [authJwt.verifyToken],
    sub_standardsController.update
  );
  app.get(
    "/api/sub_standards/get",
    [authJwt.verifyToken],
    sub_standardsController.get
  );
  app.get(
    "/api/sub_standards/getById/:id",
    [authJwt.verifyToken],
    sub_standardsController.getById
  );
  app.delete(
    "/api/sub_standards/delete/:id",
    [authJwt.verifyToken],
    sub_standardsController.delete
  );
  app.get(
    "/api/sub_standards/statusChange/:id/:status",
    [authJwt.verifyToken],
    sub_standardsController.statusChange
  );
  app.get(
    "/api/sub_standards/getByStandardId/:id",
    [authJwt.verifyToken],
    sub_standardsController.getByStandardId
  );
  app.get(
    "/api/sub_standards/getByIdCommon",
    [authJwt.verifyToken],
    sub_standardsController.getByIdCommon
  );

  app.post(
    "/api/surveyor_categories/create",
    [authJwt.verifyToken],
    surveyor_categoriesController.create
  );
  app.put(
    "/api/surveyor_categories/update",
    [authJwt.verifyToken],
    surveyor_categoriesController.update
  );
  app.get(
    "/api/surveyor_categories/get",
    [authJwt.verifyToken],
    surveyor_categoriesController.get
  );
  app.get(
    "/api/surveyor_categories/getById/:id",
    [authJwt.verifyToken],
    surveyor_categoriesController.getById
  );
  app.delete(
    "/api/surveyor_categories/delete/:id",
    [authJwt.verifyToken],
    surveyor_categoriesController.delete
  );
  app.get(
    "/api/surveyor_categories/statusChange/:id/:status",
    [authJwt.verifyToken],
    surveyor_categoriesController.statusChange
  );

  app.post(
    "/api/session_classes/create",
    [authJwt.verifyToken],
    session_classesController.create
  );
  app.put(
    "/api/session_classes/update",
    [authJwt.verifyToken],
    session_classesController.update
  );
  app.get(
    "/api/session_classes/get",
    [authJwt.verifyToken],
    session_classesController.get
  );
  app.get(
    "/api/session_classes/getById/:id",
    [authJwt.verifyToken],
    session_classesController.getById
  );
  app.delete(
    "/api/session_classes/delete/:id",
    [authJwt.verifyToken],
    session_classesController.delete
  );
  app.get(
    "/api/session_classes/statusChange/:id/:status",
    [authJwt.verifyToken],
    session_classesController.statusChange
  );

  app.get(
    "/api/unit_focus_areas/get",
    [authJwt.verifyToken],
    unit_focus_areasController.get
  );
  app.get(
    "/api/unit_focus_areas/getByLibraryId/:id",
    [authJwt.verifyToken],
    unit_focus_areasController.getByLibraryId
  );
  app.post(
    "/api/unit_focus_areas/create",
    [authJwt.verifyToken],
    unit_focus_areasController.create
  );
  app.put(
    "/api/unit_focus_areas/update",
    [authJwt.verifyToken],
    unit_focus_areasController.update
  );
  app.delete(
    "/api/unit_focus_areas/delete/:id",
    [authJwt.verifyToken],
    unit_focus_areasController.delete
  );

  // app.get(
  //   "/api/admin_activitieslist", 
  //   admin_activitiesController.getActivityList
  // );

  app.post(
    "/api/admin_activities/create",
    [authJwt.verifyToken],
    upload.single("file"),
    admin_activitiesController.create
  );
  app.put(
    "/api/admin_activities/update",
    [authJwt.verifyToken],
    upload.single("file"),
    admin_activitiesController.update
  );
  app.get(
    "/api/admin_activities/get",
    [authJwt.verifyToken],
    admin_activitiesController.get
  );
  app.get(
    "/api/admin_activities/getById/:id",
    [authJwt.verifyToken],
    admin_activitiesController.getById
  );

  app.get(
    "/api/admin_activities/getByIdUpdator/:id",
    [authJwt.verifyToken],
    admin_activitiesController.getById_updator
  );
  app.delete(
    "/api/admin_activities/delete/:id",
    [authJwt.verifyToken],
    admin_activitiesController.delete
  );
  app.get(
    "/api/admin_activities/statusChange/:id/:status",
    [authJwt.verifyToken],
    admin_activitiesController.statusChange
  );

  app.get(
    "/api/admin_activities/activitytypeGet",
    [authJwt.verifyToken],
    admin_activitiesController.activityTypeGet
  );
  app.get(
    "/api/admin_activities/getByIdCommon",
    [authJwt.verifyToken],
    admin_activitiesController.getByIdCommon
  );
  app.get(
    "/clientapi/client_activities/getByIdCommon",
    [authJwt.verifyToken],
    admin_activitiesController.clientgetByIdCommon
  );

  app.post(
    "/api/activity_elements/create",
    [authJwt.verifyToken],
    activity_elementsController.create
  );
  app.post(
    "/api/activity_elements/update",
    [authJwt.verifyToken],
    activity_elementsController.update
  );
  app.get(
    "/api/activity_elements/get",
    [authJwt.verifyToken],
    activity_elementsController.get
  );
  app.get(
    "/api/activity_elements/getById/:id",
    [authJwt.verifyToken],
    activity_elementsController.getById
  );
  app.delete(
    "/api/activity_elements/delete/:id",
    [authJwt.verifyToken],
    activity_elementsController.delete
  );
  app.get(
    "/api/activity_elements/statusChange/:id/:status",
    [authJwt.verifyToken],
    activity_elementsController.statusChange
  );
  // ===client admin===

  const activity_mappingController = require("../controller/activity_mapping.controller.js");
  app.post(
    "/api/activity_mapping/create",
    [authJwt.verifyToken],
    activity_mappingController.create
  );
  app.post(
    "/api/activity_mapping/update",
    [authJwt.verifyToken],
    activity_mappingController.update
  );
  app.get(
    "/api/activity_mapping/get",
    [authJwt.verifyToken],
    activity_mappingController.get
  );
  app.get(
    "/api/activity_mapping/getById/:id",
    [authJwt.verifyToken],
    activity_mappingController.getById
  );
  app.delete(
    "/api/activity_mapping/delete/:id",
    [authJwt.verifyToken],
    activity_mappingController.delete
  );
  app.get(
    "/api/activity_mapping/statusChange/:id/:status",
    [authJwt.verifyToken],
    activity_mappingController.statusChange
  );

  const auditsController = require("../controller/audits.controller.js");
  app.post(
    "/api/audits/create",
    [authJwt.verifyToken],
    auditsController.create
  );
  app.post(
    "/api/audits/update",
    [authJwt.verifyToken],
    auditsController.update
  );
  app.get("/api/audits/get", [authJwt.verifyToken], auditsController.get);
  app.get(
    "/api/audits/getById/:id",
    [authJwt.verifyToken],
    auditsController.getById
  );
  app.delete(
    "/api/audits/delete/:id",
    [authJwt.verifyToken],
    auditsController.delete
  );
  app.get(
    "/api/audits/statusChange/:id/:status",
    [authJwt.verifyToken],
    auditsController.statusChange
  );

  const organization_typeController = require("../controller/organization_type.controller.js");
  app.post(
    "/api/organization_type/create",
    [authJwt.verifyToken],
    organization_typeController.create
  );
  app.put(
    "/api/organization_type/update",
    [authJwt.verifyToken],
    organization_typeController.update
  );
  app.get(
    "/api/organization_type/get",
    [authJwt.verifyToken],
    organization_typeController.get
  );
  app.get(
    "/api/organizationbyType/getbyId/:id",
    [authJwt.verifyToken],
    organizationController.getbyOrgType
  );
  app.get(
    "/api/organizations/getAll",
    [authJwt.verifyToken],
    organizationController.getAllOrgs
  );

  // app.get('/api/organization_type/getById/:id', organization_typeController.getById)
  // app.delete('/api/organization_type/delete/:id', organization_typeController.delete)
  // app.get('/api/organization_type/statusChange/:id/:status', organization_typeController.statusChange)

  // Dashboard
  const dashboardController = require("../controller/dashboard.controller.js");

  app.get(
    "/api/dashboard/licence",
    [authJwt.verifyToken],
    dashboardController.dashboardLicence
  );
  app.get(
    "/api/superAdminDashboard/subscriberCount",
    [authJwt.verifyToken],
    dashboardController.subscriberCount
  );
  app.get(
    "/api/superAdminDashboard/ComplianceChart1",
    [authJwt.verifyToken],
    dashboardController.complienceRatePerSubscriber
  );
  app.post(
    "/api/superAdminDashboard/ComplianceChart2",
    [authJwt.verifyToken],
    dashboardController.complienceEachChapter
  );

  // app.get(
  //   "/api/superAdminDashboard/complienceRatePerSubscriber",
  //   [authJwt.verifyToken],
  //   dashboardController.complienceRatePerSubscriber
  // );

  // app.get(
  //   "/api/superAdminDashboard/complienceEachChapter",
  //   [authJwt.verifyToken],
  //   dashboardController.complienceEachChapter
  // );

  const download_samplesController = require("../controller/download_samples.controller.js");
  app.post(
    "/api/csv_upload/create",
    csv.single("file"),
    [authJwt.verifyToken],
    download_samplesController.create
  );
  app.post(
    "/api/csv_upload_accredation/create",
    csv.single("file"),
    [authJwt.verifyToken],
    download_samplesController.accredation
  );
  app.post(
    "/api/download_samples/update",
    [authJwt.verifyToken],
    download_samplesController.update
  );
  app.get(
    "/api/download_samples/get",
    [authJwt.verifyToken],
    download_samplesController.get
  );
  app.get(
    "/api/download_samples/getById/:id",
    [authJwt.verifyToken],
    download_samplesController.getById
  );
  app.delete(
    "/api/download_samples/delete/:id",
    [authJwt.verifyToken],
    download_samplesController.delete
  );
  app.get(
    "/api/download_samples/statusChange/:id/:status",
    [authJwt.verifyToken],
    download_samplesController.statusChange
  );

  const activity_csv_nameController = require("../controller/activity_csv_name.controller.js");
  app.post(
    "/api/activity_csv_name/create",
    [authJwt.verifyToken],
    activity_csv_nameController.create
  );
  app.put(
    "/api/activity_csv_name/update",
    [authJwt.verifyToken],
    activity_csv_nameController.update
  );
  app.get(
    "/api/activity_csv_name/get",
    [authJwt.verifyToken],
    activity_csv_nameController.get
  );
  app.get(
    "/api/activity_csv_name/getById/:id",
    [authJwt.verifyToken],
    activity_csv_nameController.getById
  );
  app.get(
    "/api/activity_csv_name/getByLibraryId/:id",
    [authJwt.verifyToken],
    activity_csv_nameController.getByLibraryId
  );

  app.delete(
    "/api/activity_csv_name/delete/:id",
    [authJwt.verifyToken],
    activity_csv_nameController.delete
  );
  app.get(
    "/api/activity_csv_name/statusChange/:id/:status",
    [authJwt.verifyToken],
    activity_csv_nameController.statusChange
  );

  //notification
  const notification_controller = require("../controller/notifications.controller.js");
  app.get(
    "/api/getMyNofication",
    [authJwt.verifyToken],
    notification_controller.getMyNofication
  );

  app.put(
    "/api/getMyNofication/:id",
    [authJwt.verifyToken],
    notification_controller.update
  );

  app.get(
    "/api/admin/updateAll",
    // [authJwt.verifyToken],
    notification_controller.updateAll
  );
};
