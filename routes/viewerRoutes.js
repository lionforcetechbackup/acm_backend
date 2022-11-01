// const verifySignUp = require('./verifySignUp');
const authJwt = require("./verifyJwtToken");
const dashboardController = require("../controller/dashboard.controller.js");

module.exports = function (app) {
  const controller = require("../controller/user.controller.js");

  //dashboard
  const dashboardController = require("../controller/dashboard.controller.js");
  app.get("/viewerapi/Dashboard/userCount", dashboardController.userCount);
  app.get("/viewerapi/Dashboard/expiredate", dashboardController.expiredate);
  app.post(
    "/viewerapi/Dashboard/esr",
    [authJwt.verifyToken],
    dashboardController.UpdatorESRfind
  );
  app.post(
    "/viewerapi/Dashboard/complianceMet",
    [authJwt.verifyToken],
    dashboardController.UpdatorcomplianceMet
  );
  app.post(
    "/viewerapi/Dashboard/kpi",
    [authJwt.verifyToken],
    dashboardController.Updatorkpi
  );
  app.post(
    "/viewerapi/Dashboard/observation",
    [authJwt.verifyToken],
    dashboardController.Updatorobservation
  );

  //manage accredition
  const AccredationController = require("../controller/viewerAccredation.controller.js");
  const ReportController = require("../controller/report.controller.js");

  app.post(
    "/viewerapi/library/get",
    [authJwt.verifyToken],
    AccredationController.libraryget
  );
  app.post(
    "/viewerapi/chapter/get",
    [authJwt.verifyToken],
    AccredationController.chapterget
  );
  app.post(
    "/viewerapi/standard/get",
    [authJwt.verifyToken],
    AccredationController.standardget
  );
  app.post(
    "/viewerapi/substandard/get",
    [authJwt.verifyToken],
    AccredationController.substandardget
  );
  app.post(
    "/viewerapi/activity/get",
    [authJwt.verifyToken],
    AccredationController.activityget
  ); // Added
  app.get(
    "/viewerapi/activities/get",
    [authJwt.verifyToken],
    AccredationController.activity
  ); //admin_activity_id

  //Report
  app.get(
    "/viewerapi/report/updator",
    [authJwt.verifyToken],
    ReportController.updatorReport
  );
  app.get(
    "/viewerapi/report/checklist",
    [authJwt.verifyToken],
    ReportController.checklistReport
  );
  app.get(
    "/viewerapi/report/document",
    [authJwt.verifyToken],
    ReportController.documentReport
  );
  app.get(
    "/viewerapi/report/kpi",
    [authJwt.verifyToken],
    ReportController.kpiReport
  );
  app.get(
    "/viewerapi/report/observation",
    [authJwt.verifyToken],
    ReportController.observationReport
  );
  app.get(
    "/viewerapi/report/surveyorcompare",
    [authJwt.verifyToken],
    ReportController.surveyorcompareReport
  );
  app.get(
    "/viewerapi/report/propertyassign",
    [authJwt.verifyToken],
    ReportController.propertyAssign
  );

  //document
  app.get(
    "/viewerapi/report/checklist",
    [authJwt.verifyToken],
    ReportController.checklistReport
  );
  app.get(
    "/viewerapi/report/document",
    [authJwt.verifyToken],
    ReportController.documentReport
  );

  //Report
  app.get(
    "/clientapi/report/surveyorassessment",
    [authJwt.verifyToken],
    ReportController.surveyorReport
  );
};
