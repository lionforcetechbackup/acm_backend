// const verifySignUp = require('./verifySignUp');
const authJwt = require("./verifyJwtToken");

module.exports = function (app) {
  const controller = require("../controller/user.controller.js");
  const client_rolesController = require("../controller/client_roles.controller.js");
  const property_mappingController = require("../controller/property_mapping.controller.js");
  const upload = require("../middleware/upload");
  const client_admin_datacollectionsController = require("../controller/client_admin_datacollections.controller.js");
  const client_admin_activitiesController = require("../controller/client_admin_activities.controller.js");
  const librariesController = require("../controller/libraries.controller.js");
  const score_mappingController = require("../controller/score_mapping.controller.js");
  const organizationController = require("../controller/organization.controller.js");
  const storage_activity_documentController = require("../controller/storage_activity_document.controller.js");
  const substandardController = require("../controller/sub_standards.controller");

  app.post(
    "/clientapi/client_roles/create",
    [authJwt.verifyToken],
    client_rolesController.create
  );
  app.post(
    "/clientapi/client_roles/update",
    [authJwt.verifyToken],
    client_rolesController.update
  );
  app.get(
    "/clientapi/client_roles/get",
    [authJwt.verifyToken],
    client_rolesController.get
  );
  app.get(
    "/clientapi/client_roles/getById/:id",
    [authJwt.verifyToken],
    client_rolesController.getById
  );
  app.delete(
    "/clientapi/client_roles/delete/:id",
    [authJwt.verifyToken],
    client_rolesController.delete
  );
  app.get(
    "/clientapi/client_roles/statusChange/:id/:status",
    [authJwt.verifyToken],
    client_rolesController.statusChange
  );

  app.get(
    "/clientapi/client_roles/getUserByMasterId/:id",
    [authJwt.verifyToken],
    client_rolesController.getUserByMasterId
  );
  app.get(
    "/clientapi/client_roles/userAssignedRoles/:id",
    [authJwt.verifyToken],
    client_rolesController.userAssignedRoles
  );

  //company

  app.post(
    "/clientapi/add_company/create",
    [authJwt.verifyToken],
    controller.clientAdminCompanyUpdate
  );

  app.get(
    "/clientapi/getFromDate",
    [authJwt.verifyToken],
    controller.getFromDate
  );

  app.post(
    "/clientapi/client_user/create",
    [authJwt.verifyToken],
    controller.clientAdminUserCreate
  );

  app.put(
    "/clientapi/client_user/clientuserupdate2",
    [authJwt.verifyToken],
    controller.clientuserupdate2
  );

  app.get(
    "/clientapi/client_user/showPropertyByUserCompany/:id",
    [authJwt.verifyToken],
    controller.showPropertyByUserCompany
  );

  app.put(
    "/clientapi/client_user/clientuserupdate",
    [authJwt.verifyToken],
    controller.clientAdminUserupdate
  );
  app.put(
    "/clientapi/client_user/update",
    [authJwt.verifyToken],
    controller.userupdate
  );
  app.get("/clientapi/client_user/get", [authJwt.verifyToken], controller.get);
  app.get(
    "/clientapi/client_user/get/:userid",
    [authJwt.verifyToken],
    controller.getbyuseridval
  );

  app.post(
    "/clientapi/allusers/withproperties",
    [authJwt.verifyToken],
    controller.clientUsersWithProperties
  );

  app.get(
    "/clientapi/client_user/getUserAllRole/:id",
    [authJwt.verifyToken],
    controller.getUserAllRole
  );

  app.post(
    "/clientapi/property_mapping/create",
    [authJwt.verifyToken],
    property_mappingController.create
  );
  app.post(
    "/clientapi/property_mapping/singlePropertyAssignstandard",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignstandard
  );
  app.post(
    "/clientapi/property_mapping/singlePropertyAssignchapter",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignchapter
  );
  app.post(
    "/clientapi/property_mapping/singlePropertyAssignlibrary",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignlibrary
  );
  app.post(
    "/clientapi/property_mapping/checkproperty",
    [authJwt.verifyToken],
    property_mappingController.checkProperty
  );

  app.post(
    "/clientapi/property_mapping/assign",
    [authJwt.verifyToken],
    property_mappingController.propertyAssign
  );
  // app.post('/clientapi/property_mapping/update', property_mappingController.update)
  // app.get('/clientapi/property_mapping/get', property_mappingController.get)
  // app.get('/clientapi/property_mapping/getById/:id', property_mappingController.getById)
  // app.delete('/clientapi/property_mapping/delete/:id', property_mappingController.delete)
  // app.get('/clientapi/property_mapping/statusChange/:id/:status', property_mappingController.statusChange)

  app.post(
    "/clientapi/client_admin_activities/create",
    //upload.single("file"),
    [authJwt.verifyToken],
    client_admin_activitiesController.create
  );
  app.put(
    "/clientapi/client_admin_activities/update",
    [authJwt.verifyToken],
    client_admin_activitiesController.update
  );
  app.post(
    "/clientapi/adminActivityUpdate/update",
    [authJwt.verifyToken],
    client_admin_activitiesController.adminActivityUpdate
  );
  app.get(
    "/clientapi/client_admin_activities/get",
    [authJwt.verifyToken],
    client_admin_activitiesController.get
  );
  app.get(
    "/clientapi/client_admin_activities/getById/:id/:type/:libid",
    [authJwt.verifyToken],
    client_admin_activitiesController.getById
  );

  app.get(
    "/clientapi/client_admin_activities/getById/:id/:type",
    [authJwt.verifyToken],
    client_admin_activitiesController.getById
  );

  app.get(
    "/clientapi/client_admin_activities/filter/getById/:id/:type",
    [authJwt.verifyToken],
    client_admin_activitiesController.getByIdFilter
  );

  app.get(
    "/clientapi/get_checklist_responses/filter/getById/:id/:type/:startdate/:enddate",
    [authJwt.verifyToken],
    client_admin_activitiesController.getByIdFilterDate
  );

  app.delete(
    "/clientapi/client_admin_activities/delete/:id",
    [authJwt.verifyToken],
    client_admin_activitiesController.delete
  );
  app.get(
    "/clientapi/client_admin_activities/statusChange/:id/:status",
    [authJwt.verifyToken],
    client_admin_activitiesController.statusChange
  );

  app.post(
    "/clientapi/client_admin_datacollections/create",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.create
  );
  app.post(
    "/clientapi/client_admin_datacollections/update",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.update
  );
  app.get(
    "/clientapi/client_admin_datacollections/get",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.get
  );
  app.get(
    "/clientapi/client_admin_datacollections/getById/:id",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.getById
  );
  app.delete(
    "/clientapi/client_admin_datacollections/delete/:id",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.delete
  );
  app.get(
    "/clientapi/client_admin_datacollections/statusChange/:id/:status",
    [authJwt.verifyToken],
    client_admin_datacollectionsController.statusChange
  );

  const client_accredationController = require("../controller/client_accredation.controller.js");

  // app.get('/clientapi/library',[authJwt.verifyToken], librariesController.clientget)
  // app.get('/clientapi/library',[authJwt.verifyToken], librariesController.clientget)
  // app.get('/clientapi/library',[authJwt.verifyToken], librariesController.clientget)
  app.get(
    "/clientapi/library",
    [authJwt.verifyToken],
    client_accredationController.clientget
  );
  app.get(
    "/clientapi/chapter",
    [authJwt.verifyToken],
    client_accredationController.chapterget
  );
  app.get(
    "/clientapi/standard",
    [authJwt.verifyToken],
    client_accredationController.standardget
  );
  app.get(
    "/clientapi/substandard",
    [authJwt.verifyToken],
    client_accredationController.substandardget
  );
  app.get(
    "/clientapi/activity",
    [authJwt.verifyToken],
    client_accredationController.activityget
  );
  app.get(
    "/clientapi/clientcountall",
    [authJwt.verifyToken],
    client_accredationController.clientcountall
  );
  app.get(
    "/api/admincountall",
    [authJwt.verifyToken],
    client_accredationController.admincountall
  );

  const surveyor_sessionController = require("../controller/surveyor_session.controller.js");
  app.get(
    "/clientapi/organization/getMasterWithsub/:id",
    [authJwt.verifyToken],
    organizationController.getMasterWithsub
  ); // :id = organization_id

  app.post(
    "/clientapi/surveyor_session/create",
    [authJwt.verifyToken],
    surveyor_sessionController.create
  );
  app.put(
    "/clientapi/surveyor_session/update",
    [authJwt.verifyToken],
    surveyor_sessionController.update
  );
  app.get(
    "/clientapi/surveyor_session/get",
    [authJwt.verifyToken],
    surveyor_sessionController.get
  );
  app.get(
    "/clientapi/surveyor_session/getById/:id",
    [authJwt.verifyToken],
    surveyor_sessionController.getById
  );
  app.delete(
    "/clientapi/surveyor_session/delete/:id",
    [authJwt.verifyToken],
    surveyor_sessionController.delete
  );
  app.get(
    "/clientapi/surveyor_session/statusChange/:id/:status",
    [authJwt.verifyToken],
    surveyor_sessionController.statusChange
  );
  //app.get("/clientapi/surveyor_list", surveyor_sessionController.surveyor_list); //with classdetailjoin
  app.get(
    "/clientapi/surveyor_list",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyor_list
  ); //without classdetailsJoin join list

  // app.get('/api/chapters/getByLibraryId', chaptersController.getByLibraryId)
  // app.get('/api/standards/getBylibraryId', standardsController.getBylibraryId)
  // app.get('/api/sub_standards/getByIdCommon', sub_standardsController.getByIdCommon)
  // app.get('/api/sub_standards/getByStandardId/:id', sub_standardsController.getByStandardId)

  //mapping score pages
  app.get(
    "/clientapi/updatorScores",
    [authJwt.verifyToken],
    score_mappingController.updatorScore
  );
  app.get(
    "/clientapi/internalSurveyorScores",
    [authJwt.verifyToken],
    score_mappingController.internalSurveyorScores
  );
  app.get(
    "/clientapi/externalSurveyorScores",
    [authJwt.verifyToken],
    score_mappingController.externalSurveyorScores
  );
  // app.get('/clientapi/externalSurveyorScores', score_mappingController.externalSurveyorScores)

  app.get(
    "/clientapi/libraryScores",
    [authJwt.verifyToken],
    score_mappingController.libraryScores
  );
  app.get(
    "/clientapi/chapterScores",
    [authJwt.verifyToken],
    score_mappingController.chapterScores
  );
  app.get(
    "/clientapi/standardScores",
    [authJwt.verifyToken],
    score_mappingController.standardScores
  );
  app.get(
    "/clientapi/substandardScores",
    [authJwt.verifyToken],
    score_mappingController.substandardScores
  );

  app.get(
    "/clientapi/activityScores",
    [authJwt.verifyToken],
    score_mappingController.activityScores
  );

  app.get(
    "/clientapi/activityScores/getById/:id/:activitytype/:type",
    [authJwt.verifyToken],
    score_mappingController.scoregetById
  ); //activitytype(checklist)  type(client2 or admin1)

  app.get(
    "/clientapi/self_assessment/bySubstandard/:id/:assigned_user_id/:assigned_role_id",
    [authJwt.verifyToken],
    substandardController.getSelfAssessmentSubstandardByUpdatorOrSurveyor
  );

  app.get(
    "/clientapi/elementscoregetById/getById/:id/:activitytype",
    [authJwt.verifyToken],
    score_mappingController.elementscoregetById
  ); //activitytype(checklist)  type(client2 or admin1)
  app.post(
    "/clientapi/elementscorecommon",
    [authJwt.verifyToken],
    score_mappingController.elementscorecommon
  ); //common

  app.get(
    "/clientapi/substandardScores/updator/:id",
    [authJwt.verifyToken],
    score_mappingController.substandardwithactivitiesUpdator
  );
  app.get(
    "/clientapi/substandardScores/internal/:id",
    [authJwt.verifyToken],
    score_mappingController.substandardwithactivitiesInternal
  );
  app.get(
    "/clientapi/substandardScores/external/:id",
    [authJwt.verifyToken],
    score_mappingController.substandardwithactivitiesExternal
  );

  const ReportController = require("../controller/report.controller.js");
  app.get(
    "/clientapi/report/user",
    [authJwt.verifyToken],
    ReportController.userReport
  );
  app.get(
    "/clientapi/report/surveyorassessment",
    [authJwt.verifyToken],
    ReportController.surveyorReport
  );
  app.get(
    "/clientapi/report/updator",
    [authJwt.verifyToken],
    ReportController.updatorReport
  );

  app.get(
    "/clientapi/report/reportAll",
    [authJwt.verifyToken],
    ReportController.reportAll
  );

  app.get(
    "/clientapi/report/checklist",
    [authJwt.verifyToken],
    ReportController.checklistReport
  );
  // app.get(
  //   "/clientapi/report/document",
  //   [authJwt.verifyToken],
  //   ReportController.documentReport
  // );

  app.get(
    "/clientapi/report/document",
    [authJwt.verifyToken],
    storage_activity_documentController.documentReport
  );

  app.get(
    "/clientapi/report/kpi",
    [authJwt.verifyToken],
    ReportController.kpiReport
  );
  app.get(
    "/clientapi/report/observation",
    [authJwt.verifyToken],
    ReportController.observationReport
  );
  app.get(
    "/clientapi/report/surveyorcompare",
    [authJwt.verifyToken],
    ReportController.surveyorcompareReport
  );
  app.get(
    "/clientapi/report/propertyassign",
    [authJwt.verifyToken],
    ReportController.propertyAssign
  );

  app.get(
    "/clientapi/report/documents",
    [authJwt.verifyToken],
    ReportController.doucments
  );

  app.get(
    "/clientapi/report/updatorActivityReport",
    ReportController.updatorActivityReport
  );

  app.get(
    "/clientapi/document/checklist",
    [authJwt.verifyToken],
    ReportController.checkListDocuments
  );

  app.get(
    "/clientapi/document/documentevindence",
    [authJwt.verifyToken],
    storage_activity_documentController.uploadeddocuments
  );

  const dashboardController = require("../controller/dashboard.controller.js");

  // app.get('/clientapi/dashboard/licence', dashboardController.dashboardLicence)
  app.get(
    "/clientapi/Dashboard/userCount",
    [authJwt.verifyToken],
    dashboardController.userCount
  );
  app.get(
    "/clientapi/Dashboard/expiredate",
    [authJwt.verifyToken],
    dashboardController.expiredate
  );
  app.get(
    "/clientapi/Dashboard/updatorScore",
    [authJwt.verifyToken],
    dashboardController.updatorScore
  );
  app.get(
    "/clientapi/Dashboard/checklistScore",
    [authJwt.verifyToken],
    dashboardController.checklistScore
  );
  app.post(
    "/clientapi/Dashboard/complianceBranch",
    [authJwt.verifyToken],
    dashboardController.complianceBranch
  );
  app.post(
    "/clientapi/Dashboard/complianceMet",
    [authJwt.verifyToken],
    dashboardController.complianceMet
  );
  app.post(
    "/clientapi/Dashboard/esr",
    [authJwt.verifyToken],
    dashboardController.ESRfind
  );
  app.post(
    "/clientapi/Dashboard/kpi",
    [authJwt.verifyToken],
    dashboardController.kpi
  );
  app.post(
    "/clientapi/Dashboard/observation",
    [authJwt.verifyToken],
    dashboardController.observation
  );

  //KPI List
  app.get(
    "/clientapi/Dashboard/kpiList",
    [authJwt.verifyToken],
    dashboardController.kpiList
  );

  //Observationlist
  app.get(
    "/clientapi/Dashboard/obsList",
    [authJwt.verifyToken],
    dashboardController.observationlist
  );
};
