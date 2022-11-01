// const verifySignUp = require('./verifySignUp');

const authJwt = require("./verifyJwtToken");
const substandardController = require("../controller/sub_standards.controller");

module.exports = function (app) {
  const upload = require("../middleware/upload");
  const storage_activity_documentController = require("../controller/storage_activity_document.controller.js");
  const storage_activity_checklistController = require("../controller/storage_activity_checklist.controller.js");
  const storage_activity_kpiController = require("../controller/storage_activity_kpi.controller.js");
  const property_mappingController = require("../controller/property_mapping.controller.js");

  app.post(
    "/updatorapi/property_mapping/singlePropertyAssignchapterTemp",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignchapterByUpdatorTemp
  );

  app.post(
    "/updatorapi/property_mapping/singlePropertyAssignstandardTemp",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignstandardTemp
  );

  app.post(
    "/updatorapi/property_mapping/singlePropertyAssignsubstandardTemp",
    [authJwt.verifyToken],
    property_mappingController.singlePropertyAssignsubstandardTemp
  );

  app.post(
    "/updatorapi/storage_activity_checklist/createFile",
    [authJwt.verifyToken],
    upload.single("document_link"),
    storage_activity_checklistController.createFile
  );

  app.post(
    "/updatorapi/storage_activity_checklist/create",
    [authJwt.verifyToken],
    storage_activity_checklistController.create
  );
  app.put(
    "/updatorapi/storage_activity_checklist/update",
    [authJwt.verifyToken],
    storage_activity_checklistController.update
  );
  app.put(
    "/updatorapi/storage_activity_checklist/updateFile",
    [authJwt.verifyToken],
    upload.single("attachment_link"),
    storage_activity_checklistController.updateFile
  );
  app.get(
    "/updatorapi/storage_activity_checklist/get/:id/:type",
    [authJwt.verifyToken],
    storage_activity_checklistController.get
  );
  app.get(
    "/updatorapi/storage_activity_checklist/getById/:id",
    [authJwt.verifyToken],
    storage_activity_checklistController.getById
  );
  app.delete(
    "/updatorapi/storage_activity_checklist/delete/:id",
    [authJwt.verifyToken],
    storage_activity_checklistController.delete
  );
  app.get(
    "/updatorapi/storage_activity_checklist/statusChange/:id/:status",
    [authJwt.verifyToken],
    storage_activity_checklistController.statusChange
  );

  app.post(
    "/updatorapi/storage_activity_document/create",
    upload.single("document_link"),
    [authJwt.verifyToken],
    storage_activity_documentController.create
  );
  app.put(
    "/updatorapi/storage_activity_document/update",
    upload.single("document_link"),
    [authJwt.verifyToken],
    storage_activity_documentController.update
  );
  app.put(
    "/updatorapi/storage_activity_document/updateByCA",
    upload.single("document_link"),
    [authJwt.verifyToken],
    storage_activity_documentController.updateCA
  );
  app.get(
    "/updatorapi/storage_activity_document/get/:id/:type",
    [authJwt.verifyToken],
    storage_activity_documentController.get
  );
  app.get(
    "/updatorapi/storage_activity_document/getById/:id",
    [authJwt.verifyToken],
    storage_activity_documentController.getById
  );
  app.delete(
    "/updatorapi/storage_activity_document/delete/:id",
    [authJwt.verifyToken],
    storage_activity_documentController.delete
  );
  app.get(
    "/updatorapi/storage_activity_document/statusChange/:id/:status",
    [authJwt.verifyToken],
    storage_activity_documentController.statusChange
  );

  app.post(
    "/updatorapi/storage_activity_kpi/create",
    [authJwt.verifyToken],
    storage_activity_kpiController.create
  );
  app.put(
    "/updatorapi/storage_activity_kpi/update",
    [authJwt.verifyToken],
    storage_activity_kpiController.update
  );
  app.get(
    "/updatorapi/storage_activity_kpi/get/:id/:type",
    [authJwt.verifyToken],
    storage_activity_kpiController.get
  );
  app.get(
    "/updatorapi/storage_activity_kpi/getById/:id",
    [authJwt.verifyToken],
    storage_activity_kpiController.getById
  );
  app.delete(
    "/updatorapi/storage_activity_kpi/delete/:id",
    [authJwt.verifyToken],
    storage_activity_kpiController.delete
  );
  app.get(
    "/updatorapi/storage_activity_kpi/statusChange/:id/:status",
    [authJwt.verifyToken],
    storage_activity_kpiController.statusChange
  );

  const score_mappingController = require("../controller/score_mapping.controller.js");
  app.post(
    "/updatorapi/score_mapping/create",
    [authJwt.verifyToken],
    score_mappingController.create
  );
  app.post(
    "/updatorapi/score_mapping/update",
    [authJwt.verifyToken],
    score_mappingController.update
  );
  app.get(
    "/updatorapi/score_mapping/get",
    [authJwt.verifyToken],
    score_mappingController.get
  );
  app.get(
    "/updatorapi/score_mapping/getById/:id",
    [authJwt.verifyToken],
    score_mappingController.getById
  );
  app.delete(
    "/updatorapi/score_mapping/delete/:id",
    [authJwt.verifyToken],
    score_mappingController.delete
  );
  app.get(
    "/updatorapi/score_mapping/statusChange/:id/:status",
    [authJwt.verifyToken],
    score_mappingController.statusChange
  );

  const storage_observationController = require("../controller/storage_observation.controller.js");
  app.post(
    "/updatorapi/storage_observation/create",
    [authJwt.verifyToken],
    storage_observationController.create
  );
  app.put(
    "/updatorapi/storage_observation/create",
    [authJwt.verifyToken],
    storage_observationController.create
  );
  app.put(
    "/updatorapi/storage_observation/update",
    [authJwt.verifyToken],
    storage_observationController.update
  );
  app.get(
    "/updatorapi/storage_observation/get/:id/:type",
    [authJwt.verifyToken],
    storage_observationController.get
  );
  app.get(
    "/updatorapi/storage_observation/getById/:id",
    [authJwt.verifyToken],
    storage_observationController.getById
  );
  app.delete(
    "/updatorapi/storage_observation/delete/:id",
    [authJwt.verifyToken],
    storage_observationController.delete
  );
  app.get(
    "/updatorapi/storage_observation/statusChange/:id/:status",
    [authJwt.verifyToken],
    storage_observationController.statusChange
  );

  const AccredationController = require("../controller/updatorAccredation.controller.js");

  app.post(
    "/updatorapi/library/get",
    [authJwt.verifyToken],
    AccredationController.libraryget
  );
  app.post(
    "/updatorapi/chapter/get",
    [authJwt.verifyToken],
    AccredationController.chapterget
  );
  app.post(
    "/updatorapi/standard/get",
    [authJwt.verifyToken],
    AccredationController.standardget
  );
  app.post(
    "/updatorapi/substandard/get",
    [authJwt.verifyToken],
    AccredationController.substandardget
  );
  app.post(
    "/updatorapi/activity/get",
    [authJwt.verifyToken],
    AccredationController.activityget
  ); // Added
  app.get(
    "/updatorapi/activities/get",
    [authJwt.verifyToken],
    AccredationController.activity
  );

  const UpdatorController = require("../controller/updator.controller.js");

  app.get(
    "/updatorapi/updator/get",
    [authJwt.verifyToken],
    UpdatorController.updatorget
  );

  //Document  report
  const ReportController = require("../controller/report.controller.js");
  app.get(
    "/updatorapi/report/document",
    [authJwt.verifyToken],
    storage_activity_documentController.documentReport
  );
  app.get(
    "/updatorapi/report/checklist",
    [authJwt.verifyToken],
    ReportController.checklistReport
  );
  app.get(
    "/updatorapi/report/kpi",
    [authJwt.verifyToken],
    ReportController.kpiReport
  );
  app.get(
    "/updatorapi/report/observation",
    [authJwt.verifyToken],
    ReportController.observationReport
  );

  app.get(
    "/updatorapi/report/surveyorassessment",
    [authJwt.verifyToken],
    ReportController.surveyorReport
  );

  app.get(
    "/updatorapi/report/surveyorcompare",
    [authJwt.verifyToken],
    ReportController.surveyorcompareReport
  );

  // Dashboard
  const dashboardController = require("../controller/dashboard.controller.js");

  app.post(
    "/updatorapi/Dashboard/taskStatus",
    [authJwt.verifyToken],
    dashboardController.taskStatus
  );

  app.post(
    "/updatorapi/Dashboard/count",
    [authJwt.verifyToken],
    dashboardController.UpdatorCount
  );
  app.post(
    "/updatorapi/Dashboard/esr",
    [authJwt.verifyToken],
    dashboardController.UpdatorESRfind
  );
  app.get(
    "/updatorapi/Dashboard/checklistScore",
    [authJwt.verifyToken],
    dashboardController.UpdatorchecklistScore
  );
  app.post(
    "/updatorapi/Dashboard/complianceMet",
    [authJwt.verifyToken],
    dashboardController.UpdatorcomplianceMet
  );
  app.post(
    "/updatorapi/Dashboard/kpi",
    [authJwt.verifyToken],
    dashboardController.Updatorkpi
  );
  app.post(
    "/updatorapi/Dashboard/observation",
    [authJwt.verifyToken],
    dashboardController.Updatorobservation
  );
  app.post(
    "/updatorapi/Dashboard/assignedPropertiesCount",
    [authJwt.verifyToken],
    dashboardController.assignedPropertiesCount
  );

  //Assign to updator
  app.post(
    "/updatorapi/property_mapping/create",
    [authJwt.verifyToken],
    property_mappingController.UpdatorCreate
  );
  app.post(
    "/updatorapi/property_mapping/singlePropertyAssignstandard",
    [authJwt.verifyToken],
    property_mappingController.updatorSinglePropertyAssignstandard
  );
  app.post(
    "/updatorapi/property_mapping/singlePropertyAssignchapter",
    [authJwt.verifyToken],
    property_mappingController.updatorSinglePropertyAssignchapter
  );
  app.post(
    "/updatorapi/property_mapping/checkproperty",
    [authJwt.verifyToken],
    property_mappingController.UpdatorCheckProperty
  );

  //self assessment
  app.get(
    "/updatorapi/self_assessment/substandard",
    [authJwt.verifyToken],
    substandardController.getByAssignUpdatorId
  );
  app.get(
    "/updatorapi/self_assessment/property-mapping/:id",
    [authJwt.verifyToken],
    substandardController.getSelfAssessmentSubstandardByPropMapping
  );

  app.get(
    "/updatorapi/self_assessment/bySubstandard/:id",
    [authJwt.verifyToken],
    substandardController.getSelfAssessmentSubstandard
  );
  app.post(
    "/updatorapi/self_assessment/create",
    [authJwt.verifyToken],
    score_mappingController.substandardSelfAssessmentUpdate
  );

  const client_admin_activitiesController = require("../controller/client_admin_activities.controller.js");
  app.post(
    "/updatorapi/client_activities/getByType",
    [authJwt.verifyToken],
    client_admin_activitiesController.getByType
  );
};
