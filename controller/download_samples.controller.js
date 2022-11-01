const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const fs = require("fs");
const csv = require("fast-csv");
const pathtest = require("path");
const dbNormal = require("../database/server");
const crypto = require("crypto");
var mysql = require("mysql2");

var results = {};
/*var connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'admin#123',
  database: 'node_accrepro',
  debug: false,
  insecureAuth : true
  
});
*/
exports.create = async (req, res) => {
  try {
    if (req.file == undefined) {
      res.send("Please upload a CSV file!");
    }

    if (req.file) {
      var path = req.file.destination + "/" + req.file.filename;
      var fileLink = path.replace("./", "");
    }

    let tutorials = [];
    const directoryPath = pathtest.join(
      __dirname,
      "../public/document/" + req.file.filename
    );

    fs.createReadStream(directoryPath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        res.send(error.message);
      })
      .on("data", async (row) => {
        console.log("pushing to an array");

        if (row.Library) {
          tutorials.push(row);
        }
      })
      .on("end", async () => {
        console.log("reading done");

        if (tutorials.length > 0) {
          var libraryId = null;
          var library_code = null;
          var libraryName = null;
          var chapterName = null;
          var difflib = true;
          var clientCheckallow = false;
          var chapter = [];
          var standards = [];
          var substandards = [];
          var surveyor = [];
          var sessionclass = [];
          var unitoffocus = [];
          var activity = [];
          var activitydetailcount = 0;
          var activityelementcount = 0;
          var activity_csv_name = [];
          var adminelementActivity = [];
          var activityMapping = [];
          let activity_session_mapping = [];
          var chapter_id = null;
          var standard_id = null;
          var sub_standard_id = null;
          var admin_activity_id = null;
          var survey_category_id = null;
          var session_class_id = null;
          var uof_id = null;

          const chpname = Object.keys(tutorials[0])[2];
          const stdname = Object.keys(tutorials[0])[4];
          const substdname = Object.keys(tutorials[0])[6];

          for (let index = 0; index < tutorials.length; index++) {
            const element = tutorials[index];
            //console.log(index);

            //=============Library===============
            if (
              element.Library != "" &&
              element.Library != "N/A" &&
              element.Library != "#N/A"
            ) {
              //library name check its same or other
              if (
                libraryName !== null &&
                libraryName.length > 0 &&
                element.Library === libraryName[0].dataValues.name
              ) {
                difflib = false;
              } else {
                difflib = true;
              }

              if (difflib) {
                // ==================library create===================
                try {
                  [libraryName] = await db.libraries.findOrCreate({
                    where: {
                      name: element.Library.trim(),
                      status: { [Op.notIn]: [master.status.delete] },
                    },
                    defaults: {
                      code: element.Library.trim(),
                      name: element.Library.trim(),
                      status: master.status.active,
                    },
                  });

                  if (libraryName) {
                    libraryId = libraryName.id;
                    library_code = libraryName.code;
                    var org_lib = await db.organization_libraries.findAll({
                      where: {
                        library_id: libraryId,
                        status: { [Op.notIn]: master.status.delete },
                        archive: { [Op.notIn]: master.status.active },
                      },
                    });
                  } else {
                    libraryId = null;
                    library_code = null;
                  }

                  if (org_lib && org_lib.length == 0) {
                    clientCheckallow = true;
                  } else {
                    clientCheckallow = false;
                  }
                } catch (err) {
                  console.log("Error in Library");
                  console.log(err.message);
                  libraryId = null;
                  library_code = null;
                }
                // =====================library end===================
              } //difflibe closed

              // =======================chapter create======================

              console.log(clientCheckallow);
              if (clientCheckallow) {
                if (
                  element.Chapter.trim() != "" &&
                  element.Chapter.trim() != "#N/A" &&
                  element.Chapter.trim() != "N/A"
                ) {
                  var codeCreate = abbrevation(element.Chapter).toUpperCase();
                  var chapter_id = crypto
                    .createHash("sha256")
                    .update(element.Chapter.trim() + "_" + libraryId)
                    .digest("hex");
                  var chaptercode = library_code + "." + codeCreate;
                  var chaptersection = {
                    id: chapter_id,
                    name: element.Chapter.trim(),
                    description: element.ChapterDescription
                      ? element.ChapterDescription.trim()
                      : null,
                    library_id: libraryId,
                    code: chaptercode,
                    status: master.status.active,
                  };
                  chapter.push(chaptersection);
                  console.log(chapter.length);
                }

                if (
                  element.Standard.trim() != "" &&
                  element.Standard.trim() != "#N/A" &&
                  element.Standard.trim() != "N/A"
                ) {
                  var standard_code =
                    chaptercode + "." + element.Standard.trim();
                  var standard_id = crypto
                    .createHash("sha256")
                    .update(
                      element.Standard + "_" + chapter_id + "_" + libraryId
                    )
                    .digest("hex");

                  var standardSection = {
                    id: standard_id,
                    name: element.Standard.trim(),
                    description:
                      element.StandardDescription.trim() === ""
                        ? null
                        : element.StandardDescription.trim(),
                    chapter_id: chapter_id,
                    library_id: libraryId,
                    code: standard_code,
                    status: master.status.active,
                  };
                  standards.push(standardSection);
                }

                var surveyor_split = [];
                if (element.Surveyor && element.Surveyor.includes(",")) {
                  surveyor_split = element.Surveyor.split(",");
                } else {
                  surveyor_split.push(element.Surveyor);
                }

                var survey_category_id = "";

                for (let index = 0; index < surveyor_split.length; index++) {
                  var survey_category_uniq_id = crypto
                    .createHash("sha256")
                    .update(surveyor_split[index].trim() + "_" + libraryId)
                    .digest("hex");

                  if (
                    surveyor_split[index] != "#N/A" &&
                    surveyor_split[index] != "" &&
                    surveyor_split[index] != "N/A"
                  ) {
                    var surveyorcategory = {
                      id: survey_category_uniq_id,
                      category_name: surveyor_split[index].trim(),
                      library_id: libraryId,
                      status: master.status.active,
                    };

                    surveyor.push(surveyorcategory);

                    survey_category_id =
                      survey_category_id + "," + survey_category_uniq_id;
                  } else {
                    survey_category_id = survey_category_id + "";
                  }
                }

                var Session_Split = [];
                if (element.Session && element.Session.includes(",")) {
                  Session_Split = element.Session.split(",");
                } else {
                  Session_Split.push(element.Session);
                }

                var session_class_id = "";

                for (let index = 0; index < Session_Split.length; index++) {
                  var session_class_uniq_id = crypto
                    .createHash("sha256")
                    .update(
                      Session_Split[index].trim() +
                        "_" +
                        survey_category_id +
                        "_" +
                        libraryId
                    )
                    .digest("hex");

                  if (
                    Session_Split[index] != "#N/A" &&
                    Session_Split[index] != "" &&
                    Session_Split[index] != "N/A"
                  ) {
                    var sessionClasses = {
                      id: session_class_uniq_id,
                      class_name: Session_Split[index].trim(),
                      library_id: libraryId,
                      surveyor_category_id: survey_category_id,
                      status: master.status.active,
                    };
                    sessionclass.push(sessionClasses);

                    session_class_id =
                      session_class_id + "," + session_class_uniq_id;
                  } else {
                    session_class_id = session_class_id + "";
                  }
                }

                var uof_id = crypto
                  .createHash("sha256")
                  .update(element.UnitFocusArea.trim() + "_" + libraryId)
                  .digest("hex");

                if (
                  element.UnitFocusArea.trim() != "#N/A" &&
                  element.UnitFocusArea.trim() != "" &&
                  element.UnitFocusArea.trim() != "N/A"
                ) {
                  var unitFocus = {
                    id: uof_id,
                    name: element.UnitFocusArea.trim(),
                    library_id: libraryId,
                    status: master.status.active,
                  };

                  unitoffocus.push(unitFocus);
                }

                var sub_std_code =
                  standard_code + "." + element.SubStandard.trim();
                var sub_standard_id = crypto
                  .createHash("sha256")
                  .update(
                    element.SubStandard.trim() +
                      "_" +
                      standard_id +
                      "_" +
                      chapter_id +
                      "_" +
                      libraryId
                  )
                  .digest("hex");
                let substandard_uid = crypto.createHash("sha256").update(element.SubStandardDescription.trim()).digest("hex");

                if (
                  element.SubStandard != "" &&
                  element.SubStandard != "#N/A" &&
                  element.SubStandard != "N/A" &&
                  element.Standard != "" &&
                  element.Standard != "#N/A" &&
                  element.Standard != "N/A"
                ) {
                  var esr = 1;

                  if (
                    element.ESR &&
                    (element.ESR === "No" ||
                      element.ESR === "NO" ||
                      element.ESR === "no")
                  ) {
                    esr = 0;
                  }
                  var substandard = {
                    id: sub_standard_id,
                    name: element.SubStandard.trim(),
                    standard_id: standard_id,
                    chapter_id: chapter_id,
                    status: master.status.active,
                    code: sub_std_code,
                    esr: esr,
                    description:
                      element.SubStandardDescription === ""
                        ? null
                        : element.SubStandardDescription.trim(),
                    library_id: libraryId,
                    sessionClass: session_class_id,
                    surveycategory: survey_category_id,
                    unitFocus: uof_id,
                    file: null,
                    document_title: element.RequiredDocumentsTitle,
                    substandard_uid : substandard_uid
                  };

                  substandards.push(substandard);
                }
                if (
                  element.Activity != "" &&
                  element.Activity != "#N/A" &&
                  element.Activity != "N/A"
                ) {
                  var code_activity = "";

                  if (!activityelementcount > 0) {
                    activityelementcount = await db.activity_elements.count();
                    activityelementcount = activityelementcount + 1;
                  } else {
                    activityelementcount = activityelementcount + 1;
                  }
                  if (!activitydetailcount > 0) {
                    activitydetailcount = await db.admin_activities.count({
                      where: { status: { [Op.notIn]: [master.status.delete] } },
                    });
                    activitydetailcount = activitydetailcount + 1;
                  } else {
                    activitydetailcount = activitydetailcount + 1;
                  }

                  var codeCreate = await abbrevation(element.Activity.trim());
                  var type = 1;
                  //console.log("element type is '" + element.type + "`");
                  //console.log(typeof element.type);
                  //console.log(element.type == "Data Collection");
                  element.type = element.type.trim();
                  if (element.type === "Checklist") {
                    type = 1;
                    code_activity =
                      "Chk." + codeCreate + "." + activitydetailcount;
                  }

                  if (element.type === "Data Collection") {
                    type = 2;
                    code_activity =
                      "Kpi." + codeCreate + "." + activitydetailcount;
                    code_activity = ""; //observation or kpi is not define yet
                  }
                  if (element.type === "Document Evidence") {
                    type = 3;
                    code_activity =
                      "Doc." + codeCreate + "." + activitydetailcount;
                  }

                  //  console.log("code : " + code_activity);
                  console.log("-------------------");

                  var admin_activity_id_mapping = crypto
                    .createHash("sha256")
                    .update(
                      element.Activity.trim() +
                        "_" +
                        sub_standard_id +
                        "_" +
                        standard_id +
                        "_" +
                        chapter_id +
                        "_" +
                        libraryId
                    )
                    .digest("hex");

                  // admin_activity_id = crypto
                  //   .createHash("sha256")
                  //   .update(
                  //     element.Activity +
                  //       "_" +
                  //       element.ActivitiesDescriptions +
                  //       "_" +
                  //       type
                  //   )
                  //   .digest("hex");

                  admin_activity_id = crypto
                    .createHash("sha256")
                    .update(element.Activity.trim() + "_" + type)
                    .digest("hex");

                  if (type === 1) {
                    //substandard_id is used for updator to validate element during activity add response

                    if (
                      element.SubStandardDescription.trim() != "#N/A" &&
                      element.SubStandardDescription.trim() != "" &&
                      element.SubStandardDescription.trim() != "N/A"
                    ) {
                      // var admin_activity_element = crypto
                      //   .createHash("sha256")
                      //   .update(
                      //     element.Activity.trim() +
                      //       "_" +
                      //       element.SubStandardDescription +
                      //       "_" +
                      //       sub_standard_id
                      //   )
                      //   .digest("hex");

                      var admin_activity_element = crypto
                      .createHash("sha256")
                      .update(
                        element.Activity.trim() +
                          "_" +
                          element.SubStandardDescription.trim()                          
                      )
                      .digest("hex");
                        substandard_uid = crypto.createHash("sha256").update(element.SubStandardDescription.trim()).digest("hex");

                      var admineleActivity = {
                        id: admin_activity_element,
                        admin_activity_id: admin_activity_id,
                        // substandard_id: sub_standard_id, //subsdesc
                        substandard_id : substandard_uid,
                        element_code: "E" + activityelementcount,
                        element_name: element.SubStandardDescription.trim(),
                      };

                      adminelementActivity.push(admineleActivity);
                    }
                  }
                  var admin_activity_mapping = {
                    id: admin_activity_id_mapping,
                    library_id: libraryId,
                    chapter_id: chapter_id,
                    standard_id: standard_id,
                    substandard_id: sub_standard_id,
                    admin_activity_id: admin_activity_id,
                    status: master.status.active,
                    organization_id: 0,
                  };

                  activityMapping.push(admin_activity_mapping);

                  var activity_csv_id = crypto
                    .createHash("sha256")
                    .update(element.Activity.trim() + "_" + libraryId)
                    .digest("hex");

                  activity_csv = {
                    id: activity_csv_id,
                    name: element.Activity.trim(),
                    type: type,
                    status: master.status.active,
                    library_id: libraryId,
                  };

                  activity_csv_name.push(activity_csv);

                  if (type == 2) {
                    kpi_name = element.Activity.trim();
                  } else {
                    kpi_name = "";
                  }

                  var activityCreate = {
                    id: admin_activity_id,
                    code: code_activity,
                    type: type,
                    // description: element.Activity.trim(),
                    description: element.ActivitiesDescriptions.trim(),
                    name: element.Activity.trim(),
                    document_name: element.Activity.trim(),
                    kpi_name: kpi_name,
                    status: master.status.active,
                  };
                  activity.push(activityCreate);

                  let activitySesstionMapping_id =
                    sub_standard_id +
                    "_" +
                    session_class_uniq_id +
                    "_" +
                    admin_activity_id;

                  let activitySesstionMapping = {
                    id: activitySesstionMapping_id,
                    substandard_id: sub_standard_id,
                    session_class_id: session_class_uniq_id,
                    client_activity_id: null,
                    admin_activity_id: admin_activity_id,
                    organization_id: null,
                    status: 1,
                    createdBy: req.userId,
                  };

                  activity_session_mapping.push(activitySesstionMapping);
                }
              }
            }
          }

          //console.log(activityCreate);

          if (chapter.length > 0) {
            console.log("Starting dedupe");
            var chapter_dedup = chapter.filter(
              (chapter, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.name === chapter.name &&
                    t.library_id === chapter.library_id
                )
            );

            var standards_dedup = standards.filter(
              (standards, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.name === standards.name &&
                    t.chapter_id === standards.chapter_id &&
                    t.library_id === standards.library_id
                )
            );

            var surveyor_dedup = surveyor.filter(
              (surveyor, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.category_name === surveyor.category_name &&
                    t.library_id === surveyor.library_id
                )
            );

            var sessionclass_dedup = sessionclass.filter(
              (sessionclass, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.class_name === sessionclass.class_name &&
                    t.library_id === sessionclass.library_id &&
                    t.surveyor_category_id === sessionclass.surveyor_category_id
                )
            );

            var unitoffocus_dedup = unitoffocus.filter(
              (unitoffocus, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.name === unitoffocus.name &&
                    t.library_id === unitoffocus.library_id
                )
            );

            // surveyor category and session to be merge in substandard with commma separate

            substandards.map((element, idx) => {
              substandards.map((el2, idx2) => {
                if (element.name === el2.name && idx !== idx2) {
                  if (
                    substandards[idx].sessionClass.indexOf(el2.sessionClass) ==
                    -1
                  ) {
                    substandards[idx].sessionClass =
                      substandards[idx].sessionClass + el2.sessionClass;
                    arr = substandards[idx].sessionClass.split(",");
                    substandards[idx].sessionClass = [...new Set(arr)];
                    substandards[idx].sessionClass =
                      substandards[idx].sessionClass.join(",");
                  }

                  if (
                    substandards[idx].surveycategory.indexOf(
                      el2.surveycategory
                    ) == -1
                  ) {
                    substandards[idx].surveycategory =
                      substandards[idx].surveycategory + el2.surveycategory;
                    arr = substandards[idx].surveycategory.split(",");
                    substandards[idx].surveycategory = [...new Set(arr)];
                    substandards[idx].surveycategory =
                      substandards[idx].surveycategory.join(",");
                  }
                }
              });
            });

            //// end merging

            var substandards_dedup = substandards.filter(
              (substandards, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.name === substandards.name &&
                    t.standard_id === substandards.standard_id &&
                    t.library_id === substandards.library_id
                )
            );

            var adminelementActivity_dedup = adminelementActivity.filter(
              (adminelementActivity, index, self) =>
                index ===
                self.findIndex((t) => t.id === adminelementActivity.id)
            );

            var activityMapping_dedup = activityMapping.filter(
              (activityMapping, index, self) =>
                index === self.findIndex((t) => t.id === activityMapping.id)
            );

            var activity_csv_name_dedup = activity_csv_name.filter(
              (activity_csv_name, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.name === activity_csv_name.name &&
                    t.type === activity_csv_name.type
                )
            );

            var activity_dedup = activity.filter(
              (activity, index, self) =>
                index ===
                self.findIndex(
                  (t) =>
                    t.code === activity.code &&
                    t.type === activity.type &&
                    // t.description === activity.description &&
                    t.name === activity.name //&&
                  // t.document_name === activity.document_name &&
                  //t.kpi_name === activity.kpi_name
                )
            );

            let activity_session_mapping_dedup =
              activity_session_mapping.filter(
                (activity, index, self) =>
                  index ===
                  self.findIndex(
                    (t) =>
                      t.substandard_id === activity.substandard_id &&
                      t.session_class_id === activity.session_class_id &&
                      t.admin_activity_id === activity.admin_activity_id &&
                      t.organization_id === activity.organization_id
                  )
              );

            console.log(
              "creating surveyor_dedup :::: " + surveyor_dedup.length
            );

            dbNormal.getcon((err) => {
              if (err) {
                console.log(err);
              } else {
                var connection = dbNormal.getDb();

                console.log("Connected to Mysql");

                var records = [];

                for (let i = 0; i < surveyor_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(surveyor_dedup[i].id);
                  individual_rec.push(surveyor_dedup[i].category_name);
                  individual_rec.push(surveyor_dedup[i].library_id);
                  individual_rec.push(surveyor_dedup[i].status);

                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO surveyor_categories (id, category_name, library_id,status) VALUES ? 
       ON DUPLICATE KEY UPDATE category_name = VALUES(category_name),library_id = VALUES(library_id),status = VALUES(status)`;
                let result = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );
                /*
          if (surveyor_dedup.length > 0) {
            try {
              for(let i=0;i<surveyor_dedup.length;i++)
              {
                var surveycategory_response =
                await db.surveyor_categories.upsert(surveyor_dedup[i],  { returning: true } );
              }
              

            } catch (error) {
              console.log(error);
              console.log("Surveyor error")
            //  res.send(error);
            }
          }
          */
                console.log(
                  "creating session_classes :::: " + sessionclass_dedup.length
                );

                var records = [];

                for (let i = 0; i < sessionclass_dedup.length; i++) {
                  var individual_rec = [];
                  surveyor_category_id_str = sessionclass_dedup[
                    i
                  ].surveyor_category_id.replace(/^,/, "");
                  individual_rec.push(sessionclass_dedup[i].id);
                  individual_rec.push(sessionclass_dedup[i].class_name);
                  individual_rec.push(surveyor_category_id_str);
                  individual_rec.push(sessionclass_dedup[i].library_id);
                  individual_rec.push(sessionclass_dedup[i].status);
                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO session_classes (id, class_name,surveyor_category_id,library_id,status) VALUES ? 
       ON DUPLICATE KEY UPDATE class_name = VALUES(class_name),surveyor_category_id=VALUES(surveyor_category_id),library_id = VALUES(library_id),status = VALUES(status)`;
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );

                records = [];

                for (
                  let i = 0;
                  i < activity_session_mapping_dedup.length;
                  i++
                ) {
                  var individual_rec = [];
                  individual_rec.push(activity_session_mapping_dedup[i].id);
                  individual_rec.push(
                    activity_session_mapping_dedup[i].substandard_id
                  );
                  individual_rec.push(
                    activity_session_mapping_dedup[i].session_class_id
                  );
                  individual_rec.push(
                    activity_session_mapping_dedup[i].client_activity_id
                  );
                  individual_rec.push(
                    activity_session_mapping_dedup[i].admin_activity_id
                  );
                  individual_rec.push(
                    activity_session_mapping_dedup[i].organization_id
                  );
                  individual_rec.push(activity_session_mapping_dedup[i].status);
                  individual_rec.push(
                    activity_session_mapping_dedup[i].createdBy
                  );
                  records.push(individual_rec);
                }

                var sql = `INSERT INTO activity_session_mapping (id,substandard_id,session_class_id,client_activity_id,admin_activity_id,organization_id,status,createdBy) VALUES ? 
                  ON DUPLICATE KEY UPDATE substandard_id = VALUES(substandard_id),session_class_id = VALUES(session_class_id),client_activity_id=VALUES(client_activity_id),admin_activity_id=VALUES(admin_activity_id),
                  organization_id = VALUES(organization_id),status = VALUES(status),createdBy=VALUES(createdBy)`;

                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );

                /*
          if (sessionclass_dedup.length > 0) {
            try {
              for(let i=0;i<sessionclass_dedup.length;i++)
              {
                var sessionclassresponse =
                await db.session_classes.upsert(sessionclass_dedup[i],  { returning: true } );
              }
            
            } catch (error) {
              console.log(error);
              console.log("Session error")
            }
          }

*/
                console.log(
                  "creating unit_focus_areas ::: " + unitoffocus_dedup.length
                );

                var records = [];

                for (let i = 0; i < unitoffocus_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(unitoffocus_dedup[i].id);
                  individual_rec.push(unitoffocus_dedup[i].name);
                  individual_rec.push(unitoffocus_dedup[i].library_id);
                  individual_rec.push(unitoffocus_dedup[i].status);

                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO unit_focus_areas (id, name, library_id,status) VALUES ? 
       ON DUPLICATE KEY UPDATE name = VALUES(name),library_id = VALUES(library_id),status = VALUES(status)`;
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );
                /*
          if (unitoffocus_dedup.length > 0) {
            try {
              for(let i=0;i<unitoffocus_dedup.length;i++)
              {
                var uofresponse =
                await db.unit_focus_areas.upsert(unitoffocus_dedup[i],  { returning: true } );
              }
            
              
            } catch (error) {
              console.log("unit of focus");
              console.log(error);
              console.log("unit of focus error")
            }
          }
*/
                console.log(
                  "activity_csv_name_dedup :::: " +
                    activity_csv_name_dedup.length
                );

                var records = [];

                for (let i = 0; i < activity_csv_name_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(activity_csv_name_dedup[i].id);
                  individual_rec.push(activity_csv_name_dedup[i].name);
                  individual_rec.push(activity_csv_name_dedup[i].type);
                  individual_rec.push(activity_csv_name_dedup[i].status);
                  individual_rec.push(activity_csv_name_dedup[i].library_id);

                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO activity_csv_name (id, name, type,status,library_id) VALUES ? 
       ON DUPLICATE KEY UPDATE name = VALUES(name),type = VALUES(type),library_id = VALUES(library_id),status = VALUES(status)`;
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );

                /*
          if (activity_csv_name_dedup.length > 0) {
            try {
              for(let i=0;i<activity_csv_name_dedup.length;i++)
              {
                var activity_csv_response =
                 db.activity_csv_name.upsert(activity_csv_name_dedup[i],  { returning: true } );
              }
             
           
            } catch (error) {
              console.log(error);
              console.log("activity_csv_name_dedup error");

            }
          }
*/
                console.log(
                  "admin_activities dedup :::: " + activity_dedup.length
                );

                var activityrecords = [];
                for (let i = 0; i < activity_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(activity_dedup[i].id);
                  individual_rec.push(activity_dedup[i].code);
                  individual_rec.push(activity_dedup[i].type);
                  individual_rec.push(activity_dedup[i].description);
                  individual_rec.push(activity_dedup[i].name);
                  individual_rec.push(activity_dedup[i].status);
                  individual_rec.push(activity_dedup[i].document_name);
                  individual_rec.push(activity_dedup[i].kpi_name);
                  activityrecords.push(individual_rec);
                }
                console.log(activityrecords.length);

                var sql =
                  "INSERT INTO admin_activities (id, code, type, description,name,status,document_name,kpi_name) VALUES ? ON DUPLICATE KEY UPDATE code = VALUES(code),type = VALUES(type),description=VALUES(description),name=VALUES(name),status=VALUES(status),document_name=VALUES(document_name),kpi_name=VALUES(kpi_name)";
                connection.query(
                  sql,
                  [activityrecords],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                  }
                );

                var records = [];
                var chapterloading = false;
                for (let i = 0; i < chapter_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(chapter_dedup[i].id);
                  individual_rec.push(chapter_dedup[i].name);
                  individual_rec.push(chapter_dedup[i].description);
                  individual_rec.push(chapter_dedup[i].library_id);
                  individual_rec.push(chapter_dedup[i].code);
                  individual_rec.push(chapter_dedup[i].status);
                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql =
                  "INSERT INTO chapters (id, name,description, library_id, code,status) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name),description=VALUES(description),library_id = VALUES(library_id),code=VALUES(code),status=VALUES(status)";
                connection.query(sql, [records], function (err, result) {
                  console.log(result);
                  console.log(err);
                  results["chapterloading"] = true;
                  //uploadcomplete(req, res, fileLink);
                });

                /*
          if (activity_dedup.length > 0) {
            try {
              for(let i=0;i<activity_dedup.length;i++)
              {
                var admin_activity_response =
                await db.admin_activities.upsert(activity_dedup[i],  { returning: true } );
              }
             
            } catch (error) {
              console.log(error);
              console.log("admin_activity_response error")
            }
          }
          console.log("chapters_response started ::: " + chapter_dedup.length)
          console.log(chapter_dedup)
          
          if (chapter_dedup.length > 0) {
            try {
              for(let i=0;i<chapter_dedup.length;i++)
              {
                var chapters_response =
                await db.chapters.upsert(chapter_dedup[i],  { returning: true } );
              }
           

            } catch (error) {
              console.log(error);
              console.log("chapters_response error")
            }
          }

            var standardSection = {
                    id: standard_id,
                    name: element.Standard,
                    chapter_id: chapter_id,
                    library_id: libraryId,
                    code: standard_code,
                    status: master.status.active,
                  };
*/
                console.log("standards started ::: " + standards_dedup.length);
                var records = [];
                var standardsloading = false;
                for (let i = 0; i < standards_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(standards_dedup[i].id);
                  individual_rec.push(standards_dedup[i].name);
                  individual_rec.push(standards_dedup[i].description);
                  individual_rec.push(standards_dedup[i].chapter_id);
                  individual_rec.push(standards_dedup[i].code);
                  individual_rec.push(standards_dedup[i].status);
                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql =
                  "INSERT INTO standards (id, name,description,chapter_id, code,status) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name),description = VALUES(description), chapter_id = VALUES(chapter_id),code=VALUES(code),status=VALUES(status)";
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                    results["standardsloading"] = true;
                    //uploadcomplete(req, res, fileLink);
                  }
                );

                console.log(
                  "substandards_dedup started :::: " + substandards_dedup.length
                );
                var records = [];
                var substandardsloading = false;

                for (let i = 0; i < substandards_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(substandards_dedup[i].id);
                  individual_rec.push(substandards_dedup[i].name);
                  individual_rec.push(substandards_dedup[i].standard_id);
                  individual_rec.push(substandards_dedup[i].status);
                  individual_rec.push(substandards_dedup[i].code);
                  individual_rec.push(substandards_dedup[i].esr);
                  individual_rec.push(substandards_dedup[i].description);
                  individual_rec.push(substandards_dedup[i].sessionClass);
                  individual_rec.push(substandards_dedup[i].surveycategory);
                  individual_rec.push(substandards_dedup[i].unitFocus);
                  individual_rec.push(substandards_dedup[i].file);
                  individual_rec.push(substandards_dedup[i].substandard_uid);
                  
                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO sub_standards (id, name, standard_id,status, code,esr,description,session_class_id,surveyor_category_id,unit_focus_area,file,substandard_uid) VALUES ? 
       ON DUPLICATE KEY UPDATE name = VALUES(name),standard_id = VALUES(standard_id),status = VALUES(status),code=VALUES(code),esr=VALUES(esr),
       description = VALUES(description),session_class_id = VALUES(session_class_id),surveyor_category_id = VALUES(surveyor_category_id),unit_focus_area = VALUES(unit_focus_area),substandard_uid=VALUES(substandard_uid)`;
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                    results["substandardsloading"] = true;
                    //uploadcomplete(req, res, fileLink);
                  }
                );

                console.log(
                  "activityMapping_dedup  ::: " + activityMapping_dedup.length
                );
                console.log(activityMapping);
                console.log(activityMapping_dedup);

                var records = [];
                var activitymappingloading = false;
                for (let i = 0; i < activityMapping_dedup.length; i++) {
                  var individual_rec = [];
                  individual_rec.push(activityMapping_dedup[i].id);
                  individual_rec.push(activityMapping_dedup[i].library_id);
                  individual_rec.push(activityMapping_dedup[i].chapter_id);
                  individual_rec.push(activityMapping_dedup[i].standard_id);
                  individual_rec.push(activityMapping_dedup[i].substandard_id);
                  individual_rec.push(
                    activityMapping_dedup[i].admin_activity_id
                  );
                  individual_rec.push(activityMapping_dedup[i].status);
                  individual_rec.push(0);

                  records.push(individual_rec);
                }
                console.log(records.length);

                var sql = `INSERT INTO activity_mapping (id, library_id, chapter_id,standard_id, substandard_id,admin_activity_id,status,organization_id) VALUES ? 
       ON DUPLICATE KEY UPDATE library_id = VALUES(library_id),chapter_id = VALUES(chapter_id),standard_id = VALUES(standard_id),
       substandard_id = VALUES(substandard_id), admin_activity_id = VALUES(admin_activity_id), status = VALUES(status)`;
                var query = connection.query(
                  sql,
                  [records],
                  function (err, result) {
                    console.log(result);
                    console.log(err);
                    results["activitymappingloading"] = true;
                  }
                );

                //   connection.end();
                /*
          if (activityMapping_dedup.length > 0) {
            try {
              for(let i=0;i<adminelementActivity_dedup.length;i++)
              {
                var activityMapping_dedup_response =
                await db.activity_mapping.upsert(activityMapping_dedup[i],  { returning: true } );
              }
      
            } catch (error) {
              console.log(error);
              console.log("activityMapping_dedup  ::: error" )
            }
          }

          
*/

                console.log(
                  "activity element dedup started :::: " +
                    adminelementActivity_dedup.length
                );
                var records = [];
                var adminelementloading = false;
                if (adminelementActivity_dedup.length > 0) {
                  for (let i = 0; i < adminelementActivity_dedup.length; i++) {
                    var individual_rec = [];
                    individual_rec.push(adminelementActivity_dedup[i].id);
                    individual_rec.push(
                      adminelementActivity_dedup[i].admin_activity_id
                    );
                    individual_rec.push(
                      adminelementActivity_dedup[i].substandard_id
                    );
                    individual_rec.push(
                      adminelementActivity_dedup[i].element_code
                    );
                    individual_rec.push(
                      adminelementActivity_dedup[i].element_name
                    );
                    individual_rec.push(1);

                    records.push(individual_rec);
                  }
                  console.log(records.length);

                  var sql = `INSERT INTO activity_elements (id, admin_activity_id, substandard_id,element_code, element_name,status) VALUES ? 
ON DUPLICATE KEY UPDATE admin_activity_id = VALUES(admin_activity_id),substandard_id = VALUES(substandard_id),element_code = VALUES(element_code),element_name=VALUES(element_name),status=VALUES(status)`;
                  var query = connection.query(
                    sql,
                    [records],
                    function (err, result) {  
                      console.log(result);
                      console.log(err);
                      results["adminelementloading"] = true;
                      uploadcomplete(req, res, fileLink);
                      //uploadcomplete(req, res, fileLink);
                    }
                  );
                } else {
                  results["adminelementloading"] = true;
                  uploadcomplete(req, res, fileLink);
                }

                console.log("chapter load ::: " + chapterloading);
                console.log("standards load ::: " + standardsloading);
                console.log("substandards load :::" + substandardsloading);

                console.log(
                  "activity mapping load ::: " + activitymappingloading
                );

                console.log(
                  "adminelementloading load :::" + adminelementloading
                );
              }
            });
          } else {
            res.status(200);
            return res.send("Libraries are in Use by Other Clients");
          }
        } else {
          res.status(200);
          return res.send("No datas present in Csv");
        }
      });
  } catch (error) {
    logger.info("/error", error);
    res.status(500);
    return res.send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};

function uploadcomplete(req, res, fileLink) {
  console.log(results);
  if (
    results["chapterloading"] &&
    results["standardsloading"] &&
    results["substandardsloading"] &&
    results["activitymappingloading"] &&
    results["adminelementloading"]
  ) {
    db.download_samples
      .create({
        link: fileLink,
        type: req.body.type,
        status: master.status.active,
        createdBy: req.userId,
      })
      .then((data) => {
        auditCreate
          .create({
            user_id: req.userId,
            table_name: "download_samples",
            primary_id: data.id,
            event: "create",
            new_value: data.dataValues,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          })
          .then((data) => {
            return res.send("Upload Successful");
          });
      })
      .catch((error) => {
        res.status(500);
        logger.info("/error", error);
        return res.send(error);
      });
  }
}

abbrevation = (str) => {
  // var str = "Java Script Object Notation";
  var matches = str.match(/\b(\w)/g); // ['J','S','O','N']
  var acronym = matches.join(""); // JSON
  return acronym;
};
exports.accredation = async (req, res) => {
  //console.log(req.body)
  if (req.file == undefined) {
    res.send("Please upload a CSV file!");
  }
  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    var fileLink = path.replace("./", "");
  }

  let tutorials = [];
  const directoryPath = pathtest.join(
    __dirname,
    "../public/document/" + req.file.filename
  );
  fs.createReadStream(directoryPath)
    .pipe(csv.parse({ headers: true }))
    .on("error", (error) => {
      throw error.message;
    })
    .on("data", async (row) => {
      tutorials.push(row);
    })
    .on("end", async () => {
      // console.log(tutorials)
      if (tutorials.length > 0) {
        if (req.body.type == "library") {
          for (let index = 0; index < tutorials.length; index++) {
            const element = tutorials[index];
            var libraryName = await db.libraries.findAll({
              where: { name: element.Library },
            });
            var doc = [];
            if (libraryName.length == 0) {
              doc.push(element);
              db.libraries
                .create({
                  code: element.Library,
                  name: element.Library,
                  description: element.Description,
                  status: master.status.active,
                })
                .then((data) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "libraries",
                    primary_id: data.id,
                    event: "create",
                    new_value: data.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  if (tutorials.length == index + 1) {
                    db.download_samples
                      .create({
                        link: fileLink,
                        type: req.body.type,
                        status: master.status.active,
                        createdBy: req.userId,
                      })
                      .then((data) => {
                        auditCreate.create({
                          user_id: req.userId,
                          table_name: "download_samples",
                          primary_id: data.id,
                          event: "create",
                          new_value: data.dataValues,
                          url: req.url,
                          user_agent: req.headers["user-agent"],
                          ip_address: req.connection.remoteAddress,
                        });
                        res.send({
                          data: data,
                          note: doc.length + " Records Inserteds",
                        });
                      })
                      .catch((error) => {
                        logger.info("/error", error);
                        res.send(error);
                      });
                  }
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send(error);
                });
            } else {
              if (tutorials.length == index + 1) {
                db.download_samples
                  .create({
                    link: fileLink,
                    type: req.body.type,
                    status: master.status.active,
                    createdBy: req.userId,
                  })
                  .then((data) => {
                    auditCreate.create({
                      user_id: req.userId,
                      table_name: "download_samples",
                      primary_id: data.id,
                      event: "create",
                      new_value: data.dataValues,
                      url: req.url,
                      user_agent: req.headers["user-agent"],
                      ip_address: req.connection.remoteAddress,
                    });
                    res.send({
                      data: data,
                      note: doc.length + " Records Inserteds",
                    });
                  })
                  .catch((error) => {
                    logger.info("/error", error);
                    res.send(error);
                  });
              }
            }
          }
        } else if (req.body.type == "chapter") {
          for (let index = 0; index < tutorials.length; index++) {
            const element = tutorials[index];
            // var libraryName = await db.libraries.findAll({ where: { id: element.Library } })
            //console.log(req.body);
            var chapterName = await db.chapters.findAll({
              where: { name: element.Chapter, library_id: req.body.library_id },
            });
            var doc = [];
            if (chapterName.length == 0) {
              doc.push(element);
              db.chapters
                .create({
                  library_id: req.body.library_id,
                  code: req.body.library_code + "." + element.Chapter,
                  name: element.Chapter,
                  description: element.Description,
                  status: master.status.active,
                })
                .then((data) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "libraries",
                    primary_id: data.id,
                    event: "create",
                    new_value: data.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  if (tutorials.length == index + 1) {
                    db.download_samples
                      .create({
                        link: fileLink,
                        type: req.body.type,
                        status: master.status.active,
                        createdBy: req.userId,
                      })
                      .then((data) => {
                        auditCreate.create({
                          user_id: req.userId,
                          table_name: "download_samples",
                          primary_id: data.id,
                          event: "create",
                          new_value: data.dataValues,
                          url: req.url,
                          user_agent: req.headers["user-agent"],
                          ip_address: req.connection.remoteAddress,
                        });
                        res.send({
                          data: data,
                          note: doc.length + " Records Inserteds",
                        });
                      })
                      .catch((error) => {
                        logger.info("/error", error);
                        res.send(error);
                      });
                  }
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send(error);
                });
            } else {
              if (tutorials.length == index + 1) {
                db.download_samples
                  .create({
                    link: fileLink,
                    type: req.body.type,
                    status: master.status.active,
                    createdBy: req.userId,
                  })
                  .then((data) => {
                    auditCreate.create({
                      user_id: req.userId,
                      table_name: "download_samples",
                      primary_id: data.id,
                      event: "create",
                      new_value: data.dataValues,
                      url: req.url,
                      user_agent: req.headers["user-agent"],
                      ip_address: req.connection.remoteAddress,
                    });
                    res.send({
                      data: data,
                      note: doc.length + " Records Inserteds",
                    });
                  })
                  .catch((error) => {
                    logger.info("/error", error);
                    res.send(error);
                  });
              }
            }
          }
        } else if (req.body.type == "standard") {
          for (let index = 0; index < tutorials.length; index++) {
            const element = tutorials[index];
            var standardName = await db.standards.findAll({
              where: {
                name: element.Standard,
                chapter_id: req.body.chapter_id,
              },
            });
            var doc = [];
            if (standardName.length == 0) {
              doc.push(element);
              db.standards
                .create({
                  chapter_id: req.body.chapter_id,
                  code: req.body.chapter_code + "." + element.Standard,
                  name: element.Standard,
                  description: element.Description,
                  status: master.status.active,
                })
                .then((data) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "libraries",
                    primary_id: data.id,
                    event: "create",
                    new_value: data.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  if (tutorials.length == index + 1) {
                    db.download_samples
                      .create({
                        link: fileLink,
                        type: req.body.type,
                        status: master.status.active,
                        createdBy: req.userId,
                      })
                      .then((data) => {
                        auditCreate.create({
                          user_id: req.userId,
                          table_name: "download_samples",
                          primary_id: data.id,
                          event: "create",
                          new_value: data.dataValues,
                          url: req.url,
                          user_agent: req.headers["user-agent"],
                          ip_address: req.connection.remoteAddress,
                        });
                        res.send({
                          data: data,
                          note: doc.length + " Records Inserteds",
                        });
                      })
                      .catch((error) => {
                        logger.info("/error", error);
                        res.send(error);
                      });
                  }
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send(error);
                });
            } else {
              if (tutorials.length == index + 1) {
                db.download_samples
                  .create({
                    link: fileLink,
                    type: req.body.type,
                    status: master.status.active,
                    createdBy: req.userId,
                  })
                  .then((data) => {
                    auditCreate.create({
                      user_id: req.userId,
                      table_name: "download_samples",
                      primary_id: data.id,
                      event: "create",
                      new_value: data.dataValues,
                      url: req.url,
                      user_agent: req.headers["user-agent"],
                      ip_address: req.connection.remoteAddress,
                    });
                    res.send({
                      data: data,
                      note: doc.length + " Records Inserteds",
                    });
                  })
                  .catch((error) => {
                    logger.info("/error", error);
                    res.send(error);
                  });
              }
            }
          }
          // var standardName = await db.standards.findAll({ where: { name: element.Standard } })
          // var substandardName = await db.sub_standards.findAll({ where: { name: element.SubStandard } })
          // var activityName = await db.admin_activities.findAll({ where: { name: element.Library } })
          // console.log(chapterName);
        } else if (req.body.type == "sub_standard") {
          for (let index = 0; index < tutorials.length; index++) {
            const element = tutorials[index];
            var sub_standardName = await db.sub_standards.findAll({
              where: {
                name: element.Standard,
                standard_id: req.body.standard_id,
              },
            });
            var surveyorcategory = await db.surveyor_categories.findAll({
              where: {
                category_name: element.Surveyor,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });
            var unit_focus_area = await db.unit_focus_areas.findAll({
              where: {
                name: element.Surveyor,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });
            var session = await db.session_classes.findAll({
              where: {
                class_name: element.Session,
                status: { [Op.notIn]: [master.status.delete] },
              },
            });
            // if(surveyorcategory.length == 0){
            //   console.log("test")
            //   var surveyorCreate=await db.surveyor_categories.create({category_name: element.Surveyor,status:master.status.active })
            // }else{
            //   var surveyorCreate=surveyorcategory[0].dataValues.id;
            //   console.log(surveyorcategory)
            // }
            //console.log(surveyorCreate)
            var doc = [];
            if (sub_standardName.length == 0) {
              doc.push(element);

              db.sub_standards
                .create({
                  standard_id: req.body.standard_id,
                  code: req.body.standard_code + "." + element.Standard,
                  name: element.Standard,
                  description: element.Description,
                  esr: element.ESR == "NO" ? 0 : 1,
                  surveyor_category_id:
                    element.Surveyor == "#N/A"
                      ? null
                      : surveyorcategory.length != 0
                      ? surveyorcategory[0].dataValues.id
                      : null,
                  session_class_id:
                    element.Session == "#N/A"
                      ? null
                      : session.length != 0
                      ? session[0].dataValues.id
                      : null,
                  unit_focus_area:
                    element.UnitFocusArea == "#N/A"
                      ? null
                      : unit_focus_area.length != 0
                      ? unit_focus_area[0].dataValues.id
                      : null,
                  file: fileLink,
                  status: master.status.active,

                  // standard_id:req.body.standard_id, code:req.body.standard_code+"."+element.Standard,name:element.Standard,description: element.Description,status: master.status.active
                })
                .then((data) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "libraries",
                    primary_id: data.id,
                    event: "create",
                    new_value: data.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  if (tutorials.length == index + 1) {
                    db.download_samples
                      .create({
                        link: fileLink,
                        type: req.body.type,
                        status: master.status.active,
                        createdBy: req.userId,
                      })
                      .then((data) => {
                        auditCreate.create({
                          user_id: req.userId,
                          table_name: "download_samples",
                          primary_id: data.id,
                          event: "create",
                          new_value: data.dataValues,
                          url: req.url,
                          user_agent: req.headers["user-agent"],
                          ip_address: req.connection.remoteAddress,
                        });
                        res.send({
                          data: data,
                          note: doc.length + " Records Inserteds",
                        });
                      })
                      .catch((error) => {
                        logger.info("/error", error);
                        res.send(error);
                      });
                  }
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send(error);
                });
            } else {
              if (tutorials.length == index + 1) {
                db.download_samples
                  .create({
                    link: fileLink,
                    type: req.body.type,
                    status: master.status.active,
                    createdBy: req.userId,
                  })
                  .then((data) => {
                    auditCreate.create({
                      user_id: req.userId,
                      table_name: "download_samples",
                      primary_id: data.id,
                      event: "create",
                      new_value: data.dataValues,
                      url: req.url,
                      user_agent: req.headers["user-agent"],
                      ip_address: req.connection.remoteAddress,
                    });
                    res.send({
                      data: data,
                      note: doc.length + " Records Inserteds",
                    });
                  })
                  .catch((error) => {
                    logger.info("/error", error);
                    res.send(error);
                  });
              }
            }
          }
          // var standardName = await db.standards.findAll({ where: { name: element.Standard } })
          // var substandardName = await db.sub_standards.findAll({ where: { name: element.SubStandard } })
          // var activityName = await db.admin_activities.findAll({ where: { name: element.Library } })
          // console.log(chapterName);
        }
      } else {
        res.send("No datas present in Csv");
      }
    });
};
library_create = (datas) => {
  db.libraries
    .create({
      code: element.Library,
      name: element.Library,
      description: element.Description,
      status: master.status.active,
    })
    .then((data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "libraries",
        primary_id: data.id,
        event: "create",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      return true;
    });
};
exports.update = async (req, res) => {
  try {
    db.download_samples
      .update(
        {
          link: req.body.link,
          type: req.body.type,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "download_samples",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.get = async (req, res) => {
  try {
    db.download_samples
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        attributes: ["download_samples.*", "users.name"],
        include: [
          {
            model: db.users,
            as: "users",

            attributes: [],
            nested: false,
            required: false,
          },
        ],

        order: [["id", "DESC"]],
        raw: true,
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.getById = async (req, res) => {
  try {
    db.download_samples
      .findAll({
        where: {
          id: req.params.id,
        },
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.delete = async (req, res) => {
  //db.download_samples.destroy({
  //      where:{
  //   id:req.params.id
  // }
  var get = await db.download_samples.findOne({ where: { id: req.params.id } });
  console.log(get.link);
  try {
    db.download_samples
      .update(
        {
          status: master.status.delete,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        // auditCreate.create({ "user_id": req.userId, 'table_name': "download_samples", 'primary_id': data.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
        //console.log("sta")

        fs.unlink("./" + get.link, (err) => {
          // console.log("sta")
          if (err) {
            res.send("failed to delete:" + err);
            // console.log("failed to delete local image:" + err);
          } else {
            res.send("successfully deleted");
          }
        });
        // res.send("deleted")
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
exports.statusChange = async (req, res) => {
  try {
    db.download_samples
      .update(
        {
          status: req.params.status,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "download_samples",
          primary_id: data.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("status changed");
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};
