const authJwt = require("./verifyJwtToken");

module.exports = function (app) {
  const surveyor_sessionController = require("../controller/surveyor_session.controller.js");
  const ReportController = require("../controller/report.controller.js");
  const storage_activity_documentController = require("../controller/storage_activity_document.controller.js");
  const score_mappingController = require("../controller/score_mapping.controller.js");
  app.get(
    "/surveyorapi/surveyor_session/get",
    [authJwt.verifyToken],
    surveyor_sessionController.userSession
  );
  app.get(
    "/surveyorapi/surveyor_session/getById/:id",
    [authJwt.verifyToken],
    surveyor_sessionController.userSessionGetById
  );
  app.get(
    "/surveyorapi/surveyor_session/userSessionLibrary",
    [authJwt.verifyToken],
    surveyor_sessionController.userSessionLibrary
  );
  /*
  app.get(
    "/surveyorapi/activityScores",
    [authJwt.verifyToken],
    score_mappingController.activityScoresSurveyor
  ); */

  //Report
  app.get(
    "/surveyorapi/report/surveyorAssessment",
    [authJwt.verifyToken],
    ReportController.surveyorAssessment
  );
  app.get(
    "/surveyorapi/report/updatorReport",
    [authJwt.verifyToken],
    ReportController.updatorReport
  );
  app.get(
    "/surveyorapi/report/checklistReport",
    [authJwt.verifyToken],
    ReportController.checklistReport
  );
  // app.get(
  //   "/surveyorapi/report/documentReport",
  //   [authJwt.verifyToken],
  //   ReportController.documentReport
  // );
  app.get(
    "/surveyorapi/report/documentReport",
    [authJwt.verifyToken],
    storage_activity_documentController.documentReport
  );

  app.get(
    "/surveyorapi/report/kpiReport",
    [authJwt.verifyToken],
    ReportController.kpiReport
  );
  app.get(
    "/surveyorapi/report/observationReport",
    [authJwt.verifyToken],
    ReportController.observationReport
  );
  app.get(
    "/surveyorapi/report/surveyorcompareReport",
    [authJwt.verifyToken],
    ReportController.surveyorcompareReport
  );

  // Dashboard
  app.post(
    "/surveyorapi/Dashboard/count",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyorCount
  );
  app.post(
    "/surveyorapi/Dashboard/esr",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyorESRfind
  );
  app.post(
    "/surveyorapi/Dashboard/complianceMet",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyorComplianceMet
  );
  app.post(
    "/surveyorapi/Dashboard/kpi",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyorKPI
  );
  app.post(
    "/surveyorapi/Dashboard/observation",
    [authJwt.verifyToken],
    surveyor_sessionController.surveyorObservation
  );

  //manage accrediation
  const AccredationController = require("../controller/surveyorAccredation.controller.js");
  app.post(
    "/surveyorapi/library/get",
    [authJwt.verifyToken],
    AccredationController.libraryget
  );

  app.post(
    "/surveyorapi/chapter/get",
    [authJwt.verifyToken],
    AccredationController.chapterget
  );
  app.post(
    "/surveyorapi/standard/get",
    [authJwt.verifyToken],
    AccredationController.standardget
  );
  app.post(
    "/surveyorapi/substandard/get",
    [authJwt.verifyToken],
    AccredationController.substandardget
  );
  app.post(
    "/surveyorapi/activity/get",
    [authJwt.verifyToken],
    AccredationController.activityget
  ); // Added
  app.get(
    "/surveyorapi/activities/get",
    [authJwt.verifyToken],
    AccredationController.activity
  );
};
