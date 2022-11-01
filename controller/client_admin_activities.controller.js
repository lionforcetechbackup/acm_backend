const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
const multer = require("multer");
const { where } = require("sequelize");
const helper = require("../util/helper");
const { exit } = require("process");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/docs");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + file.originalname);
  },
});
var fileFilter = (req, file, cb) => {
  if (
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/doc" ||
    file.mimetype === "application/docx" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const activity_element = async () => {
  return db.activity_elements.count().then((count) => {
    return count;
  });
};

SubstandardgetUpdate = async (
  assign_element,
  client_activity_id,
  organization_id,
  element
) => {
  var count = await db.activity_elements.count();
  total_assign_el = assign_element.length;

  assign_element.map(async (element) => {
    var activity_el = await activity_element();
    if (activity_el !== undefined || activity_el !== "undefined") {
    }

    // var count=db.activity_elements.count();
  });
  // return aa
  //console.log(aa);
};
assignElement = async (assign_element, organization_id, id, req) => {
  if (assign_element.length > 0) {
    for (let index = 0; index < assign_element.length; index++) {
      const element = assign_element[index];
      let countDetail = await db.activity_elements.count();
      let element_name = helper.mysql_real_escape_string(element.element_name);
      //console.log(req.body.name);

      var admin_activity_element = crypto
        .createHash("sha256")
        .update(id + "_" + element_name + "_" + organization_id)
        .digest("hex");
      //console.log(admin_activity_element);

      var activity_elements_check = await db.sequelize.query(
        `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name=:element_name`,
        {
          replacements: {
            element_name: element_name,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (activity_elements_check && activity_elements_check[0].count !== 0) {
        if (assign_element.length == index + 1) {
          return datas;
        }
      } else {
        // console.log(element);

        // let substandard_uid = crypto.createHash("sha256").update(element_name.trim()).digest("hex");
        let substandard_uid = null;
        if (element.substandard_id) {
          let elSubstandard = await db.sub_standards.findOne({
            where: {
              id: element.substandard_id,
            },
          });

          element.element_name = elSubstandard.description;
          substandard_uid = elSubstandard.substandard_uid;
        }

        await db.activity_elements
          .create({
            id: admin_activity_element,
            client_activity_id: id,
            // substandard_id: element.substandard_id,
            substandard_id: substandard_uid,
            element_code: "E" + countDetail,
            element_name: element.element_name,
            organization_id: organization_id,
          })
          .then((datas) => {
            auditCreate.create({
              user_id: req.userId,
              table_name: "activity_elements",
              primary_id: datas.id,
              event: "create",
              new_value: datas.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            if (assign_element.length == index + 1) {
              return datas;
            }
          })
          .catch((error) => console.log(error));
      }
    }
  } else {
    return assign_element;
  }
};

createElementAdmin = async (create_element, organization_id, id, req) => {
  //console.log(create_element);
  if (create_element.length > 0) {
    for (let key = 0; key < create_element.length; key++) {
      const element = create_element[key];
      let count = await db.activity_elements.count();
      let element_name = helper.mysql_real_escape_string(element.element_name);

      var admin_activity_element = crypto
        .createHash("sha256")
        .update(id + "_" + element_name + "_" + +organization_id)
        .digest("hex");
      let orgCond = "";
      if (req.role_id > 1) {
        orgCond = ` and organization_id=${organization_id}`;
      }

      //console.log(element.element_name);
      var activity_elements_check = await db.sequelize.query(
        `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name=:element_name  ${orgCond}`,
        {
          replacements: {
            element_name: element_name,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (activity_elements_check && activity_elements_check[0].count !== 0) {
        return true;
      } else {
        // if (req.role_id == 3 || req.role_id == 2) {
        //   element.substandard_id = null;
        // }
        console.log("el created");
        let elsubstandard_id = element.substandard_id;
        if (element.substandard_id) {
          elsubstandard_id = crypto
            .createHash("sha256")
            .update(element_name.trim())
            .digest("hex");
        }

        await db.activity_elements
          .upsert({
            id: admin_activity_element,
            admin_activity_id: id,
            element_code: "E" + count,
            element_name: element_name,
            substandard_id: elsubstandard_id,
            element_response: element.element_response
              ? element.element_response
              : null,
            organization_id: organization_id,
            status: master.status.active,
          })
          .then(async (datas) => {
            if (!element.sub_element) {
              return true;
            }
            if (element.sub_element.length > 0) {
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_elements",
                primary_id: datas.id,
                event: "create",
                new_value: datas.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });

              await subElement(
                element.sub_element,
                organization_id,
                id,
                req,
                datas.id
              );
            } else {
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_elements",
                primary_id: datas.id,
                event: "create",
                new_value: "",
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              return datas;
            }
          });
      }
    }
  } else {
    return true;
  }
};

createElement = async (create_element, organization_id, id, req) => {
  // console.log(create_element);
  if (create_element.length > 0) {
    for (let key = 0; key < create_element.length; key++) {
      const element = create_element[key];
      let count = await db.activity_elements.count();
      let element_name = helper.mysql_real_escape_string(element.element_name);
      var admin_activity_element = crypto
        .createHash("sha256")
        .update(id + "_" + element_name + "_" + organization_id)
        .digest("hex");

      //console.log(element_name);
      var activity_elements_check = await db.sequelize.query(
        `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name=:element_name`,
        {
          replacements: {
            element_name: element_name,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (activity_elements_check && activity_elements_check[0].count !== 0) {
        return true;
      } else {
        await db.activity_elements
          .create({
            id: admin_activity_element,
            client_activity_id: id,
            element_code: "E" + count,
            element_name: element_name,
            element_response: element.element_response
              ? element.element_response
              : null,
            organization_id: organization_id,
            status: master.status.active,
          })
          .then(async (datas) => {
            if (!element.sub_element) {
              return true;
            }
            if (element.sub_element.length > 0) {
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_elements",
                primary_id: datas.id,
                event: "create",
                new_value: datas.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });

              await subElement(
                element.sub_element,
                organization_id,
                id,
                req,
                datas.id
              );
            } else {
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_elements",
                primary_id: datas.id,
                event: "create",
                new_value: datas.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              return datas;
            }
          });
      }
    }
  } else {
    return true;
  }
};
subElement = async (sub_element, organization_id, id, req, parentId) => {
  for (let subkey = 0; subkey < sub_element.length; subkey++) {
    const subelement = sub_element[subkey];
    let subcount = await db.activity_elements.count();
    let element_name = subelement.element_name;
    await db.activity_elements
      .create({
        client_activity_id: id,
        element_code: "E" + subcount,
        parent_id: parentId,
        element_name: element_name,
        element_response: subelement.element_response,
        organization_id: organization_id,
        status: master.status.active,
      })
      .then((subdatas) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "activity_elements",
          primary_id: subdatas.id,
          event: "create",
          new_value: subdatas.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        if (subelement.length == subkey + 1) {
          return subdatas;
        }
      });
  }
};
abbrevation = (str) => {
  // var str = "Java Script Object Notation";
  var matches = str.match(/\b(\w)/g); // ['J','S','O','N']
  var acronym = matches.join(""); // JSON
  return acronym;
};
exports.create = async (req, res) => {
  // console.log("client activity creation");
  var codeCreate = abbrevation(req.body.name);
  // ===================
  var assign_element = req.body.assign_element;
  var create_element = req.body.create_element;

  try {
    var code = await db.client_admin_activities.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
    var elementCode = await db.activity_elements.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });

    // client_admin_activity_id = crypto
    //   .createHash("sha256")
    //   .update(req.body.name + "_" + req.body.type)
    //   .digest("hex");

    if (req.body.type == 1) {
      //type 1 checklist
      ///step1-activity create
      // console.log(req.body.type == 1)
      await db.client_admin_activities
        .create({
          code: "Chk." + codeCreate + "." + code,
          description: req.body.description,
          type: req.body.type,
          name: req.body.name,
          response_frequency: req.body.response_frequency,
          submission_day: req.body.submission_day,
          organization_id: req.body.organization_id,
          status: master.status.active,
          element_dummy:
            req.body.element_dummy == ""
              ? null
              : JSON.stringify(JSON.stringify(req.body.element_dummy)),
          assign_dummy:
            req.body.assign_dummy == ""
              ? null
              : JSON.stringify(JSON.stringify(req.body.assign_dummy)),
          createdby: req.userId,
        })
        .then(async (data) => {
          ///step2-assign element insert
          await helper.activitySessionMappingInsert(req, data.id);

          console.log("assignElement ");
          if (assign_element != null) {
            await assignElement(
              assign_element,
              req.body.organization_id,
              data.id,
              req
            );
          }

          console.log("createElement ");

          //console.log('testw');
          //console.log(create_element, req.body.organization_id, data.id, req);
          ///step3-create element insert
          if (create_element != null) {
            await createElement(
              create_element,
              req.body.organization_id,
              data.id,
              req
            );
          }

          //console.log('teste');

          // db.query('SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM `sub_standards` INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id=1').then((data)=>{})

          // /step4-join and fetch all ids
          //console.log(req.body.substandard_ids, 11111111111);
          if (req.body.substandard_id.length > 0) {
            substandard_ids = req.body.substandard_id.map((sub) => sub.id);
            substandard_ids.forEach((sub_id, key) => {
              db.sequelize
                .query(
                  `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                )
                .then((finaldata) => {
                  // console.log(finaldata);
                  ///step4-activity_mapping create

                  var admin_activity_id_mapping = crypto
                    .createHash("sha256")
                    .update(
                      req.body.name +
                        "_" +
                        finaldata[0].id +
                        "_" +
                        finaldata[0].standard_id +
                        "_" +
                        finaldata[0].chapter_id +
                        "_" +
                        finaldata[0].library_id
                    )
                    .digest("hex");

                  db.activity_mapping
                    .upsert({
                      id: admin_activity_id_mapping,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      client_activity_id: data.id,
                      status: master.status.active,
                      organization_id: req.organization_id,
                    })
                    .then((mappingdata) => {
                      auditCreate.create({
                        user_id: req.userId,
                        table_name: "client_admin_activities",
                        primary_id: data.id,
                        event: "create",
                        new_value: mappingdata.dataValues,
                        url: req.url,
                        user_agent: req.headers["user-agent"],
                        ip_address: req.connection.remoteAddress,
                      });
                      auditCreate.create({
                        user_id: req.userId,
                        table_name: "activity_mapping",
                        primary_id: finaldata.id,
                        event: "create",
                        new_value: finaldata.dataValues,
                        url: req.url,
                        user_agent: req.headers["user-agent"],
                        ip_address: req.connection.remoteAddress,
                      });
                      if (key + 1 == req.body.substandard_id.length) {
                        res.send({ message: "activity Created" });
                        //res.send(data);
                      }
                    })
                    .catch((error) => {
                      logger.info("/error", error);
                    });
                })
                .catch((error) => {
                  logger.info("/error", error);
                });
            });
          } else {
            res.send({ message: "activity Created" });
          }
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
          res.send(error);
        });
    } else if (req.body.type == 2) {
      //datacollection

      if (req.body.kpi == 0) {
        var codeValue = "Obs." + codeCreate + "." + code;
        var type_of_number_value = null;
      } else {
        var codeValue = "Kpi." + codeCreate + "." + code;
        var type_of_number_value = req.body.type_of_number;
      }

      try {
        clientActivities = await db.client_admin_activities.create({
          code: codeValue,
          description: req.body.description,
          organization_id: req.body.organization_id,
          type: req.body.type,
          name: req.body.name,
          response_frequency: req.body.response_frequency,
          submission_day: req.body.submission_day,
          kpi: req.body.kpi,
          kpi_name: req.body.kpi_name,
          type_of_measure: req.body.type_of_measure,
          aggregation_type: req.body.aggregation_type,
          status: master.status.active,
          observation_type: req.body.observation_type,
          currency_type: req.body.currency_type,
          observation_name: req.body.observation_name,
          assign_dummy: "",
          // req.body.assign_dummy == ""
          //   ? null
          //   : JSON.stringify(JSON.stringify(req.body.assign_dummy))
          createdby: req.userId,
          // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
        });

        await helper.activitySessionMappingInsert(req, clientActivities.id);

        clientAdminDataCollection =
          await db.client_admin_datacollections.create({
            type_of_number: type_of_number_value,
            target: req.body.target,
            client_id: req.body.client_id,
            organization_id: req.body.organization_id,
            status: master.status.active,
            totarget: req.body.totarget,
            admin_activity_id: req.body.admin_activity_id,
            client_activity_id: clientActivities.id,
          });

        if (req.body.substandard_id.length > 0) {
          substandard_ids = req.body.substandard_id.map((sub) => sub.id);
          for (let key = 0; key < substandard_ids.length; key++) {
            const sub_id = substandard_ids[key];
            finaldata = await db.sequelize.query(
              `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            var admin_activity_id_mapping = crypto
              .createHash("sha256")
              .update(
                req.body.name +
                  "_" +
                  finaldata[0].id +
                  "_" +
                  finaldata[0].standard_id +
                  "_" +
                  finaldata[0].chapter_id +
                  "_" +
                  finaldata[0].library_id
              )
              .digest("hex");

            db.activity_mapping
              .upsert({
                id: admin_activity_id_mapping,
                library_id: finaldata[0].library_id,
                chapter_id: finaldata[0].chapter_id,
                standard_id: finaldata[0].standard_id,
                substandard_id: finaldata[0].id,
                client_activity_id: clientActivities.id,
                status: master.status.active,
                organization_id: req.organization_id,
              })
              .then((mappingdata) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "client_admin_activities",
                  primary_id: clientActivities.id,
                  event: "create",
                  new_value: mappingdata.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });

                if (key + 1 == req.body.substandard_id.length) {
                  return res.send({ message: "activity Created" });
                }
              })
              .catch((error) => {
                console.log(error);
                logger.info("/error", error);
              });
          }
        } else {
          return res.send({ message: "activity Created" });
        }
      } catch (error) {
        console.log(error);
        logger.info("/error", error);
        res.send(error);
      }
    } else if (req.body.type == 3) {
      //console.log("document evidence");
      //doc evidence
      //var path = req.file.destination + "/" + req.file.filename;
      //console.log(path, 1)
      // let upload = multer({ storage: storage, fileFilter: fileFilter }).single(
      //   "file"
      // );
      var element = req.body;
      // upload(req, res, function (err) {
      // if (req.fileValidationError) {
      //   res.send(req.fileValidationError);
      // } else if (err instanceof multer.MulterError) {
      //   res.send(err);
      // } else if (err) {
      //   res.send(err);
      // }
      // if (req.file) {
      //   var path = req.file.destination + "/" + req.file.filename;
      //   var fileLink = path.replace("./", "");
      // }



      db.client_admin_activities
        .create({
          code: "Doc." + codeCreate + "." + code,
          description: element.description,
          organization_id: element.organization_id,
          type: element.type,
          name: element.name,
          response_frequency: element.response_frequency,
          submission_day: element.submission_day,
          document_name: element.document_name,
          document_description: element.document_description,
          // document_link: fileLink,
          expiry_days: element.expiry_days,
          status: master.status.active,
          assign_dummy:"",
          createdby: req.userId,
          // element_dummy: (element.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
        })
        .then(async (data) => {
          //console.log(data.id);
          await helper.activitySessionMappingInsert(req, data.id);
          // JSON.parse(element.substandard_id).length > 0 &&
          element.substandard_id;
          if (element.substandard_id.length > 0 && element.substandard_id) {
            //console.log('second11');
            // let sub = JSON.parse(element.substandard_id).map(
            //   (subst) => subst.id
            // );

            let sub = element.substandard_id.map((subst) => subst.id);

            for (let key = 0; key < sub.length; key++) {
              const sub_id = sub[key];
              db.sequelize
                .query(
                  `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                )
                .then((finaldata) => {
                  ///step4-activity_mapping create
                  //console.log(finaldata, 'second');
                  var admin_activity_id_mapping = crypto
                    .createHash("sha256")
                    .update(
                      req.body.name +
                        "_" +
                        finaldata[0].id +
                        "_" +
                        finaldata[0].standard_id +
                        "_" +
                        finaldata[0].chapter_id +
                        "_" +
                        finaldata[0].library_id
                    )
                    .digest("hex");

                  db.activity_mapping
                    .upsert({
                      id: admin_activity_id_mapping,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      client_activity_id: data.id,
                      status: master.status.active,
                      organization_id: req.organization_id,
                    })
                    .then((mappingdata) => {
                      //console.log('third', mappingdata);
                      auditCreate.create({
                        user_id: req.userId,
                        table_name: "client_admin_activities",
                        primary_id: data.id,
                        event: "create",
                        new_value: mappingdata.dataValues,
                        url: req.url,
                        user_agent: req.headers["user-agent"],
                        ip_address: req.connection.remoteAddress,
                      });
                      auditCreate.create({
                        user_id: req.userId,
                        table_name: "activity_mapping",
                        primary_id: finaldata.id,
                        event: "create",
                        new_value: finaldata.dataValues,
                        url: req.url,
                        user_agent: req.headers["user-agent"],
                        ip_address: req.connection.remoteAddress,
                      });
                      if (key + 1 == sub.length) {
                        // console.log('four');
                        // res.send(data);
                        res.send({ message: "activity Created" });
                      }
                    })
                    .catch((error) => {
                      logger.info("/error", error);
                    });
                })
                .catch((error) => {
                  logger.info("/error", error);
                });
            }
          } else {
            res.send({ message: "activity Created" });
          }
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
          res.send(error);
        });
      // });
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};
exports.adminActivityUpdate = async (req, res) => {
  db.client_admin_datacollections
    .findAll({
      where: {
        admin_activity_id: req.body.admin_activity_id,
        client_activity_id: req.body.client_activity_id,
        organization_id: req.body.organization_id,
      },
    })
    .then((result) => {
      if (result.length > 0) {
        db.client_admin_datacollections
          .create({
            type_of_number: req.body.type_of_number,
            target: req.body.target,
            client_id: req.body.client_id,
            organization_id: req.body.organization_id,
            totarget: req.body.totarget,
            admin_activity_id: req.body.admin_activity_id,
            client_activity_id: req.body.client_activity_id,
          })
          .then((data) => {
            auditCreate.create({
              user_id: req.userId,
              table_name: "client_admin_activities",
              primary_id: data.id,
              event: "create",
              new_value: mappingdata.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            res.send(data);
          })
          .catch((error) => {
            logger.info("/error", error);
            res.send(error);
          });
      } else {
        db.client_admin_datacollections
          .update(
            {
              type_of_number: req.body.type_of_number,
              target: req.body.target,
              client_id: req.body.client_id,
              organization_id: req.body.organization_id,
              totarget: req.body.totarget,
              admin_activity_id: req.body.admin_activity_id,
              client_activity_id: req.body.client_activity_id,
            },
            {
              where: {
                admin_activity_id: req.body.admin_activity_id,
                client_activity_id: req.body.client_activity_id,
                organization_id: req.body.organization_id,
              },
            }
          )
          .then((data) => {
            auditCreate.create({
              user_id: req.userId,
              table_name: "client_admin_activities",
              primary_id: data.id,
              event: "create",
              new_value: mappingdata.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            res.send(data);
          })
          .catch((error) => {
            logger.info("/error", error);
            res.send(error);
          });
      }
    });
};

exports.update = async (req, res) => {
  var assign_element = req.body.assign_element;
  var create_element = req.body.create_element;
  var codeCreate = abbrevation(req.body.name);
  var substandard_ids = req.body.substandard_id.map((sub) => sub.id);

  var code = await db.client_admin_activities.count({
    where: {
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var elementCode = await db.activity_elements.count({
    where: {
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  codeValue = ""; //need to come based on type

  if (!req.body.code) {
    if (req.body.type === "1") {
      codeValue = "Chk." + codeCreate + "." + code;
    } else if (req.body.type === "2") {
      if (req.body.kpi == null || req.body.kpi == 0) {
        codeValue = "Obs." + codeCreate + "." + code;
      } else {
        codeValue = "Kpi." + codeCreate + "." + code;
      }
    } else {
      codeValue = "Doc." + codeCreate + "." + code;
    }
  } else {
    codeValue = req.body.code;
  }

  auditcreateObj = {
    user_id: req.userId,
    primary_id: req.body.id,
    event: "update",
    new_value: req.body,
    url: req.url,
    user_agent: req.headers["user-agent"],
    ip_address: req.connection.remoteAddress,
  };

  if (req.body.admin_activity_id) {
    //admin activity
    activities_organization = await db.activities_organization.findOne({
      where: {
        admin_activity_id: req.body.admin_activity_id,
        organization_id: req.organization_id,
      },
    });

    activities_organization_obj = {
      code: codeValue,
      activity_type: 1,
      description: req.body.description,
      type: req.body.type,
      name: req.body.name,
      response_frequency: req.body.response_frequency,
      submission_day: req.body.submission_day,
      kpi: req.body.kpi,
      kpi_name: req.body.kpi_name,
      type_of_measure: req.body.type_of_measure,
      aggregation_type: req.body.aggregation_type,
      observation_type: req.body.observation_type,
      currency_type: req.body.currency_type,
      observation_name: req.body.observation_name,
      organization_id: req.organization_id,
      status: master.status.active,
      document_name: req.body.document_name,
      // document_link: fileLink,
      expiry_days: req.body.expiry_days,
    };

    //console.log(activities_organization);

    if (activities_organization) {
      console.log("activities_organization update");

      db.activities_organization
        .update(
          {
            ...activities_organization_obj,
            admin_activity_id: req.body.admin_activity_id,
          },
          {
            where: {
              admin_activity_id: req.body.admin_activity_id,
              organization_id: req.body.organization_id,
            },
          }
        )
        .then(async (data) => {
          await auditCreate.create({
            table_name: "admin_activities",
            ...auditcreateObj,
          });

          if (req.body.type == 1) {
            if (req.body.elementdelete) {
              //console.log("element is deleting");
              await db.activity_elements.destroy({
                where: { id: { [Op.in]: req.body.elementdelete } },
              });
            }

            if (assign_element != null && assign_element != "") {
              if (assign_element.length > 0) {
                for (let key = 0; key < assign_element.length; key++) {
                  const value = assign_element[key];
                  if (value.substandard_id && value.substandard_id != "") {
                    if (value.id && value.id != "") {
                      /*  await db.activity_elements.update(
                        {
                          admin_activity_id: req.body.admin_activity_id,
                          element_name: value.element_name,
                          substandard_id: value.substandard_id,
                          // organization_id: req.organization_id,
                          element_response:
                            value.element_response == ""
                              ? null
                              : value.element_response,
                        },
                        {
                          where: {
                            id: value.admin_activity_id,
                            organization_id: req.organization_id,
                          },
                        }
                      ); */
                    } else {
                      // console.log("element created");

                      await createElementAdmin(
                        [value],
                        req.body.organization_id,
                        req.body.admin_activity_id,
                        req
                      );
                    }
                  }
                }
              }
            }

            if (create_element && create_element.length > 0) {
              for (let key = 0; key < create_element.length; key++) {
                const value = create_element[key];
                let custom_element_name = helper.mysql_real_escape_string(
                  value.element_name
                );
                var ele_id = crypto
                  .createHash("sha256")
                  .update(
                    req.body.id +
                      "_" +
                      custom_element_name +
                      "_" +
                      req.organization_id
                  )
                  .digest("hex");
                let countDetail = await db.activity_elements.count();

                var element_code = "E" + countDetail;

                var activity_elements_check = await db.sequelize.query(
                  `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name=:element_name`,
                  {
                    replacements: {
                      element_name: custom_element_name,
                    },
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (
                  activity_elements_check &&
                  activity_elements_check[0].count !== 0
                ) {
                  return true;
                } else {
                  await db.activity_elements
                    .upsert({
                      id: ele_id,
                      admin_activity_id: req.body.id,
                      element_code: element_code,
                      element_name: custom_element_name,
                      element_response:
                        value.element_response == ""
                          ? null
                          : value.element_response,
                      status: master.status.active,
                      organization_id: req.organization_id,
                      //substandard_id: substandard_ids[0],
                    })
                    .then((datas) => {
                      auditCreate.create({
                        table_name: "activity_elements",
                        ...auditcreateObj,
                      });
                      // return datas;
                    });
                }
              }
            }

            // ====substandard_idremove====
            if (
              req.body.remove_substandard_ids != null &&
              req.body.remove_substandard_ids.length > 0
            ) {
              await db.activity_mapping.destroy({
                where: {
                  id: req.body.remove_substandard_ids,
                  organization_id: req.organization_id,
                },
              });
            }
            // ===================
          } else if (req.body.type == 2) {
            console.log("data collection");

            const dataCollObj = {
              type_of_number: req.body.type_of_number,
              target: req.body.target,
              client_id: req.userId,
              organization_id: req.body.organization_id,
              totarget: req.body.totarget,
              admin_activity_id: req.body.admin_activity_id,
              status: master.status.active,
              client_activity_id: req.body.client_activity_id,
            };

            const actOrgFind = await db.client_admin_datacollections.findAll({
              where: {
                admin_activity_id: req.body.admin_activity_id,
                organization_id: req.body.organization_id,
              },
            });

            if (actOrgFind.length == 0) {
              await db.client_admin_datacollections.create(dataCollObj);
            } else {
              await db.client_admin_datacollections.update(dataCollObj, {
                where: {
                  admin_activity_id: req.body.admin_activity_id,
                  organization_id: req.body.organization_id,
                },
              });
            }
          }

          if (
            req.body.remove_substandard_ids != null &&
            req.body.remove_substandard_ids.length > 0
          ) {
            await db.activity_mapping.destroy({
              where: {
                id: req.body.remove_substandard_ids,
                organization_id: req.organization_id,
              },
            });
          }

          await helper.activitySessionMappingInsert(
            req,
            req.body.admin_activity_id,
            1
          );

          await helper.addAssignPropertiesinClientAdmin(req);

          return res.send({ message: "Updated Successfully" });
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
        });
    } else {
      console.log("activities_organization create");
      var activities_organization_id = crypto
        .createHash("sha256")
        .update(req.body.admin_activity_id + "_" + req.organization_id)
        .digest("hex");

      // .upsert(

      db.activities_organization
        .upsert(
          {
            id: activities_organization_id,
            admin_activity_id: req.body.admin_activity_id,
            ...activities_organization_obj,
          }
          // { logging: console.log() }
        )
        .then(async (data) => {
          // console.log("Created entry");
          return auditCreate.create({
            table_name: "admin_activities",
            ...auditcreateObj,
          });
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
        });

      if (req.body.type == 1) {
        if (req.body.elementdelete) {
          await db.activity_elements.destroy({
            where: { id: { [Op.in]: req.body.elementdelete } },
          });
        }

        if (assign_element.length > 0) {
          for (let key = 0; key < assign_element.length; key++) {
            const value = assign_element[key];
            //if value have substandard_id then only the operation will perform
            if (value.substandard_id && value.substandard_id !== null) {
              var ele_id = crypto
                .createHash("sha256")
                .update(
                  req.body.id +
                    "_" +
                    value.element_name +
                    "_" +
                    req.organization_id
                )
                .digest("hex");

              if (value.id && value.id != "") {
                //update elemet
                /* await db.activity_elements
                  .update(
                    {
                      id: value.id,
                      admin_activity_id: req.body.admin_activity_id,
                      element_name: value.element_name,
                      element_response:
                        value.element_response == ""
                          ? null
                          : value.element_response,
                    },
                    {
                      where: {
                        id: value.id,
                      },
                    }
                  )
                  .then((datas) => {
                    auditCreate.create({
                      table_name: "activity_elements",
                      ...auditcreateObj,
                    });
                  }); */
              } else {
                console.log("element created");
                let countDetail = await db.activity_elements.count();

                let element_code = "E" + countDetail;
                if (value.substandard_id === undefined) {
                  value.substandard_id = null;
                }
                var activity_elements_check = await db.sequelize.query(
                  `select count(1) as count from activity_elements where (organization_id is null || organization_id = ${req.body.organization_id} ) and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name='${value.element_name}' and substandard_id='${value.substandard_id}' `,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (
                  activity_elements_check &&
                  activity_elements_check[0].count !== 0
                ) {
                } else {
                  await db.activity_elements
                    .upsert({
                      id: ele_id,
                      admin_activity_id: req.body.id,
                      element_code: element_code,
                      element_name: value.element_name,
                      element_response:
                        value.element_response == ""
                          ? null
                          : value.element_response,
                      status: master.status.active,
                      organization_id: req.organization_id,
                      substandard_id: value.substandard_id,
                    })
                    .then((datas) => {
                      auditCreate.create({
                        table_name: "activity_elements",
                        ...auditcreateObj,
                      });
                    });
                }
              }

              /* let elementcheck = await db.activity_elements.findAll({
                where: {
                  id: value.id,
                },
              }); */

              // console.log(elementcheck);
              /*  if (elementcheck && elementcheck.length > 0) {
                await db.activity_elements
                  .update(
                    {
                      id: ele_id,
                      admin_activity_id: req.body.admin_activity_id,
                      element_name: value.element_name,
                      element_response:
                        value.element_response == ""
                          ? null
                          : value.element_response,
                    },
                    {
                      where: {
                        id: ele_id,
                      },
                    }
                  )
                  .then((datas) => {
                    auditCreate.create({
                      table_name: "activity_elements",
                      ...auditcreateObj,
                    });
                  });
              } else {
                let countDetail = await db.activity_elements.count();

                var element_code = "E" + countDetail;
                if (value.substandard_id === undefined) {
                  value.substandard_id = null;
                }
                var activity_elements_check = await db.sequelize.query(
                  `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name='${value.element_name}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (
                  activity_elements_check &&
                  activity_elements_check[0].count !== 0
                ) {
                } else {
                  await db.activity_elements
                    .upsert({
                      id: ele_id,
                      admin_activity_id: req.body.id,
                      element_code: element_code,
                      element_name: value.element_name,
                      element_response:
                        value.element_response == ""
                          ? null
                          : value.element_response,
                      status: master.status.active,
                      organization_id: req.organization_id,
                      substandard_id: value.substandard_id,
                    })
                    .then((datas) => {
                      auditCreate.create({
                        table_name: "activity_elements",
                        ...auditcreateObj,
                      });
                    });
                }
              } */
            }
          }
        }

        if (create_element && create_element.length > 0) {
          for (let key = 0; key < create_element.length; key++) {
            const value = create_element[key];
            var ele_id = crypto
              .createHash("sha256")
              .update(
                req.body.id +
                  "_" +
                  value.element_name +
                  "_" +
                  req.organization_id
              )
              .digest("hex");
            let countDetail = await db.activity_elements.count();

            var element_code = "E" + countDetail;

            var activity_elements_check = await db.sequelize.query(
              `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name='${value.element_name}'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (
              activity_elements_check &&
              activity_elements_check[0].count !== 0
            ) {
              return true;
            } else {
              await db.activity_elements
                .upsert({
                  id: ele_id,
                  admin_activity_id: req.body.id,
                  element_code: element_code,
                  element_name: value.element_name,
                  element_response:
                    value.element_response == ""
                      ? null
                      : value.element_response,
                  status: master.status.active,
                  organization_id: req.organization_id,
                  //substandard_id: substandard_ids[0],
                })
                .then((datas) => {
                  auditCreate.create({
                    table_name: "activity_elements",
                    ...auditcreateObj,
                  });
                  // return datas;
                });
            }
          }
        }

        // ====substandard_idremove====
        if (
          req.body.remove_substandard_ids != null &&
          req.body.remove_substandard_ids.length > 0
        ) {
          await db.activity_mapping.destroy({
            where: {
              id: req.body.remove_substandard_ids,
              organization_id: req.organization_id,
            },
          });
        }
        // ===================
      } else if (req.body.type == 2) {
        console.log("Upsert Client data collections ::: ");

        const dataCollObj = {
          type_of_number: req.body.type_of_number,
          target: req.body.target,
          client_id: req.body.client_id,
          organization_id: req.body.organization_id,
          totarget: req.body.totarget,
          admin_activity_id: req.body.admin_activity_id,
          status: master.status.active,
          client_activity_id: req.body.client_activity_id,
        };

        const actOrgFind = await db.client_admin_datacollections.findAll({
          where: {
            admin_activity_id: req.body.admin_activity_id,
            organization_id: req.body.organization_id,
          },
        });

        if (actOrgFind.length == 0) {
          await db.client_admin_datacollections.create(dataCollObj);
        } else {
          await db.client_admin_datacollections.update(dataCollObj, {
            where: {
              admin_activity_id: req.body.admin_activity_id,
              organization_id: req.body.organization_id,
            },
          });
        }
      }

      if (
        req.body.remove_substandard_ids != null &&
        req.body.remove_substandard_ids.length > 0
      ) {
        await db.activity_mapping.destroy({
          where: {
            id: req.body.remove_substandard_ids,
            organization_id: req.organization_id,
          },
        });
      }
      await helper.activitySessionMappingInsert(
        req,
        req.body.admin_activity_id,
        1
      );
      await helper.addAssignPropertiesinClientAdmin(req);
      return res.send({ message: "Updated Successfully" });
    }
  } else {
    /******** Client activity  */
    if (req.body.type == 1) {
      //type 1 checklist
      // console.log("Assign element " + assign_element);
      // console.log(req.organization_id);

      db.client_admin_activities
        .update(
          {
            code: codeValue,
            description: req.body.description,
            type: req.body.type,
            name: req.body.name,
            response_frequency: req.body.response_frequency,
            submission_day: req.body.submission_day,
            element_dummy: null,
            assign_dummy: null,
            createdby: req.userId,
          },
          {
            where: { id: req.body.id },
          }
        )
        .then(async (data) => {
          await helper.activitySessionMappingInsert(req, req.body.id, 1);
          //  console.log(data);
          auditCreate.create({
            table_name: "client_admin_activities",
            ...auditcreateObj,
          });

          //  console.log(req.body.elementdelete);
          if (req.body.elementdelete) {
            await db.activity_elements.destroy({
              where: { id: { [Op.in]: req.body.elementdelete } },
            });
          }

          if (assign_element.length > 0) {
            for (let key = 0; key < assign_element.length; key++) {
              const value = assign_element[key];
              //console.log(value);
              if (value.substandard_id && value.substandard_id !== null) {
                var ele_id = crypto
                  .createHash("sha256")
                  .update(
                    req.body.id +
                      "_" +
                      value.element_name +
                      "_" +
                      req.organization_id
                  )
                  .digest("hex");
                let elsubstandard_id = null;
                if (!value.substandard_id) {
                  elsubstandard_id = value.substandard_id;
                } else {
                  elsubstandard_id = crypto
                    .createHash("sha256")
                    .update(value.element_name.trim())
                    .digest("hex");
                }

                let elementcheck = await db.activity_elements.findAll({
                  where: {
                    substandard_id: elsubstandard_id,
                    client_activity_id: req.body.id,
                    organization_id: req.organization_id,
                  },
                });
                if (elementcheck && elementcheck.length > 0) {
                  /* await db.activity_elements
                    .update(
                      {
                        id: ele_id,
                        client_activity_id: req.body.id,
                        element_name: value.element_name,
                        element_response:
                          value.element_response == ""
                            ? null
                            : value.element_response,
                      },
                      {
                        where: {
                          id: value.id,
                        },
                      }
                    )
                    .then((datas) => {
                      auditCreate.create({
                        table_name: "activity_elements",
                        ...auditcreateObj,
                      });
                    }); */
                } else {
                  let countDetail = await db.activity_elements.count();

                  var element_code = "E" + countDetail;
                  // value.substandard_id = null;   //client admin custom created activity will be null
                  console.log("check 1");
                  var activity_elements_check = await db.sequelize.query(
                    `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name='${value.element_name}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  );

                  if (
                    activity_elements_check &&
                    activity_elements_check[0].count !== 0
                  ) {
                  } else {
                    await db.activity_elements
                      .upsert({
                        id: ele_id,
                        client_activity_id: req.body.id,
                        element_code: element_code,
                        element_name: value.element_name,
                        element_response:
                          value.element_response == ""
                            ? null
                            : value.element_response,
                        status: master.status.active,
                        organization_id: req.organization_id,
                        substandard_id: elsubstandard_id,
                      })
                      .then((datas) => {
                        auditCreate.create({
                          table_name: "activity_elements",
                          ...auditcreateObj,
                        });
                      });
                  }
                }
              }
            }
          }

          if (create_element && create_element.length > 0) {
            // console.log(create_element);
            for (let key = 0; key < create_element.length; key++) {
              const value = create_element[key];
              let custom_element_name = helper.mysql_real_escape_string(
                value.element_name
              );
              var ele_id = crypto
                .createHash("sha256")
                .update(
                  req.body.id +
                    "_" +
                    custom_element_name +
                    "_" +
                    req.organization_id
                )
                .digest("hex");
              let countDetail = await db.activity_elements.count();

              var element_code = "E" + countDetail;
              var activity_elements_check = await db.sequelize.query(
                `select count(1) as count from activity_elements where organization_id = ${req.organization_id} and (admin_activity_id='${req.body.admin_activity_id}' OR client_activity_id = '${req.body.client_activity_id}') AND element_name=:element_name `,
                {
                  replacements: {
                    element_name: custom_element_name,
                  },
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (
                activity_elements_check &&
                activity_elements_check[0].count !== 0
              ) {
              } else {
                // console.log(custom_element_name);
                await db.activity_elements
                  .upsert({
                    id: ele_id,
                    client_activity_id: req.body.id,
                    element_code: element_code,
                    element_name: custom_element_name,
                    element_response:
                      value.element_response == ""
                        ? null
                        : value.element_response,
                    status: master.status.active,
                    organization_id: req.organization_id,
                    substandard_id: null,
                  })
                  .then((datas) => {
                    auditCreate.create({
                      table_name: "activity_elements",
                      ...auditcreateObj,
                    });
                    return datas;
                  });
              }
            }
          }

          // ====substandard_idremove====

          if (
            req.body.remove_substandard_ids !== undefined &&
            req.body.remove_substandard_ids !== null &&
            req.body.remove_substandard_ids.length > 0
          ) {
            await db.activity_mapping.destroy({
              where: {
                id: req.body.remove_substandard_ids,
                // organization_id: req.organization_id,
              },
              //  logging: console.log,
            });
          }
          // ===================

          await helper.addAssignPropertiesinClientAdmin(req);
          return res.send({ message: "Updated Successfully" });

          /*  if (substandard_ids !== undefined && substandard_ids.length > 0) {
            substandard_ids.forEach((sub_id, key) => {
              db.sequelize
                .query(
                  `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                )
                .then(async (finaldata) => {
                  //console.log(finaldata);
                  ///step4-activity_mapping create
                  /* var find = await db.activity_mapping.findAll({
                      where: {
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        client_activity_id: data.id,
                      },
                    }); 
                  var admin_activity_id_mapping = crypto
                    .createHash("sha256")
                    .update(
                      req.body.name +
                        "_" +
                        finaldata[0].id +
                        "_" +
                        finaldata[0].standard_id +
                        "_" +
                        finaldata[0].chapter_id +
                        "_" +
                        finaldata[0].library_id
                    )
                    .digest("hex");

                  db.activity_mapping
                    .upsert({
                      id: admin_activity_id_mapping,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      //client_activity_id: data.id,
                      client_activity_id: req.body.id,
                      status: master.status.active,
                      organization_id: req.body.organization_id,
                    })
                    .then((mappingdata) => {
                      auditCreate.create({
                        table_name: "admin_activities",
                        ...auditcreateObj,
                      });
                      auditCreate.create({
                        table_name: "activity_mapping",
                        ...auditcreateObj,
                      });
                      if (key + 1 == substandard_ids.length) {
                        return res.send({ message: "Updated Successfully" });
                      }
                    });
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send("error");
                });
            });
          } */
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
          res.send(error);
        });
    } else if (req.body.type == 2) {
      db.client_admin_activities
        .update(
          {
            code: codeValue,
            description: req.body.description,
            type: req.body.type,
            name: req.body.name,
            response_frequency: req.body.response_frequency,
            submission_day: req.body.submission_day,
            kpi: req.body.kpi,
            type_of_measure: req.body.type_of_measure,
            aggregation_type: req.body.aggregation_type,
            observation_type: req.body.observation_type,
            currency_type: req.body.currency_type,
            observation_name: req.body.observation_name,
            kpi_name: req.body.kpi_name,
            assign_dummy:
              req.body.assign_dummy == ""
                ? null
                : JSON.stringify(JSON.stringify(req.body.assign_dummy)),
            createdby: req.userId,
            // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
          },
          {
            where: { id: req.body.id },
          }
        )
        .then(async (data) => {
          if (
            req.body.remove_substandard_ids !== undefined &&
            req.body.remove_substandard_ids !== null &&
            req.body.remove_substandard_ids.length > 0
          ) {
            await db.activity_mapping.destroy({
              where: {
                id: req.body.remove_substandard_ids,
                // organization_id: req.organization_id,
              },
              //  logging: console.log,
            });
          }

          await helper.activitySessionMappingInsert(req, req.body.id, 1);
          db.client_admin_datacollections.upsert(
            {
              type_of_number: req.body.type_of_number,
              target: req.body.target,
              client_id: req.body.client_id,
              organization_id: req.body.organization_id,
              totarget: req.body.totarget,
              status: master.status.active,
              admin_activity_id: req.body.admin_activity_id,
              client_activity_id: req.body.client_activity_id,
            },
            { where: { client_activity_id: req.body.id } }
          );

          await helper.addAssignPropertiesinClientAdmin(req);
          return res.send({ message: "Updated Successfully" });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    } else {
      //var path = req.file.destination + "/" + req.file.filename;
      //console.log(path, 1)
      if (!req.body.code) {
        codeValue = "Doc." + codeCreate + "." + code;
      } else {
        codeValue = req.body.code;
      }

      let upload = multer({
        storage: storage,
        fileFilter: fileFilter,
      }).single("file");
      var element = req.body;

      db.client_admin_activities
        .update(
          {
            code: codeValue,
            description: element.description,
            type: element.type,
            name: element.name,
            response_frequency: element.response_frequency,
            submission_day: element.submission_day,
            document_name: element.document_name,
            // document_link: fileLink,
            expiry_days: element.expiry_days,
            assign_dummy:
              req.body.assign_dummy == ""
                ? null
                : JSON.stringify(JSON.stringify(req.body.assign_dummy)),
            createdby: req.userId,
            // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
          },
          {
            where: { id: req.body.id },
          }
        )
        .then(async (data) => {
          if (
            req.body.remove_substandard_ids !== undefined &&
            req.body.remove_substandard_ids !== null &&
            req.body.remove_substandard_ids.length > 0
          ) {
            await db.activity_mapping.destroy({
              where: {
                id: req.body.remove_substandard_ids,
                // organization_id: req.organization_id,
              },
              //  logging: console.log,
            });
          }

          await helper.activitySessionMappingInsert(req, req.body.id, 1);
          await helper.addAssignPropertiesinClientAdmin(req);
          return res.send({ message: "Updated Successfully" });
          /* if (substandard_ids !== undefined && substandard_ids.length > 0) {
            substandard_ids.forEach((sub_id, key) => {
              console.log(sub_id);
              db.sequelize
                .query(
                  `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                )
                .then(async (finaldata) => {
                  // console.log(finaldata);
                  ///step4-activity_mapping create

                  var admin_activity_id_mapping = await crypto
                    .createHash("sha256")
                    .update(
                      req.body.name +
                        "_" +
                        finaldata[0].id +
                        "_" +
                        finaldata[0].standard_id +
                        "_" +
                        finaldata[0].chapter_id +
                        "_" +
                        finaldata[0].library_id
                    )
                    .digest("hex");
                  db.activity_mapping
                    .upsert({
                      id: admin_activity_id_mapping,
                      library_id: finaldata[0].library_id,
                      chapter_id: finaldata[0].chapter_id,
                      standard_id: finaldata[0].standard_id,
                      substandard_id: finaldata[0].id,
                      client_activity_id: req.body.id,
                      organization_id: req.body.organization_id,
                      status: master.status.active,
                    })
                    .then((mappingdata) => {
                      auditCreate.create({
                        table_name: "admin_activities",
                        ...auditcreateObj,
                      });
                      auditCreate.create({
                        table_name: "activity_mapping",
                        ...auditcreateObj,
                      });
                      if (key + 1 == req.body.substandard_id.length) {
                        return res.send({ message: "Updated Successfully" });
                      }
                    });
                })
                .catch((error) => {
                  logger.info("/error", error);
                  res.send("error");
                });
            });
          } */
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    }
  }
};
exports.get = async (req, res) => {
  try {
    db.client_admin_activities
      .findAll({
        attributes: { exclude: ["createdAt"] },
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          organization_id: req.headers["organization"],
        },
        order: [["id", "DESC"]],
      })
      .then((clientdata) => {
        // db.admin_activities
        //   .findAll({
        //     where: {
        //       status: { [Op.notIn]: [master.status.delete] },
        //     },
        //     order: [["id", "DESC"]],
        //     attributes: { exclude: ["updatedAt"] },
        //   })
        //   .then((admindata) => {
        //     res.send(clientdata.concat(admindata));
        //   });

        res.send(clientdata);
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

exports.getByIdFilterDate = async (req, res) => {
  let where = "";
  try {
    if (req.params.type == "admin") {
      where = ` admin_activity_id='${req.params.id}' && response_date between date_format('${req.params.startdate}','%Y-%m-%d') and date_format('${req.params.enddate}','%Y-%m-%d') `;
    } else {
      where = ` client_activity_id=${req.params.id} && response_date between date_format('${req.params.startdate}','%Y-%m-%d') and date_format('${req.params.enddate}','%Y-%m-%d') `;
    }

    let chRes = await db.sequelize.query(
      `
select *,(select name from users where id=updator_id) as updator_name from storage_activity_checklist  where  ${where} 
&& organization_id=${req.headers["organization"]} `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).send(chRes);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

exports.getByIdFilter = async (req, res) => {
  try {
    if (req.params.type == "admin") {
      var activity = await db.admin_activities.findAll({
        where: { id: req.params.id },
        raw: true,
      });

      if (activity && activity.length > 0) {
        activity[0].admin_activity_id = req.params.id;
        activity[0].client_activity_id = null;
      }

      if (req.role_id !== 1) {
        var client_activity = await db.activities_organization.findAll({
          where: {
            admin_activity_id: req.params.id,
            organization_id: req.organization_id,
          },
        });

        if (client_activity && client_activity.length > 0) {
          activity[0].code = client_activity[0].dataValues.code;
          activity[0].response_frequency =
            client_activity[0].dataValues.response_frequency;
          activity[0].submission_day = client_activity[0].submission_day;
          activity[0].kpi = client_activity[0].dataValues.kpi;
          activity[0].kpi_name = client_activity[0].dataValues.kpi_name;
          activity[0].type_of_measure =
            client_activity[0].dataValues.type_of_measure;
          activity[0].aggregation_type =
            client_activity[0].dataValues.aggregation_type;
          activity[0].observation_name =
            client_activity[0].dataValues.observation_name;
          activity[0].observation_type =
            client_activity[0].dataValues.observation_type;
          activity[0].currency_type =
            client_activity[0].dataValues.currency_type;
          activity[0].document_name =
            client_activity[0].dataValues.document_name;
          activity[0].document_description =
            client_activity[0].dataValues.document_description;
          activity[0].document_link =
            client_activity[0].dataValues.document_link;
          activity[0].expiry_days = client_activity[0].dataValues.expiry_days;
        }
      }

      if (activity[0].type == 1) {
        let wherecondition = `admin_activity_id='${req.params.id}' and parent_id is null`;
        if (req.role_id != 1) {
          if (req.params.libid) {
            wherecondition =
              wherecondition +
              ` and substandard_id in (select substandard_id from activity_mapping 
              where library_id=${req.params.libid}) and (organization_id is null or organization_id=${req.organization_id})`;
          } else {
            wherecondition =
              wherecondition +
              ` and (organization_id is null or organization_id=${req.organization_id})`;
          }
        }
        //  console.log(wherecondition);

        if (req.role_id == 4) {
          wherecondition =
            wherecondition +
            ` and (substandard_id in (select substandard_id from property_mapping 
            where user_id=${req.userId} && role_id=${req.role_id}) || substandard_id is null)`;
        }

        if (req.role_id == 2 || req.role_id == 3) {
          wherecondition += ` and (substandard_id in (select A.id from sub_standards as A left join standards as B on A.standard_id = B.id
            left join chapters as C on C.id = B.chapter_id where library_id in 
            (select library_id from organization_libraries where organization_id=${req.organization_id}))|| substandard_id is null)`;
        }

        let element = await db.sequelize.query(
          `select *, (select code from sub_standards where id=activity_elements.substandard_id) as substandard_code,
          (select name from sub_standards where id=activity_elements.substandard_id) as substandard_name,
          (select description from sub_standards where id=activity_elements.substandard_id) as substandard_desc,   
          (select standard_id from sub_standards where id=activity_elements.substandard_id) as standard_id
          from activity_elements where ${wherecondition}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        element.forEach((chEl, chIdx) => {
          element[chIdx].substandard_desc =
            chEl.substandard_desc == null
              ? chEl.element_name
              : chEl.substandard_desc;
        });

        activity[0].elements = element;
        activity[0].assign_element = element;

        activity[0].file_details = [];
      } else if (activity[0].type == 2) {
        if (activity[0].kpi && activity[0].kpi === 1) {
          let wherecondition = ` kpi.admin_activity_id='${req.params.id}' and kpi.organization_id=${req.headers["organization"]}`;
          if (req.role_id === 4) {
            wherecondition =
              wherecondition + ` and kpi.updator_id=${req.userId}`;
          }

          if (req.query.fromDate && req.query.toDate) {
            let data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.organization_id,
                  admin_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              //  console.log("Data collection");
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
              //console.log("Data collection Value set");
              /* activity[0].elements = await addResponsesplit(
                response_elem,
                activity[0].response_frequency,
                data_collection[0].dataValues.target,
                data_collection[0].dataValues.totarget
              );*/
            } else {
              activity[0].target = "";
              activity[0].totarget = "";
              activity[0].type_of_number = "";
              /*activity[0].elements = await addResponsesplit(
                response_elem,
                activity[0].response_frequency,
                "",
                ""
              );*/
            }

            let responseHeadList = await helper.getResponseHead(
              req.query.fromDate,
              req.query.toDate,
              activity[0].response_frequency,
              activity[0].submission_day
            );

            console.log(responseHeadList);

            activity[0].elements = [];
            for (const elx of responseHeadList) {
              let firstDate = helper.dateFormatUSA(elx.responseDate);
              let secondDate = helper.dateFormatUSA(elx.responseEndDate);

              let kpiRes = await db.sequelize.query(
                `
            select A.*,(select name from users where id=B.updator_id) as updator_name from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where B.admin_activity_id='${activity[0].admin_activity_id}' && A.responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') && A.frequency='${elx.week}' && organization_id=${req.headers["organization"]} `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (kpiRes.length > 0) {
                activity[0].elements.push({
                  actual: "",
                  actual_value: kpiRes[0].actual_value,
                  frequency: elx.week,
                  id: kpiRes[0].id,
                  noneditable: false,
                  score: kpiRes[0].score,
                  storage_id: kpiRes[0].storage_id,
                  target: kpiRes[0].target,
                  totarget: kpiRes[0].totarget,
                  responseDate: kpiRes[0].responsedate,
                  responseEndDate: elx.responseEndDate,
                  updator_name: kpiRes[0].updator_name,
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              } else {
                activity[0].elements.push({
                  actual: "",
                  actual_value: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  score: "",
                  storage_id: 0,
                  target: activity[0].target,
                  totarget: activity[0].totarget,
                  responseDate: helper.dateFormatUSA(elx.responseDate),
                  responseEndDate: elx.responseEndDate,
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              }
            }

            activity[0].elements = activity[0].elements.map((el, idx) => ({
              ...el,
              isrequired: activity[0].elements.length == idx + 1 ? true : false,
            }));

            activity[0].assign_element = [...activity[0].elements];
            activity[0].element = [...activity[0].elements];
          } else {
            var response_elem = await db.sequelize.query(
              `SELECT kpi.id as kpiid, elem.* FROM storage_activity_kpi kpi left join storage_activity_kpi_elements elem on kpi.id = elem.storage_id and YEAR(elem.updatedAt) = YEAR(CURDATE()) where ${wherecondition}
              `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.organization_id,
                  admin_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              //  console.log("Data collection");
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
              //console.log("Data collection Value set");
              activity[0].elements = await addResponsesplit(
                response_elem,
                activity[0].response_frequency,
                data_collection[0].dataValues.target,
                data_collection[0].dataValues.totarget
              );
            } else {
              activity[0].target = "";
              activity[0].totarget = "";
              activity[0].type_of_number = "";
              activity[0].elements = await addResponsesplit(
                response_elem,
                activity[0].response_frequency,
                "",
                ""
              );
            }
          }
        } else {
 
          if (req.query.fromDate && req.query.toDate) {
            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.organization_id,
                  admin_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              // console.log("Data collection");
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
            }

            /**
             * 
             *    var response_elem = await db.sequelize.query(
                `SELECT * FROM storage_observation   where ${wherecondition} `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );
    
              activity[0].elements = await addObservationsplit(
                response_elem,
                activity[0].response_frequency
              );
             */
            let responseHeadList = await helper.getResponseHead(
              req.query.fromDate,
              req.query.toDate,
              activity[0].response_frequency,
              activity[0].submission_day
            );
 

            activity[0].elements = [];
            for (const elx of responseHeadList) {
              let firstDate = helper.dateFormatUSA(elx.responseDate);
              let secondDate = helper.dateFormatUSA(elx.responseEndDate);

           

              let kpiRes = await db.sequelize.query(
                `
            select *,(select name from users where id=updator_id) as updator_name from storage_observation  where 
            admin_activity_id='${activity[0].admin_activity_id}' && responsedate between date_format('${firstDate}','%Y-%m-%d') 
            and date_format('${secondDate}','%Y-%m-%d')  && organization_id=${req.headers["organization"]} `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (kpiRes.length > 0) {
                activity[0].elements.push({
                  actual: "",
                  currency_type: kpiRes[0].currency_type,
                  currency: kpiRes[0].currency,
                  comments: kpiRes[0].comments,
                  frequency: elx.week,
                  id: kpiRes[0].id,
                  noneditable: false,
                  observation_type: kpiRes[0].observation_type,
                  responseDate: kpiRes[0].responseDate,
                  score: 100,
                  updator_name: kpiRes[0].updator_name,
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              } else {
                activity[0].elements.push({
                  actual: "",
                  currency_type: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  observation_type: activity[0].observation_type,
                  responseDate: helper.dateFormatUSA(elx.responseDate),
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              }
            }

            activity[0].assign_element = [...activity[0].elements];
            activity[0].element = [...activity[0].elements];
          } else {
            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.organization_id,
                  admin_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              // console.log("Data collection");
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
            }

            let wherecondition = `YEAR(updatedAt) = YEAR(CURDATE()) and  admin_activity_id='${req.params.id}' and organization_id=${req.organization_id}`;
            if (req.role_id === 4) {
              wherecondition = wherecondition + ` and updator_id=${req.userId}`;
            }

            var response_elem = await db.sequelize.query(
              `SELECT * FROM storage_observation   where ${wherecondition} `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            activity[0].elements = await addObservationsplit(
              response_elem,
              activity[0].response_frequency
            );
          }
        }
      } else if (activity[0].type == 3) {
        /*
         responseDate = activity[0].submission_day;
          response_frequency = activity[0].response_frequency;
          
          let expiryDate = await helper.getDueDate(
            responseDate,
            response_frequency
          );
          activity[0].expiryDate = expiryDate;
          activity[0].expiry_date = expiryDate;
        
        */

        let responseHeadList = await helper.getResponseHead(
          req.query.fromDate,
          req.query.toDate,
          activity[0].response_frequency,
          activity[0].submission_day
        );

        responseDate = activity[0].submission_day;
        response_frequency = activity[0].response_frequency;
        let expiryDate = await helper.getDueDate(
          responseDate,
          response_frequency
        );
        activity[0].expiryDate = expiryDate;
        activity[0].expiry_date = expiryDate;

        activity[0].elements = [];
        for (const elx of responseHeadList) {
          let firstDate = helper.dateFormatUSA(elx.responseDate);
          let secondDate = helper.dateFormatUSA(elx.responseEndDate);
          //&& frequency='${elx.week}'
          let docRes = await db.sequelize.query(
            `
    select *,(select name from users where id=updator_id) as updator_name from storage_activity_document  where admin_activity_id='${activity[0].admin_activity_id}' && responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')  && organization_id=${req.headers["organization"]} `,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (docRes.length > 0) {
            activity[0].elements.push({
              actual: "",
              frequency: elx.week,
              id: docRes[0].id,
              noneditable: false,
              updator_name: docRes[0].updator_name,
              description: docRes[0].description,
              expiry_date: docRes[0].expiry_date,
              comment: docRes[0].comment,
              document_link: docRes[0].document_link,
              score: 100,
              responseDate: docRes[0].responsedate,
              responseEndDate: elx.responseEndDate,
              updatorElement: {
                attachment_link: docRes[0].document_link,
                comments: docRes[0].comment,
                response: "No",
              },
            });
          } else {
            activity[0].elements.push({
              actual: "",
              frequency: elx.week,
              id: 0,
              noneditable: false,
              description: "",
              expiry_date: helper.dateFormatUSA(elx.responseEndDate),
              comment: "",
              document_link: "",
              score: "",
              responseDate: helper.dateFormatUSA(elx.responseDate),
              responseEndDate: elx.responseEndDate,
              updatorElement: {
                attachment_link: "",
                comments: null,
                response: "No",
              },
            });
          }

          /* activity[0].elements.push({
            actual: "",
            actual_value: "",
            frequency: elx.week,
            id: 0,
            noneditable: false,
            score: "",
            storage_id: 0,
            target: activity[0].target,
            totarget: activity[0].totarget,
            responseDate: elx.responseDate,
            updatorElement: {
              attachment_link: "",
              comments: null,
              response: "No",
            },
          }); */
        }

        activity[0].assign_element = [...activity[0].elements];
        activity[0].element = [...activity[0].elements];
      }

      if (req.role_id === 4 || req.role_id === 5 || req.role_id === 6) {
        if (req.params.libid) {
          var assign = await db.sequelize.query(
            `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and library_id = ${req.params.libid} and property_mapping.substandard_id IS NOT null`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        } else {
          var assign = await db.sequelize.query(
            `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        }
        activity[0].assign = assign;
      } else if (req.role_id === 2 || req.role_id === 3) {
        if (req.params.libid) {
          var assign = await db.activity_mapping.findAll({
            where: {
              admin_activity_id: req.params.id,
              organization_id: { [Op.in]: [req.organization_id, 0] },
              library_id: req.params.libid,
              substandard_id: { [Op.not]: null },
            },
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
              },
              {
                model: db.standards,
                as: "standards_mapping",
              },
            ],
          });
          activity[0].assign = assign;
        } else {
          const organizationLibrary = await db.organization_libraries
            .findAll({
              where: {
                organization_id: req.organization_id,
                status: 1,
              },
            })
            .then((lib) => lib.map((el) => el.library_id));
          // console.log(organizationLibrary);

          var assign = await db.activity_mapping.findAll({
            where: {
              admin_activity_id: req.params.id,
              organization_id: { [Op.in]: [req.organization_id, 0] },
              substandard_id: { [Op.not]: null },
              library_id: { [Op.in]: organizationLibrary },
            },
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
              },
              {
                model: db.standards,
                as: "standards_mapping",
              },
            ],
            group: ["substandard_id"],
          });

          activity[0].assign = assign;
        }
      } else if (req.params.libid) {
        var assign = await db.activity_mapping.findAll({
          where: {
            admin_activity_id: req.params.id,
            organization_id: { [Op.in]: [req.organization_id, 0] },
            library_id: req.params.libid,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      } else {
        activity[0].assign = [];
      }

      if (activity[0].type == 1) {
        if (req.query.fromDate && req.query.toDate) {
          let responseHeadList = await helper.getResponseHead(
            req.query.fromDate,
            req.query.toDate,
            activity[0].response_frequency,
            activity[0].submission_day
          );

          for (const elx of responseHeadList) {
            let firstDate = helper.dateFormatUSA(elx.responseDate);
            let secondDate = helper.dateFormatUSA(elx.responseEndDate);
            console.log(`
            select *,(select name from users where id=updator_id) as updator_name from storage_activity_checklist  where admin_activity_id='${activity[0].admin_activity_id}' && response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')   && organization_id=${req.headers["organization"]} `);

            let chRes = await db.sequelize.query(
              `
        select *,(select name from users where id=updator_id) as updator_name from storage_activity_checklist  where admin_activity_id='${activity[0].admin_activity_id}' && response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')   && organization_id=${req.headers["organization"]} `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (chRes.length > 0) {
              activity.push({
                ...activity[0],
                frequency: elx.week,
                responseDate: helper.dateFormatUSA(elx.responseDate),
                id: chRes[0].id,
                file_no: chRes[0].file_no,
                file_status: chRes[0].file_status,
                response_date: chRes[0].response_date,
                responseEndDate: helper.dateFormatUSA(elx.responseEndDate),
                updator_name: chRes[0].updator_name,
                score: chRes[0].score,
              });
            } else {
              activity.push({
                ...activity[0],
                id: null,
                frequency: elx.week,
                responseDate: helper.dateFormatUSA(elx.responseDate),
              });
            }
          }

          if (activity.length > 1) {
            activity.shift();
          }
        }
      }

      res.send(activity);
    } else {
      const activity = await db.client_admin_activities.findAll({
        where: { id: req.params.id },
        attributes: [
          "client_admin_activities.*",
          "clientAdminDatacollections.*",
          "storjoinchecklist.file_no",
        ],
        include: [
          {
            model: db.client_admin_datacollections,
            as: "clientAdminDatacollections",
            attributes: [],
            nested: false,
          },
          {
            model: db.storage_activity_checklist,
            as: "storjoinchecklist",
            attributes: [],
          },
        ],
        raw: true,
        group: ["client_admin_activities.id"],
      });

      if (activity && activity.length > 0) {
        activity[0].client_activity_id = req.params.id;
        activity[0].admin_activity_id = null;
      }

      updatorWhere = {};
      if (activity[0].type == 1) {
        let wherecondition = `client_activity_id='${req.params.id}' and parent_id is null`;
        if (req.role_id !== 1) {
          if (req.params.libid) {
            wherecondition =
              wherecondition +
              ` and substandard_id in (select substandard_id from activity_mapping 
              where library_id=${req.params.libid}) and (organization_id is null or organization_id=${req.organization_id})`;
          } else {
            wherecondition =
              wherecondition +
              ` and (organization_id is null or organization_id=${req.organization_id})`;
          }
        }

        var element = await db.sequelize.query(
          `select *, (select code from sub_standards where id=activity_elements.substandard_id) as substandard_code,
          (select name from sub_standards where id=activity_elements.substandard_id) as substandard_name ,
          (select description from sub_standards where id=activity_elements.substandard_id) as substandard_desc,
          (select standard_id from sub_standards where id=activity_elements.substandard_id) as standard_id 
          from activity_elements where ${wherecondition}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        element.forEach((chEl, chIdx) => {
          element[chIdx].substandard_desc =
            chEl.substandard_desc == null
              ? chEl.element_name
              : chEl.substandard_desc;
          element[chIdx].substandard_code =
            chEl.substandard_code == null
              ? chEl.element_code
              : chEl.substandard_code;
        });

        activity[0].elements = element;
        activity[0].assign_element = element;
      } else if (activity[0].type == 2) {
        if (activity[0].kpi && activity[0].kpi === 1) {
          let wherecondition = ` kpi.client_activity_id='${req.params.id}' and kpi.organization_id=${req.headers["organization"]}`;
          if (req.role_id === 4) {
            wherecondition =
              wherecondition + ` and kpi.updator_id=${req.userId}`;
          }
          //   console.log("req query", req.query);
          if (req.query.fromDate && req.query.toDate) {
            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.headers["organization"],
                  client_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
            }

            let responseHeadList = await helper.getResponseHead(
              req.query.fromDate,
              req.query.toDate,
              activity[0].response_frequency,
              activity[0].submission_day
            );

             console.log(responseHeadList);

            activity[0].elements = [];
            for (const elx of responseHeadList) {
              let firstDate = helper.dateFormatUSA(elx.responseDate);
              let secondDate = helper.dateFormatUSA(elx.responseEndDate);

              let kpiRes = await db.sequelize.query(
                `
            select A.*,(select name from users where id=B.updator_id) as updator_name from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where B.client_activity_id=${activity[0].client_activity_id} && A.responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') && A.frequency='${elx.week}' && organization_id=${req.headers["organization"]} `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (kpiRes.length > 0) {
                activity[0].elements.push({
                  actual: "",
                  actual_value: kpiRes[0].actual_value,
                  frequency: elx.week,
                  id: kpiRes[0].id,
                  noneditable: false,
                  score: kpiRes[0].score,
                  storage_id: kpiRes[0].storage_id,
                  target: kpiRes[0].target,
                  totarget: kpiRes[0].totarget,
                  responseDate: kpiRes[0].responsedate,
                  updator_name: kpiRes[0].updator_name,
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              } else {
                activity[0].elements.push({
                  actual: "",
                  actual_value: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  score: "",
                  storage_id: 0,
                  target: activity[0].target,
                  totarget: activity[0].totarget,
                  responseDate: helper.dateFormatUSA(elx.responseDate),
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              }
            }

            activity[0].elements = activity[0].elements.map((el, idx) => ({
              ...el,
              isrequired: activity[0].elements.length == idx + 1 ? true : false,
            }));

            activity[0].assign_element = [...activity[0].elements];
            activity[0].element = [...activity[0].elements];
          } else {
            var response_elem = await db.sequelize.query(
              `SELECT kpi.id as kpiid, elem.* FROM storage_activity_kpi kpi left join storage_activity_kpi_elements elem on kpi.id = elem.storage_id and YEAR(elem.updatedAt) = YEAR(CURDATE()) where ${wherecondition}
            `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.headers["organization"],
                  client_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              //  console.log("Data collection");
              //console.log(activity);
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
              //console.log("Data collection Value set");
            }
            activity[0].elements = await addResponsesplit(
              response_elem,
              activity[0].response_frequency,
              data_collection[0].dataValues.target,
              data_collection[0].dataValues.totarget
            );

            activity[0].elements = activity[0].elements.map((el, idx) => ({
              ...el,
              isrequired: activity[0].elements.length == idx + 1 ? true : false,
            }));

            activity[0].assign_element = activity[0].elements;
          }
        } else {
          if (req.query.fromDate && req.query.toDate) {
            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.headers["organization"],
                  client_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
            }

            let responseHeadList = await helper.getResponseHead(
              req.query.fromDate,
              req.query.toDate,
              activity[0].response_frequency,
              activity[0].submission_day
            );

            console.log(responseHeadList);

            activity[0].elements = [];
            for (const elx of responseHeadList) {
              let firstDate = helper.dateFormatUSA(elx.responseDate);
              let secondDate = helper.dateFormatUSA(elx.responseEndDate);

              //console.log(` select *,(select name from users where id=updator_id) as updator_name from storage_observation  where client_activity_id=${activity[0].client_activity_id} && responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d') && frequency='${elx.week}' && organization_id=${req.headers["organization"]} `);
              //&& frequency='${elx.week}'
              let kpiRes = await db.sequelize.query(
                `
            select *,(select name from users where id=updator_id) as updator_name from storage_observation  where client_activity_id=${activity[0].client_activity_id} && responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')  && organization_id=${req.headers["organization"]} `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (kpiRes.length > 0) {
                activity[0].elements.push({
                  actual: "",
                  currency_type: kpiRes[0].currency_type,
                  currency: kpiRes[0].currency,
                  comments: kpiRes[0].comments,
                  frequency: elx.week,
                  id: kpiRes[0].id,
                  noneditable: false,
                  observation_type: kpiRes[0].observation_type,
                  responseDate: kpiRes[0].responseDate,
                  score: 100,
                  updator_name: kpiRes[0].updator_name,
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              } else {
                activity[0].elements.push({
                  actual: "",
                  currency_type: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  observation_type: activity[0].observation_type,
                  responseDate: helper.dateFormatUSA(elx.responseDate),
                  updatorElement: {
                    attachment_link: "",
                    comments: null,
                    response: "No",
                  },
                });
              }
            }

            activity[0].assign_element = [...activity[0].elements];
            activity[0].element = [...activity[0].elements];
          } else {
            var data_collection = await db.client_admin_datacollections.findAll(
              {
                where: {
                  status: { [Op.notIn]: [master.status.delete] },
                  organization_id: req.headers["organization"],
                  client_activity_id: req.params.id,
                },
              }
            );

            if (data_collection && data_collection.length > 0) {
              // console.log("Data collection");

              activity[0].target = data_collection[0].dataValues.target;
              activity[0].totarget = data_collection[0].dataValues.totarget;
              activity[0].type_of_number =
                data_collection[0].dataValues.type_of_number;
            }

            let wherecondition = `YEAR(updatedAt) = YEAR(CURDATE()) and  admin_activity_id='${req.params.id}' and organization_id=${req.headers["organization"]}`;
            if (req.role_id === 4) {
              wherecondition = wherecondition + ` and updator_id=${req.userId}`;
            }

            var response_elem = await db.sequelize.query(
              `SELECT * FROM storage_observation   where ${wherecondition} `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            activity[0].elements = await addObservationsplit(
              response_elem,
              activity[0].response_frequency
            );
          }
        }
      } else if (activity[0].type == 3) {
        let responseHeadList = await helper.getResponseHead(
          req.query.fromDate,
          req.query.toDate,
          activity[0].response_frequency,
          activity[0].submission_day
        );

        console.log(responseHeadList);

        responseDate = activity[0].submission_day;
        response_frequency = activity[0].response_frequency;
        let expiryDate = await helper.getDueDate(
          responseDate,
          response_frequency
        );
        activity[0].expiryDate = expiryDate;
        activity[0].expiry_date = expiryDate;

        activity[0].elements = [];
        for (const elx of responseHeadList) {
          let firstDate = helper.dateFormatUSA(elx.responseDate);
          let secondDate = helper.dateFormatUSA(elx.responseEndDate);
          //&& frequency='${elx.week}'
          // console.log(
          //   ` select *,(select name from users where id=updator_id) as updator_name from storage_activity_document  where client_activity_id=${activity[0].client_activity_id} && responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')  && organization_id=${req.headers["organization"]} `
          // );
          let docRes = await db.sequelize.query(
            `
    select *,(select name from users where id=updator_id) as updator_name from storage_activity_document  where client_activity_id=${activity[0].client_activity_id} && responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')  && organization_id=${req.headers["organization"]} `,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (docRes.length > 0) {
            activity[0].elements.push({
              actual: "",
              frequency: elx.week,
              id: docRes[0].id,
              noneditable: false,
              updator_name: docRes[0].updator_name,
              description: docRes[0].description,
              expiry_date: docRes[0].expiry_date,
              comment: docRes[0].comment,
              document_link: docRes[0].document_link,
              score: 100,
              responseDate: docRes[0].responsedate,
              responseEndDate: elx.responseEndDate,
              updatorElement: {
                attachment_link: docRes[0].document_link,
                comments: docRes[0].comment,
                response: "No",
              },
            });
          } else {
            activity[0].elements.push({
              actual: "",
              frequency: elx.week,
              id: 0,
              noneditable: false,
              description: "",
              expiry_date: helper.dateFormatUSA(elx.responseEndDate),
              comment: "",
              document_link: "",
              score: "",
              responseDate: helper.dateFormatUSA(elx.responseDate),
              responseEndDate: elx.responseEndDate,
              updatorElement: {
                attachment_link: "",
                comments: null,
                response: "No",
              },
            });
          }
        }

        activity[0].assign_element = [...activity[0].elements];
        activity[0].element = [...activity[0].elements];
      }

      if (req.params.libid) {
        var assign = await db.activity_mapping.findAll({
          where: {
            client_activity_id: req.params.id,
            library_id: req.params.libid,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      } else {
        var assign = await db.activity_mapping.findAll({
          where: {
            client_activity_id: req.params.id,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      }

      if (activity[0].elements) {
        activity[0].elements.forEach(async (el, idx) => {
          var updatorElement =
            await db.storage_activity_checklist_elements.findOne({
              where: {
                element_id: el.id,
              },
              attributes: ["attachment_link", "comments", "response"],
            });
          if (updatorElement == null) {
            updatorElement = { attachment_link: null, comments: null };
          }

          // console.log(activity[0].elements[idx]);
          // return;
          activity[0].elements[idx].updatorElement = updatorElement;
          if (activity[0].assign_element) {
            activity[0].assign_element[idx].updatorElement = updatorElement;
          }

          if (activity[0].elements.length == idx + 1) {
            //activity.elements[idx] = updatorElement;

            if (activity[0].type == 1) {
              if (req.query.fromDate && req.query.toDate) {
                let responseHeadList = await helper.getResponseHead(
                  req.query.fromDate,
                  req.query.toDate,
                  activity[0].response_frequency,
                  activity[0].submission_day
                );

                console.log(responseHeadList);

                for (const elx of responseHeadList) {
                  let firstDate = helper.dateFormatUSA(elx.responseDate);
                  let secondDate = helper.dateFormatUSA(elx.responseEndDate);

                  // console.log(`    select *,(select name from users where id=updator_id) as updator_name from storage_activity_checklist  where client_activity_id=${activity[0].client_activity_id} && response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')   && organization_id=${req.headers["organization"]}`);

                  let chRes = await db.sequelize.query(
                    `
    select *,(select name from users where id=updator_id) as updator_name from storage_activity_checklist  where client_activity_id=${activity[0].client_activity_id} && response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')   && organization_id=${req.headers["organization"]} `,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  );

                  if (chRes.length > 0) {
                    activity.push({
                      ...activity[0],
                      frequency: elx.week,
                      responseDate: helper.dateFormatUSA(elx.responseDate),
                      responseEndDate: helper.dateFormatUSA(
                        elx.responseEndDate
                      ),
                      id: chRes[0].id,
                      file_no: chRes[0].file_no,
                      file_status: chRes[0].file_status,
                      response_date: chRes[0].response_date,
                      updator_name: chRes[0].updator_name,
                      score: chRes[0].score,
                    });
                  } else {
                    activity.push({
                      ...activity[0],
                      id: null,
                      frequency: elx.week,
                      responseDate: helper.dateFormatUSA(elx.responseDate),
                      responseEndDate: elx.responseEndDate,
                    });
                  }
                }

                if (activity.length > 1) {
                  activity.shift();
                }
              }
            }

            res.send(activity);
          }
        });
      } else {
        res.send(activity);
      }
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

exports.getById = async (req, res) => {
  try {
 
    if (req.params.type == "admin") {
      let activity = await db.admin_activities.findAll({
        where: { id: req.params.id },
        raw: true,
      });

      if (activity && activity.length > 0) {
        activity[0].admin_activity_id = req.params.id;
        activity[0].client_activity_id = null;
      }

      if (req.role_id !== 1) {
        let client_activity = await db.activities_organization.findAll({
          where: {
            admin_activity_id: req.params.id,
            organization_id: req.organization_id,
          },
        });

        if (client_activity && client_activity.length > 0) {
          activity[0].code = client_activity[0].dataValues.code;
          activity[0].response_frequency =
            client_activity[0].dataValues.response_frequency;
          activity[0].submission_day = client_activity[0].submission_day;
          activity[0].kpi = client_activity[0].dataValues.kpi;
          activity[0].kpi_name = client_activity[0].dataValues.kpi_name;
          activity[0].type_of_measure =
            client_activity[0].dataValues.type_of_measure;
          activity[0].aggregation_type =
            client_activity[0].dataValues.aggregation_type;
          activity[0].observation_name =
            client_activity[0].dataValues.observation_name;
          activity[0].observation_type =
            client_activity[0].dataValues.observation_type;
          activity[0].currency_type =
            client_activity[0].dataValues.currency_type;
          activity[0].document_name =
            client_activity[0].dataValues.document_name;
          activity[0].document_description =
            client_activity[0].dataValues.document_description;
          activity[0].document_link =
            client_activity[0].dataValues.document_link;
          activity[0].expiry_days = client_activity[0].dataValues.expiry_days;
        }
      }
 

      if (activity[0].type == 1) {
        let wherecondition = `admin_activity_id='${req.params.id}' and parent_id is null`;
        if (req.role_id != 1) {
          if (req.params.libid) {
            wherecondition =
              wherecondition +
              ` and substandard_id in (select substandard_id from activity_mapping 
              where library_id=${req.params.libid}) and (organization_id is null or organization_id=${req.organization_id})`;
          } else {
            wherecondition =
              wherecondition +
              ` and (organization_id is null or organization_id=${req.organization_id})`;
          }
        }
        
        console.log('activity loading');

        let element = [];
        if (req.role_id == 4) {

          let substandardCondTemp_updator = await db.sequelize.query(`select B.substandard_uid from property_mapping as A left join sub_standards as B on A.substandard_id = B.id && organization_id=${req.organization_id}
          inner join (select * from activity_mapping where admin_activity_id='${req.params.id}' && organization_id in (0,${req.organization_id}) && library_id in (
            SELECT library_id FROM organization_libraries where organization_id=${req.organization_id} 
             )) as am on A.substandard_id = am.substandard_id 
          where (user_id=${req.userId} or (assignto=${req.userId} && expirydate >= CURDATE() ) ) && role_id=${req.role_id} group by B.substandard_uid`, {
            type : db.sequelize.QueryTypes.SELECT
           }).then(substandards => substandards.map(el=>el.substandard_uid))
         
           let substandardCondUpdator =  "'" + substandardCondTemp_updator.join("','") + "'"; 
          // wherecondition =
          //   wherecondition +
          //   ` and (substandard_id in (select B.substandard_uid from property_mapping as A left join sub_standards as B on A.substandard_id = B.id && organization_id=${req.organization_id}
          //   where (user_id=${req.userId} or (assignto=${req.userId} && expirydate >= CURDATE() ) ) && role_id=${req.role_id}) || substandard_id is null)`;
          console.log("substandardCondUpdator");
          wherecondition =
          wherecondition +
          ` and (substandard_id in (${substandardCondUpdator}) || substandard_id is null)`;             
         
          let substandardCond = `select B.substandard_uid from activity_mapping as A inner join sub_standards as B on A.substandard_id=B.id  && A.organization_id in (0,${req.organization_id} ) and A.library_id in  (select library_id from organization_libraries where organization_id=${req.organization_id}) and A.status !=2 and A.admin_activity_id='${req.params.id}'
          group by substandard_id`;         
          
          let forUpdatorSubstandard = await db.sequelize.query(`${substandardCond}`, {
            type : db.sequelize.QueryTypes.SELECT
          }).then(substds => substds.map(el=>el.substandard_uid))  
          forUpdatorSubstandard = "'" + forUpdatorSubstandard.join("','") + "'"; 
          console.log("forUpdatorSubstandard");
          
          // console.log( `select A.* ,B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id             
          // from activity_elements  as A inner join   (select * from sub_standards where id in (select substandard_id from property_mapping where user_id=${req.userId} && role_id=4)) as B on A.substandard_id=B.substandard_uid 
          // && B.substandard_uid in (${forUpdatorSubstandard})
          //    where ${wherecondition}  group by A.substandard_id,A.element_name order by substandard_name`); return;
                     
          element = await db.sequelize.query(
            `select A.* ,B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id             
              from activity_elements  as A inner join   (select * from sub_standards where id in (select substandard_id from property_mapping where user_id=${req.userId} && role_id=4)) as B on A.substandard_id=B.substandard_uid 
              && B.substandard_uid in (${forUpdatorSubstandard})
                 where ${wherecondition}  group by A.substandard_id,A.element_name order by substandard_name`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          ); 

          console.log("element");

     
        } else if (req.role_id == 2 || req.role_id == 3) {
          let substandardCond = `select A.substandard_uid from sub_standards as A left join standards as B on A.standard_id = B.id
          left join chapters as C on C.id = B.chapter_id where library_id in 
          (select library_id from organization_libraries where organization_id=${req.organization_id})`;

         substandardCondTemp = await db.sequelize.query(substandardCond, {
          type : db.sequelize.QueryTypes.SELECT
         }).then(substandards => substandards.map(el=>el.substandard_uid))
         substandardCond =  "'" + substandardCondTemp.join("','") + "'";
      

          wherecondition += ` and (substandard_id in (${substandardCond})|| substandard_id is null)`;

          element = await db.sequelize.query(
            `select A.*, B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id 
              from activity_elements as A inner join  (select * from sub_standards where id in (select substandard_id from activity_mapping where library_id in (select library_id from organization_libraries where organization_id=${req.organization_id}))) as B on A.substandard_id=B.substandard_uid 
              && B.substandard_uid in (${substandardCond}) where ${wherecondition}    group by A.substandard_id,A.element_name  order by substandard_name`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          ); 
        } else {
          element = await db.sequelize.query(
            `select *, (select code from sub_standards where id=activity_elements.substandard_id) as substandard_code,
              (select name from sub_standards where id=activity_elements.substandard_id) as substandard_name,
              (select description from sub_standards where id=activity_elements.substandard_id) as substandard_desc,   
              (select standard_id from sub_standards where id=activity_elements.substandard_id) as standard_id
              from activity_elements where ${wherecondition}   group by substandard_id,element_name  order by substandard_name`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        }

       

        element.forEach((chEl, chIdx) => {
          element[chIdx].substandard_desc =
            chEl.substandard_desc == null
              ? chEl.element_name
              : chEl.substandard_desc;
        });

        element = element.map((el) => ({
          ...el,
          sortItem: el.substandard_name,
        }));
        element.sort(helper.compare);
        element = helper.sortAlphanumeric(element);

        activity[0].elements = element;
        activity[0].assign_element = element;
        console.log("sorting El");
        activity[0].file_details = [];
      } else if (activity[0].type == 2) {
        if (activity[0].kpi && activity[0].kpi === 1) {
          let wherecondition = ` kpi.admin_activity_id='${req.params.id}' and kpi.organization_id=${req.organization_id}`;
          // if (req.role_id === 4) {
          //   wherecondition =
          //     wherecondition + ` and kpi.updator_id=${req.userId}`;
          // }

          var data_collection = await db.client_admin_datacollections.findAll({
            where: {
              status: { [Op.notIn]: [master.status.delete] },
              organization_id: req.organization_id,
              admin_activity_id: req.params.id,
            },
          });

          let currentDate = new Date();
          let filterfromDate =
            currentDate.getFullYear() +
            "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") +
            "-01";
          let filtertoDate =
            currentDate.getFullYear() +
            "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(currentDate.getDate()).padStart(2, "0");

          filterfromDate = helper.dateFormatUSA(filterfromDate);
          filtertoDate = helper.dateFormatUSA(filtertoDate);

          // let responseHeadList = await helper.getResponseHeadKPI(
          //   filterfromDate,
          //   filtertoDate,
          //   activity[0].response_frequency,
          //   activity[0].submission_day
          // );


          let responseHeadList = await helper.getResponseHead(
            filterfromDate,
            filtertoDate,
            activity[0].response_frequency,
            activity[0].submission_day
          );

           console.log(responseHeadList); 
          // return;

          let response_elem = [];

          for (const elx of responseHeadList) {
            let firstDate = helper.dateFormatUSA(elx.responseDate);
            let secondDate = helper.dateFormatUSA(elx.responseEndDate);

            let responseElStorage = await db.sequelize.query(
              `SELECT kpi.id as kpiid,kpi.updator_id as updator_id, elem.* FROM storage_activity_kpi kpi left join storage_activity_kpi_elements elem on kpi.id = elem.storage_id and responsedate between '${firstDate}' and '${secondDate}' where ${wherecondition}
                `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (responseElStorage.length > 0) {
              if (responseElStorage[0].frequency) {
                response_elem.push({
                  ...responseElStorage[0],
                  responsedate: firstDate,
                  frequency: elx.week,
                });
              } else {
                response_elem.push({
                  actual: "",
                  actual_value: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  score: "",
                  responsedate: firstDate,
                  storage_id: 0,
                  target: data_collection[0].dataValues.target,
                  totarget: data_collection[0].dataValues.totarget,
                });
              }
            } else {
              response_elem.push({
                actual: "",
                actual_value: "",
                frequency: elx.week,
                id: 0,
                noneditable: false,
                score: "",
                responsedate: firstDate,
                storage_id: 0,
                target: data_collection[0].dataValues.target,
                totarget: data_collection[0].dataValues.totarget,
              });
            }
          }

          // console.log(response_elem); return;
          // var response_elem = await db.sequelize.query(
          //   `SELECT kpi.id as kpiid, elem.* FROM storage_activity_kpi kpi left join storage_activity_kpi_elements elem on kpi.id = elem.storage_id and YEAR(elem.updatedAt) = YEAR(CURDATE()) where ${wherecondition}
          //   `,
          //   {
          //     type: db.sequelize.QueryTypes.SELECT,
          //   }
          // );

          if (data_collection && data_collection.length > 0) {
            //  console.log("Data collection");
            activity[0].target = data_collection[0].dataValues.target;
            activity[0].totarget = data_collection[0].dataValues.totarget;
            activity[0].type_of_number =
              data_collection[0].dataValues.type_of_number;
            //console.log("Data collection Value set");
            // activity[0].elements = await addResponsesplit(
            //   response_elem,
            //   activity[0].response_frequency,
            //   data_collection[0].dataValues.target,
            //   data_collection[0].dataValues.totarget
            // );

            response_elem = response_elem.map((el, idx) => ({
              ...el,
              isrequired: response_elem.length == idx + 1 ? true : false,
            }));

            activity[0].elements = response_elem;
          } else {
            activity[0].target = "";
            activity[0].totarget = "";
            activity[0].type_of_number = "";
            activity[0].elements = await addResponsesplit(
              response_elem,
              activity[0].response_frequency,
              "",
              ""
            );
          }
        } else {
          var data_collection = await db.client_admin_datacollections.findAll({
            where: {
              status: { [Op.notIn]: [master.status.delete] },
              organization_id: req.organization_id,
              admin_activity_id: req.params.id,
            },
          });

       

          if (data_collection && data_collection.length > 0) {
            // console.log("Data collection");
            activity[0].target = data_collection[0].dataValues.target;
            activity[0].totarget = data_collection[0].dataValues.totarget;
            activity[0].type_of_number =
              data_collection[0].dataValues.type_of_number;
          }

          let wherecondition = `YEAR(updatedAt) = YEAR(CURDATE()) and  admin_activity_id='${req.params.id}' and organization_id=${req.organization_id}`;
          if (req.role_id === 4) {
            wherecondition = wherecondition + ` and updator_id=${req.userId}`;
          }

          var response_elem = await db.sequelize.query(
            `SELECT * FROM storage_observation   where ${wherecondition} `,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          activity[0].elements = await addObservationsplit(
            response_elem,
            activity[0].response_frequency
          );
        }
      } else if (activity[0].type == 3) {
        responseDate = activity[0].submission_day;
        response_frequency = activity[0].response_frequency;
        // let expiryDate = await getExpiryDate(responseDate, response_frequency);
        // console.log(responseDate, response_frequency);
        let expiryDate = await helper.getDueDate(
          responseDate,
          response_frequency
        );
 
        activity[0].expiryDate = expiryDate;
        activity[0].expiry_date = expiryDate;
      }

      if (req.role_id === 4 || req.role_id === 5 || req.role_id === 6) {
        if (req.params.libid) {
          var assign = await db.sequelize.query(
            `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and library_id = ${req.params.libid} and property_mapping.substandard_id IS NOT null`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          activity[0].assign = assign;
        } else {
          // console.log( `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`);
          // let assign = await db.sequelize.query(
          //   `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`,
          //   {
          //     type: db.sequelize.QueryTypes.SELECT,
          //   }
          // );

        
          console.log("assign start");
          // let assign = await db.sequelize.query(
          //   `select 
          //   activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc 
          //   from (select * from activity_mapping where admin_activity_id='${req.params.id}'  and organization_id in (0,${req.organization_id}) ) as activity_mapping
          //    INNER JOIN standards on standards.id=activity_mapping.standard_id 
          //    INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id 
          //    INNER JOIN  (select * from property_mapping where organization_id =${req.organization_id} && user_id=${req.userId}) as property_mapping  on activity_mapping.substandard_id = property_mapping.substandard_id where  property_mapping.substandard_id IS NOT null`,
          //   {
          //     type: db.sequelize.QueryTypes.SELECT,
          //   }
          // );

          let assign = await db.sequelize.query(
            `select  property_mapping.*,  null as client_activity_id, '${req.params.id}' as admin_activity_id, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc 	  
                      from   (select * from property_mapping where organization_id =${req.organization_id} && user_id=${req.userId} && 
                      substandard_id in (select substandard_id from activity_mapping where organization_id in (0,${req.organization_id}) and admin_activity_id='${req.params.id}')
                      ) as property_mapping  INNER JOIN standards on standards.id=property_mapping.standard_id
                      INNER JOIN sub_standards on sub_standards.id=property_mapping.substandard_id where  property_mapping.substandard_id IS NOT null`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          ); 
          console.log("assign finish");
          activity[0].assign = assign;
        }
       
        console.log("assign El");
      } else if (req.role_id === 2 || req.role_id === 3) {
        if (req.params.libid) {
          var assign = await db.activity_mapping.findAll({
            where: {
              admin_activity_id: req.params.id,
              organization_id: { [Op.in]: [req.organization_id, 0] },
              library_id: req.params.libid,
              substandard_id: { [Op.not]: null },
            },
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
              },
              {
                model: db.standards,
                as: "standards_mapping",
              },
            ],
          });
          activity[0].assign = assign;
        } else {
          const organizationLibrary = await db.organization_libraries
            .findAll({
              where: {
                organization_id: req.organization_id,
                status: 1,
              },
            })
            .then((lib) => lib.map((el) => el.library_id));
          // console.log(organizationLibrary);

          var assign = await db.activity_mapping.findAll({
            where: {
              admin_activity_id: req.params.id,
              organization_id: { [Op.in]: [req.organization_id, 0] },
              substandard_id: { [Op.not]: null },
              library_id: { [Op.in]: organizationLibrary },
            },
            include: [
              {
                model: db.sub_standards,
                as: "sub_standards_mapping",
              },
              {
                model: db.standards,
                as: "standards_mapping",
              },
            ],
            group: ["substandard_id"],
          });

          activity[0].assign = assign;
        }
      } else if (req.params.libid) {
        var assign = await db.activity_mapping.findAll({
          where: {
            admin_activity_id: req.params.id,
            organization_id: { [Op.in]: [req.organization_id, 0] },
            library_id: req.params.libid,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      } else {
        activity[0].assign = [];
      }

      console.log("done");

      res.send(activity);

      //  res.send(activity);
    } else if (req.params.type == "client") {
      console.log("client");
      var activity = await db.client_admin_activities.findAll({
        where: { id: req.params.id },
        attributes: [
          "client_admin_activities.*",
          "clientAdminDatacollections.*",
          "storjoinchecklist.file_no",
        ],
        include: [
          {
            model: db.client_admin_datacollections,
            as: "clientAdminDatacollections",
            attributes: [],
            nested: false,
          },
          {
            model: db.storage_activity_checklist,
            as: "storjoinchecklist",
            attributes: [],
          },
        ],
        raw: true,
        group: ["client_admin_activities.id"],
      });

   

      if (activity && activity.length > 0) {
        activity[0].client_activity_id = req.params.id;
        activity[0].admin_activity_id = null;
      }
 
      updatorWhere = {};
      if (activity[0].type === 1) {
        let wherecondition = `client_activity_id='${req.params.id}' and parent_id is null`;
        if (req.role_id !== 1) {
          if (req.params.libid) {
            wherecondition =
              wherecondition +
              ` and substandard_id in (select substandard_id from activity_mapping 
              where library_id=${req.params.libid}) and (organization_id is null or organization_id=${req.organization_id})`;
          } else {
            wherecondition =
              wherecondition +
              ` and (organization_id is null or organization_id=${req.organization_id})`;
          }
        }
        //updator manage activity

      

        let clientsqlEl = null;
        let substandardCond = `select A.substandard_uid from sub_standards as A left join standards as B on A.standard_id = B.id
        left join chapters as C on C.id = B.chapter_id where library_id in 
        (select library_id from organization_libraries where organization_id=${req.organization_id})`;

        if (req.role_id == 4) { 

          let forUpdatorSubstandards = await db.sequelize.query(`select B.substandard_uid from property_mapping as A left join sub_standards as B on A.substandard_id = B.id and  organization_id=${req.organization_id}
          where (user_id=${req.userId} or (assignto=${req.userId} && expirydate >= CURDATE())) && role_id=4`, {
            type : db.sequelize.QueryTypes.SELECT
          }) 

          if(forUpdatorSubstandards.length > 0) {
            forUpdatorSubstandards = forUpdatorSubstandards.map(el=>el.substandard_uid); 
             forUpdatorSubstandards = "'" + forUpdatorSubstandards.join("','") + "'";
          }
          
        

          clientsqlEl = `
          select A.*,B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id
          from (select * from activity_elements where client_activity_id='${req.params.id}' and parent_id is null  && (organization_id is null or organization_id=${req.organization_id})) as A 
          left join  (select * from  sub_standards where id in ( select substandard_id from activity_mapping where library_id in (select library_id from organization_libraries where organization_id=${req.organization_id}) and client_activity_id=${req.params.id})) as B 
          on A.substandard_id=B.substandard_uid where  (substandard_id in (${forUpdatorSubstandards}) || substandard_id is null) group by substandard_id,element_name order by substandard_name
           `;
        } else {
          

          clientsqlEl = `
          select A.*,B.code as substandard_code,B.name as substandard_name,B.description as substandard_desc,B.standard_id 
              from (select * from activity_elements where client_activity_id='${req.params.id}' and parent_id is null  && (organization_id is null or organization_id=${req.organization_id})) as A
              left join  (select * from  sub_standards where id in ( select substandard_id from activity_mapping where library_id in (select library_id from organization_libraries where organization_id=${req.organization_id}))) as B
              on A.substandard_id=B.substandard_uid  group by substandard_id,element_name order by substandard_name`;
        } 
 
        var element = await db.sequelize.query(clientsqlEl, {
          type: db.sequelize.QueryTypes.SELECT,
        });

        
        if (req.role_id == 2) {
          element.forEach((chEl, chIdx) => {
            element[chIdx].substandard_desc =
              chEl.substandard_desc == null
                ? chEl.element_name
                : chEl.substandard_desc;
            element[chIdx].substandard_code =
              chEl.substandard_code == null
                ? chEl.element_code
                : chEl.substandard_code;
                

            element[chIdx].substandard_name =
              chEl.substandard_name == null
                ? chEl.element_name
                : chEl.substandard_name;

                element[chIdx].element_name = null;
                 
          });
        } else {
          element.forEach((chEl, chIdx) => {
            element[chIdx].substandard_desc =
              chEl.substandard_desc == null
                ? chEl.element_name
                : chEl.substandard_desc;
            element[chIdx].substandard_code =
              chEl.substandard_code == null
                ? chEl.element_code
                : chEl.substandard_code;

            element[chIdx].substandard_name =
              chEl.substandard_name == null
                ? chEl.element_code
                : chEl.substandard_name;
          });
        }

        element = element.map((el) => ({
          ...el,
          sortItem: el.substandard_name,
        }));
        element.sort(helper.compare);
        element = helper.sortAlphanumeric(element);

        activity[0].elements = element;
        activity[0].assign_element = element;
      } else if (activity[0].type == 2) {
        //console.log(activity[0].kpi);
        if (activity[0].kpi && activity[0].kpi === 1) {
          let wherecondition = ` kpi.client_activity_id='${req.params.id}' and kpi.organization_id=${req.organization_id}`;
          // if (req.role_id === 4) {
          //   wherecondition =
          //     wherecondition + ` and kpi.updator_id=${req.userId}`;
          // }

       

          var data_collection = await db.client_admin_datacollections.findAll({
            where: {
              status: { [Op.notIn]: [master.status.delete] },
              organization_id: req.organization_id,
              client_activity_id: req.params.id,
            },
          });

          let currentDate = new Date();

          let filterfromDate =
            currentDate.getFullYear() +
            "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") +
            "-01";
          let filtertoDate =
            currentDate.getFullYear() +
            "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(currentDate.getDate()).padStart(2, "0");

          filterfromDate = helper.dateFormatUSA(filterfromDate);
          filtertoDate = helper.dateFormatUSA(filtertoDate);
          let responseHeadList = await helper.getResponseHead(
            filterfromDate,
            filtertoDate,
            activity[0].response_frequency,
            activity[0].submission_day
          );
 

          let response_elem = [];
 

          for (const elx of responseHeadList) {
            let firstDate = helper.dateFormatUSA(elx.responseDate);
            let secondDate = helper.dateFormatUSA(elx.responseEndDate);
 

            let responseElStorage = await db.sequelize.query(
              `SELECT kpi.id as kpiid,kpi.updator_id as updator_id, elem.* FROM storage_activity_kpi kpi left join storage_activity_kpi_elements elem on kpi.id = elem.storage_id and responsedate between '${firstDate}' and '${secondDate}' where ${wherecondition}
                `,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (responseElStorage.length > 0) {
              if (responseElStorage[0].frequency) {
                response_elem.push({
                  ...responseElStorage[0],
                  responsedate: firstDate,
                  frequency: elx.week,
                });
              } else {
                response_elem.push({
                  actual: "",
                  actual_value: "",
                  frequency: elx.week,
                  id: 0,
                  noneditable: false,
                  score: "",
                  storage_id: 0,
                  responsedate: firstDate,
                  target: data_collection[0].dataValues.target,
                  totarget: data_collection[0].dataValues.totarget,
                });
              }
            } else {
              response_elem.push({
                actual: "",
                actual_value: "",
                frequency: elx.week,
                id: 0,
                noneditable: false,
                score: "",
                storage_id: 0,
                responsedate: firstDate,
                target: data_collection[0].dataValues.target,
                totarget: data_collection[0].dataValues.totarget,
              });
            }
          }

          if (data_collection && data_collection.length > 0) {
            activity[0].target = data_collection[0].dataValues.target;
            activity[0].totarget = data_collection[0].dataValues.totarget;
            activity[0].type_of_number =
              data_collection[0].dataValues.type_of_number;
          }
        

          response_elem = response_elem.map((el, idx) => ({
            ...el,
            isrequired: response_elem.length == idx + 1 ? true : false,
          }));

          activity[0].elements = response_elem;

          activity[0].assign_element = activity[0].elements;
   
        } else {
          var data_collection = await db.client_admin_datacollections.findAll({
            where: {
              status: { [Op.notIn]: [master.status.delete] },
              organization_id: req.organization_id,
              client_activity_id: req.params.id,
            },
          });

          if (data_collection && data_collection.length > 0) {
            // console.log("Data collection");

            activity[0].target = data_collection[0].dataValues.target;
            activity[0].totarget = data_collection[0].dataValues.totarget;
            activity[0].type_of_number =
              data_collection[0].dataValues.type_of_number;
          }

          let wherecondition = `YEAR(updatedAt) = YEAR(CURDATE()) and  admin_activity_id='${req.params.id}' and organization_id=${req.organization_id}`;
          if (req.role_id === 4) {
            wherecondition = wherecondition + ` and updator_id=${req.userId}`;
          }

          var response_elem = await db.sequelize.query(
            `SELECT * FROM storage_observation   where ${wherecondition} `,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          activity[0].elements = await addObservationsplit(
            response_elem,
            activity[0].response_frequency
          );
        }
      } else if (activity[0].type == 3) {
        responseDate = activity[0].submission_day;
        response_frequency = activity[0].response_frequency;
        // let expiryDate = await getExpiryDate(responseDate, response_frequency);
        let expiryDate = await helper.getDueDate(
          responseDate,
          response_frequency
        );      

        activity[0].expiryDate = expiryDate;
        activity[0].expiry_date = expiryDate;
      }
 

      if (req.params.libid) {
        var assign = await db.activity_mapping.findAll({
          where: {
            client_activity_id: req.params.id,
            library_id: req.params.libid,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      } else {
        var assign = await db.activity_mapping.findAll({
          where: {
            client_activity_id: req.params.id,
            substandard_id: { [Op.not]: null },
          },
          include: [
            {
              model: db.sub_standards,
              as: "sub_standards_mapping",
            },
            {
              model: db.standards,
              as: "standards_mapping",
            },
          ],
        });
        activity[0].assign = assign;
      }

      if (
        activity[0].type == 1 &&
        activity[0].elements &&
        activity[0].elements.length > 0
      ) {
        activity[0].elements.forEach(async (el, idx) => {
          var updatorElement =
            await db.storage_activity_checklist_elements.findOne({
              where: {
                element_id: el.id,
              },
              attributes: ["attachment_link", "comments", "response"],
            });

          if (updatorElement == null) {
            updatorElement = { attachment_link: null, comments: null };
          }

          // console.log(activity[0].elements[idx]);
          // return;
          activity[0].elements[idx].updatorElement = updatorElement;
          if (activity[0].assign_element) {
            activity[0].assign_element[idx].updatorElement = updatorElement;
          }

          if (activity[0].elements.length == idx + 1) {
            //activity.elements[idx] = updatorElement;

            res.send(activity);
          }
        });
      } else {
        res.send(activity);
      }
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

getExpiryDate = (responseDate, response_frequency) => {
  if (
    responseDate == null ||
    responseDate == "" ||
    response_frequency == "" ||
    response_frequency == null
  ) {
    return null;
  }

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  responseDate = new Date(responseDate);
  today = new Date(yyyy + "-" + mm + "-" + dd);
  expiryDate = responseDate;
  if (today.getTime() <= responseDate.getTime()) {
    expiryDate = responseDate;
    return expiryDate;
  } else {
    if (response_frequency == "Annual") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setFullYear(responseDate.getFullYear() + 1);
      }
    } else if (response_frequency == "Monthly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = expiryDate.setMonth(expiryDate.getMonth() + 1);
      }
    } else if (response_frequency == "Biannual") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setMonth(responseDate.getMonth() + 6);
      }
    } else if (response_frequency == "Quarterly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setMonth(responseDate.getMonth() + 3);
      }
    } else if (response_frequency == "Weekly") {
      while (today.getTime() <= expiryDate.getTime()) {
        expiryDate = responseDate.setDate(responseDate.getDate() + 1);
      }
    }
    //expiryDate = new Date();
  }

  var newExpiryDate = new Date();
  var dd = String(expiryDate.getDate()).padStart(2, "0");
  var mm = String(expiryDate.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = expiryDate.getFullYear();

  return yyyy + "-" + mm + "-" + dd;
};

exports.delete = async (req, res) => {
  try {
    const clientActivity = await db.client_admin_activities.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!clientActivity) {
      return res.status(401).send("No Activity Found");
    }

    let check = [];
    if (clientActivity.type == 1) {
      check = await db.storage_activity_checklist.findAll({
        where: {
          client_activity_id: req.params.id,
          organization_id: req.organization_id,
          status: 1,
        },
      });
    } else if (clientActivity.type == 2) {
      if (clientActivity.kpi == 1) {
        check = await db.storage_activity_kpi.findAll({
          where: {
            client_activity_id: req.params.id,
            organization_id: req.organization_id,
            status: 1,
          },
        });
      } else {
        check = await db.storage_observation.findAll({
          where: {
            client_activity_id: req.params.id,
            organization_id: req.organization_id,
            status: 1,
          },
        });
      }
    } else {
      check = await db.storage_activity_document.findAll({
        where: {
          client_activity_id: req.params.id,
          organization_id: req.organization_id,
          status: 1,
        },
      });
    }

    if (check.length == 0) {
      // db.client_admin_activities
      //   .update(
      //     {
      //       status: master.status.delete,
      //     },
      //     {
      //       where: { id: req.params.id },
      //     }
      //   )

      db.client_admin_activities
        .destroy({
          where: {
            id: req.params.id,
          },
        })
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "client_client_admin_activities",
            primary_id: data.id,
            event: "delete",
            new_value: data.dataValues,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send({ message: "Deleted Successfully" });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    } else {
      res.status(401).send("Cant Delete The Activity");
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};

async function addResponsesplit(data, freq, target, totarget) {
  //console.log(data);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const Quarter = ["March", "June", "September", "December"];
  const BiAnnual = ["June", "December"];
  const Annual = ["December"];
  var element = [];

  //console.log(data);
  var d = new Date();
  var n = d.getMonth();
  let weekDays = d.getDate();
  let weekNos = Math.ceil(weekDays / 7);
  let weekMonthName = monthNames[n];
  // console.log(freq);
  if (freq === "Monthly") {
    if (data && data.length > 0) {
      var entry = true;
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          id: data[j].id,
          storage_id: data[j].storage_id,
          frequency: data[j].frequency,
          target: target,
          totarget: totarget,
          actual: data[j].actual_value,
          actual_value: data[j].actual_value,
          score: data[j].score,
          noneditable: entry,
        };
        if (monthNames[n] === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }

      if (entry) {
        var elementjson = {
          frequency: monthNames[n],
          storage_id: data[0].storage_id ? data[0].storage_id : data[0].kpiid,
          id: 0,
          target: target,
          totarget: totarget,
          actual: "",
          actual_value: "",
          score: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: monthNames[n],
        id: 0,
        storage_id: 0,
        target: target,
        totarget: totarget,
        actual: "",
        actual_value: "",
        score: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Quarterly") {
    let currentquarter = Quarter[0];
    if (n + 1 / 3 === 1) {
      currentquarter = Quarter[0];
    } else if (n + 1 / 3 === 2) {
      currentquarter = Quarter[1];
    } else if (n + 1 / 3 === 3) {
      currentquarter = Quarter[2];
    } else if (n + 1 / 3 === 4) {
      currentquarter = Quarter[3];
    }
    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          storage_id: data[j].storage_id,
          target: target,
          totarget: totarget,
          actual: data[j].actual_value,
          actual_value: data[j].actual_value,
          score: data[j].score,
          noneditable: entry,
        };

        if (currentquarter === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: currentquarter,
          storage_id: data[0].storage_id ? data[0].storage_id : data[0].kpiid,
          id: 0,
          target: target,
          totarget: totarget,
          actual: "",
          actual_value: "",
          score: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: currentquarter,
        storage_id: 0,
        id: 0,
        target: target,
        totarget: totarget,
        actual: "",
        actual_value: "",

        score: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Biannual") {
    let biann = BiAnnual[0];
    if (n + 1 / 6 === 1) {
      biann = BiAnnual[0];
    } else if (n + 1 / 6 === 2) {
      biann = BiAnnual[1];
    }

    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          storage_id: data[j].storage_id,
          target: target,
          totarget: totarget,
          actual: data[j].actual_value,
          actual_value: data[j].actual_value,
          score: data[j].score,
          noneditable: entry,
        };

        if (biann === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: biann,
          storage_id: data[0].storage_id ? data[0].storage_id : data[0].kpiid,
          id: 0,
          target: target,
          totarget: totarget,
          actual: "",
          actual_value: "",
          score: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: biann,
        storage_id: 0,
        id: 0,
        target: target,
        totarget: totarget,
        actual_value: "",
        actual: "",
        score: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Annual") {
    let ann = Annual[0];
    if (n + 1 / 12 === 1) {
      ann = Annual[0];
    }

    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          storage_id: data[j].storage_id,
          target: target,
          totarget: totarget,
          actual_value: data[j].actual_value,
          actual: data[j].actual_value,
          score: data[j].score,
          noneditable: entry,
        };
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
    } else {
      var elementjson = {
        frequency: ann,
        storage_id: 0,
        id: 0,
        target: target,
        totarget: totarget,
        actual_value: "",
        actual: "",
        score: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Weekly") {
    currentdate = new Date();
    var oneJan = new Date(currentdate.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    var result = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
    // var currentweek = "Week" + result;
    var currentweek = weekMonthName + " Week " + weekNos;
    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          storage_id: data[j].storage_id,
          actual_value: data[j].actual_value,
          target: target,
          totarget: totarget,
          actual: data[j].actual_value,
          score: data[j].score,
          noneditable: entry,
          responsedate: data[j].responsedate,
        };

        if (currentweek === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: currentweek,
          storage_id: data[0].storage_id ? data[0].storage_id : data[0].kpiid,
          id: 0,
          target: target,
          totarget: totarget,
          actual: "",
          actual_value: "",
          score: "",
          responsedate: data[0].responsedate,
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: currentweek,
        storage_id: 0,
        id: 0,
        target: target,
        totarget: totarget,
        actual_value: "",
        actual: "",
        score: "",
        responsedate: data[0].responsedate,
        noneditable: false,
      };
      element.push(elementjson);
    }
  }

  return element;
}

async function addObservationsplit(data, freq) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const Quarter = ["March", "June", "September", "December"];
  const BiAnnual = ["June", "December"];
  const Annual = ["December"];
  var element = [];

  // console.log(data);
  var d = new Date();
  var n = d.getMonth();
  if (freq === "Monthly") {
    if (data && data.length > 0) {
      var entry = true;
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          id: data[j].id,
          frequency: data[j].frequency,
          observation_type: data[j].observation_type,
          currency_type: data[j].currency_type,
          acutal: data[j].currency,
          noneditable: entry,
        };
        if (monthNames[n] === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }

      if (entry) {
        var elementjson = {
          id: 0,

          frequency: monthNames[n],
          id: 0,
          observation_type: "",
          currency_type: "",
          acutal: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: monthNames[n],
        id: 0,
        observation_type: "",
        currency_type: "",
        acutal: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Quarterly") {
    let currentquarter = Quarter[0];
    if (n + 1 / 3 === 1) {
      currentquarter = Quarter[0];
    } else if (n + 1 / 3 === 2) {
      currentquarter = Quarter[1];
    } else if (n + 1 / 3 === 3) {
      currentquarter = Quarter[2];
    } else if (n + 1 / 3 === 4) {
      currentquarter = Quarter[3];
    }
    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          observation_type: data[j].observation_type,
          currency_type: data[j].currency_type,
          acutal: data[j].currency,
          noneditable: entry,
        };

        if (currentquarter === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: currentquarter,
          id: 0,
          observation_type: "",
          currency_type: "",
          acutal: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: currentquarter,
        id: 0,
        observation_type: "",
        currency_type: "",
        acutal: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Biannual") {
    let biann = BiAnnual[0];
    if (n + 1 / 6 === 1) {
      biann = BiAnnual[0];
    } else if (n + 1 / 6 === 2) {
      biann = BiAnnual[1];
    }

    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          observation_type: data[j].observation_type,
          currency_type: data[j].currency_type,
          acutal: data[j].currency,
          noneditable: entry,
        };

        if (biann === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: currentquarter,
          id: 0,
          observation_type: "",
          currency_type: "",
          acutal: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: biann,
        id: 0,
        observation_type: "",
        currency_type: "",
        acutal: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Annual") {
    let ann = Annual[0];
    if (n + 1 / 12 === 1) {
      ann = Annual[0];
    }

    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          observation_type: data[j].observation_type,
          currency_type: data[j].currency_type,
          acutal: data[j].currency,
          noneditable: entry,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: ann,
        id: 0,

        observation_type: "",
        currency_type: "",
        acutal: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  } else if (freq === "Weekly") {
    currentdate = new Date();
    var oneJan = new Date(currentdate.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    var result = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
    var currentweek = "Week" + result;
    var entry = true;
    if (data && data.length > 0) {
      for (let j = 0; j < data.length; j++) {
        var elementjson = {
          frequency: data[j].frequency,
          id: data[j].id,
          observation_type: data[j].observation_type,
          currency_type: data[j].currency_type,
          acutal: data[j].currency,
          noneditable: entry,
        };

        if (currentweek === data[j].frequency) {
          entry = false;
        }
        if (data[j].frequency !== null) {
          element.push(elementjson);
        }
      }
      if (entry) {
        var elementjson = {
          frequency: currentweek,
          id: 0,
          observation_type: "",
          currency_type: "",
          acutal: "",
          noneditable: false,
        };
        element.push(elementjson);
      }
    } else {
      var elementjson = {
        frequency: currentweek,
        id: 0,
        observation_type: "",
        currency_type: "",
        acutal: "",
        noneditable: false,
      };
      element.push(elementjson);
    }
  }

  return element;
}

exports.statusChange = async (req, res) => {
  try {
    db.client_client_admin_activities
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
          table_name: "client_client_admin_activities",
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

// assign_element:[
//   {id:1,substandard_id:1,element_name:"rvrv"},
//   {substandard_id:1,element_name:"rvrv"},
// ]
// remove_assign_id:[1,2,4]
// substandard_ids:[1,2,3,4]
// remove_substandard_ids:[1,2,3,4]

exports.getByType = async (req, res) => {
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;

  let today = new Date();
  if (!fromDate && !toDate) {
    fromDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    toDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
  }

  try {
    let where = "";

    let libList = await db.organization_libraries
      .findAll({
        where: {
          organization_id: req.organization_id,
        },
      })
      .then((result) => result.map((el) => el.library_id));

    let library_ids = null;

    if (libList.length > 0) {
      if (libList.includes(",")) {
        let temp = libList.split(",");
        library_ids = "'" + temp.join("','") + "'";
      } else {
        library_ids = libList.toString();
      }
    }

    let library_idsCond = null;
    if (library_ids) {
      library_idsCond = ` library_id in (${library_ids}) `;
    }

    if (req.body.type == "1") {
      console.log("checklist");

      let property_mapping = `select * from property_mapping where  ${library_idsCond} && organization_id = ${req.organization_id} && role_id=4`;
      let activity_mapping = `select * from activity_mapping where ${library_idsCond}`;

      let sqlAdmin = `
      select C.*,C.id as admin_activity_id,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id 
      from activity_mapping as  A inner join property_mapping as B on A.substandard_id=B.substandard_id  && ${library_idsCond} && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
      left join admin_activities as C on C.id=A.admin_activity_id  && C.type=1
      left join storage_activity_checklist As D on D.admin_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      && B.role_id=4  &&  B.organization_id=${req.organization_id} && C.type=1 && A.admin_activity_id is not  null 
      group by A.admin_activity_id
      `;

      let sqlAdminActOrg = `
      select C.*,C.admin_activity_id as id,C.admin_activity_id as admin_activity_id,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id 
      from activity_mapping as  A left join property_mapping as B on A.substandard_id=B.substandard_id && ${library_idsCond} && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
      left join activities_organization as C on C.admin_activity_id=A.admin_activity_id  && C.type=1 && C.organization_id=${req.organization_id}
      left join storage_activity_checklist As D on D.admin_activity_id = C.admin_activity_id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      && B.role_id=4  && B.organization_id=${req.organization_id} && C.type=1 && A.admin_activity_id is not  null 
      group by A.admin_activity_id
      `;

      let sqlClient = `
      select C.*, C.id as client_admin_activity,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id from activity_mapping as  A left join property_mapping as B on A.substandard_id=B.substandard_id  && ${library_idsCond} && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
      left join client_admin_activities as C on C.id=A.client_activity_id  && C.type=1  && C.organization_id=${req.organization_id}
      left join storage_activity_checklist As D on D.client_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) )   
      && B.role_id=4  && B.organization_id=${req.organization_id} && C.type=1 && A.client_activity_id is not  null 
      group by A.client_activity_id
      `;
      // console.log(sqlAdmin); return;

      if (req.role_id == 4) {
        sqlAdmin = `
          select C.*,C.id as admin_activity_id,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id 
          from (${activity_mapping}  && admin_activity_id is not null) as  A inner join (${property_mapping}) as B on A.substandard_id=B.substandard_id  && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
          inner join admin_activities as C on C.id=A.admin_activity_id  && C.type=1
          left join storage_activity_checklist As D on D.admin_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
          left join users as u on u.id = B.user_id
          where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) )
          group by A.admin_activity_id         
          `;
        sqlAdminActOrg = `
          select C.*,C.admin_activity_id as id,C.admin_activity_id as admin_activity_id,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id 
          from (${activity_mapping}  && admin_activity_id is not null) as A inner join (${property_mapping})  as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
          inner join activities_organization as C on C.admin_activity_id=A.admin_activity_id  && C.type=1 && C.organization_id=${req.organization_id}
          left join storage_activity_checklist As D on D.admin_activity_id = C.admin_activity_id && D.organization_id=${req.organization_id} ${where}
          left join users as u on u.id = B.user_id
          where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
          group by A.admin_activity_id
          `;

        sqlClient = `
          select C.*, C.id as client_admin_activity,FORMAT(avg(D.score),2) as score,u.name as updatorname, u.id as updator_id,A.library_id 
          from (${activity_mapping}  && client_activity_id is not null) as  A inner join (${property_mapping}) as B on A.substandard_id=B.substandard_id  && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id}) 
          inner join client_admin_activities as C on C.id=A.client_activity_id  && C.type=1  && C.organization_id=${req.organization_id}
          left join storage_activity_checklist As D on D.client_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
          left join users as u on u.id = B.user_id
          where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) )   
         group by A.client_activity_id
          `;
      }

      

      let adminActivities = await db.sequelize.query(sqlAdmin, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      let adminActivitiesOrg = await db.sequelize.query(sqlAdminActOrg, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      let clientActivities = await db.sequelize.query(sqlClient, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      adminActivities.map((x) => {
        zz = adminActivitiesOrg.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });
        if (zz) {
          delete zz.id;
          Object.assign(x, zz);
        }
      });



      let chkList = [...adminActivities, ...clientActivities];



      let chk_dedup = [];
      if (chkList.length > 0) {
        chk_dedup = chkList.filter(
          (kpi, index, self) => index === self.findIndex((t) => t.id === kpi.id)
        );
      }

 

      let cIdx = 0;
      const newActivityArr = [];
      for (const chEl of chk_dedup) {
        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          chk_dedup[cIdx].response_frequency,
          chk_dedup[cIdx].submission_day
        );

       if(responseHeadList.length > 0) {

        for (const responseHead of responseHeadList) {
          let firstDate = helper.dateFormatUSA(responseHead.responseDate);
          let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

          where = ` and admin_activity_id='${chEl.admin_activity_id}' and response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

          if (chEl.client_admin_activity) {
            where = ` and client_activity_id=${chEl.client_admin_activity} and response_date between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
          }

          let avgScore = await db.sequelize.query(
            `select avg(score) as score from storage_activity_checklist where organization_id = ${req.organization_id} ${where}`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          newActivityArr.push({
            ...chk_dedup[cIdx],
            score:
              avgScore[0].score > 0
                ? avgScore[0].score.toFixed(2)
                : avgScore[0].score,
            response: responseHead.week,
            responseDate: responseHead.responseDate,
            responseEndDate: responseHead.responseEndDate,
          });
        }


       } else {

        newActivityArr.push({
          ...chk_dedup[cIdx],
          score:
           null,
          response: null,
          responseDate: null,
          responseEndDate: null,
        });

       }

     
        // chk_dedup[cIdx].score = avgScore[0].score;

        cIdx++;
      }

      //console.log(chk_dedup);
      res.send(newActivityArr);
    } else if (req.body.type == "2") {
      console.log("data collection");

      if (fromDate && toDate) {
        //where = ` and responsedate between '${fromDate}' and '${toDate}' `;
      }

      let sqlAdminObs = `
      select C.*,'100' as score,A.admin_activity_id as admin_activity_id,u.name as updatorname, u.id as updator_id,e.type_of_number,e.target,e.totarget,
      F.id as storage_kpi_id,D.id as storage_obs_id,D.comments as obs_comment,D.currency as obs_currency  
      from activity_mapping as  A left join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id}) 
      left join admin_activities as C on C.id=A.admin_activity_id  && C.type=2 
      left join client_admin_datacollections as e on e.admin_activity_id = C.id && e.organization_id=${req.organization_id}
      left join storage_observation As D on D.admin_activity_id = C.id && D.organization_id=${req.organization_id}   
      left join storage_activity_kpi As F on F.admin_activity_id = C.id && F.organization_id=${req.organization_id}  
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && B.expirydate >= CURDATE()) )  
      && B.role_id=4  && B.organization_id=${req.organization_id} && C.type=2
      && A.admin_activity_id is not  null 
      group by A.admin_activity_id  
      `;

      let sqlAdminObsActOrg = `
      select C.*,C.admin_activity_id as admin_activity_id, '100' as score,u.name as updatorname, u.id as updator_id,e.type_of_number,e.target,e.totarget,
      F.id as storage_kpi_id,D.id as storage_obs_id,D.comments as obs_comment,D.currency as obs_currency  
      from activity_mapping as  A left join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id})
      left join activities_organization as C on C.admin_activity_id=A.admin_activity_id  && C.type=2 && C.organization_id=${req.organization_id}
      left join client_admin_datacollections as e on e.admin_activity_id = C.admin_activity_id && e.organization_id=${req.organization_id}
      left join storage_observation As D on D.admin_activity_id = C.admin_activity_id && D.organization_id=${req.organization_id} 
      left join storage_activity_kpi As F on F.admin_activity_id = C.admin_activity_id && F.organization_id=${req.organization_id} 
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && B.expirydate >= CURDATE()) ) 
      && B.role_id=4 && B.organization_id=${req.organization_id} && C.type=2 
      && A.admin_activity_id is not  null 
      group by A.admin_activity_id
      `;

      let sqlClientObs = `
      select C.*, C.id as client_admin_activity, '100' as score,u.name as updatorname, u.id as updator_id,e.type_of_number,e.target,e.totarget,
      F.id as storage_kpi_id,D.id as storage_obs_id,D.comments as obs_comment,D.currency as obs_currency  
      from activity_mapping as  A left join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id   && A.organization_id in (0,${req.organization_id})
      left join client_admin_activities as C on C.id=A.client_activity_id && C.type=2 && C.organization_id=${req.organization_id}
      left join client_admin_datacollections as e on e.client_activity_id = C.id && e.organization_id=${req.organization_id}
      left join storage_observation As D on D.client_activity_id = C.id && D.organization_id=${req.organization_id} 
      left join storage_activity_kpi As F on F.client_activity_id = C.id && F.organization_id=${req.organization_id} 
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && B.expirydate >= CURDATE()) ) 
      && B.role_id=4 && B.organization_id=${req.organization_id} && C.type=2  && A.client_activity_id is not  null 
      group by A.client_activity_id
      `;

      //console.log(sqlAdminObs);

      let adminActivitiesObs = await db.sequelize.query(sqlAdminObs, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      let adminActivitiesObsOrg = await db.sequelize.query(sqlAdminObsActOrg, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      let clientActivitiesObs = await db.sequelize.query(sqlClientObs, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      adminActivitiesObs.map((x) => {
        zz = adminActivitiesObsOrg.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });
        if (zz) {
          delete zz.id;
          Object.assign(x, zz);
        }
      });

      let obsList = [
        ...adminActivitiesObs,
        // ...adminActivitiesObsOrg,
        ...clientActivitiesObs,
      ];

      let data_dedup = [];
      if (obsList.length > 0) {
        data_dedup = obsList.filter(
          (kpi, index, self) => index === self.findIndex((t) => t.id === kpi.id)
        );
      }

      let kpi_dedup = [];
      let obs_dedup = [];
      if (data_dedup.length > 0) {
        obs_dedup = data_dedup.filter((t) => t.kpi === 0);
        kpi_dedup = data_dedup.filter((t) => t.kpi === 1);

        kpi_dedup = kpi_dedup.map((el) => {
          let kpistatus = "Pending";
          if (el.storage_kpi_id && el.score) {
            kpistatus = "Complete";
          }
          return { ...el, status: kpistatus };
        });

        obs_dedup = obs_dedup.map((el) => {
          let obsStatus = "Pending";
          if (el.storage_obs_id) {
            obsStatus = "Complete";
          }
          return { ...el, status: obsStatus };
        });
      }

      /* let kpiIndex = 0;
      for (const kpiact of kpi_dedup) {
        let scoreList = await helper.getKPIScoreAndActual(
          req.organization_id,
          kpiact.admin_activity_id,
          kpiact.client_admin_activity
        );

        let avgYtdValue = 0;
        let avgYtdScore = 0;
        if (scoreList.length > 0) {
          scoreidx = 0;
          for (const element of scoreList) {
            avgYtdValue = 0;
            avgYtdScore = 0;
            itemFreq = element.frequency;
            //  console.log(itemFreq);
            itemIndex = scoreList.findIndex(
              (score) => score.frequency == itemFreq
            );
            // console.log(itemIndex);
            const kpiscoresList = scoreList.filter(
              (el, idx) => idx <= itemIndex
            );
            // console.log(kpiscoresList);
            let ytd = await helper.getYtDValues(kpiscoresList, itemFreq);
            scoreList[scoreidx].ytdValue = ytd.actualValue;
            scoreList[scoreidx].ytdScore = ytd.actualScore;
            scoreidx++;
          }
          avgYtdValue =
            scoreList.reduce((a, b) => a + b.ytdValue, 0) / scoreList.length;
          avgYtdScore =
            scoreList.reduce((a, b) => a + b.ytdScore, 0) / scoreList.length;
        }
        if (kpi_dedup[kpiIndex]) {
          kpi_dedup[kpiIndex].avgYtdScore = avgYtdScore;
          kpi_dedup[kpiIndex].avgYtdValue = avgYtdValue;
        }

        kpiIndex++;
      } */

      const newKPIActivityArr = [];
      for (const chEl of kpi_dedup) {
        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          chEl.response_frequency,
          chEl.submission_day
        );

        for (const responseHead of responseHeadList) {
          let firstDate = helper.dateFormatUSA(responseHead.responseDate);
          let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

          where = ` and admin_activity_id='${chEl.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

          if (chEl.client_admin_activity) {
            where = ` and client_activity_id=${chEl.client_admin_activity} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
          }

          let storageDetails = await db.sequelize.query(
            `select * from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where organization_id = ${req.organization_id} ${where} order by responsedate`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          let kpiStorageObj = {
            score: "",
            status: "Pending",
            storage_kpi_id: null,
            response: responseHead.week,
            responseDate: responseHead.responseDate,
            responseEndDate: responseHead.responseEndDate,
          };
          if (storageDetails.length > 0) {
            kpiStorageObj = {
              score: storageDetails[0].score,
              status: "Complete",
              storage_kpi_id: storageDetails[0].storage_id,
            };
          }

          newKPIActivityArr.push({
            ...chEl,
            ...kpiStorageObj,
            response: responseHead.week,
            responseDate: responseHead.responseDate,
            responseEndDate: responseHead.responseEndDate,
          });
        }
      }

      const newOBSActivityArr = [];

      if (obs_dedup.length > 0) {
        for (const chEl of obs_dedup) {
          let responseHeadList = await helper.getResponseHead(
            fromDate,
            toDate,
            chEl.response_frequency,
            chEl.submission_day
          );

          for (const responseHead of responseHeadList) {
            let firstDate = helper.dateFormatUSA(responseHead.responseDate);
            let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

            where = ` and admin_activity_id='${chEl.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

            if (chEl.client_admin_activity) {
              where = ` and client_activity_id=${chEl.client_admin_activity} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
            }

            let storageDetails = await db.sequelize.query(
              `select * from storage_observation where organization_id = ${req.organization_id} ${where} order by responsedate`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            let kpiStorageObj = {
              score: "",
              status: "Pending",
              storage_kpi_id: null,
              storage_obs_id: null,
              response: responseHead.week,
              responseDate: responseHead.responseDate,
              responseEndDate: responseHead.responseEndDate,
              obs_currency: null,
              obs_comment: null,
            };
            if (storageDetails.length > 0) {
              kpiStorageObj = {
                score: storageDetails[0].score,
                status: "Complete",
                storage_kpi_id: null,
                storage_obs_id: storageDetails[0].id,
                obs_currency: storageDetails[0].currency,
                obs_comment: storageDetails[0].comments,
              };
            }

            newOBSActivityArr.push({
              ...chEl,
              ...kpiStorageObj,
              response: responseHead.week,
              responseDate: responseHead.responseDate,
              responseEndDate: responseHead.responseEndDate,
            });
          }
        }
      }

      let kpiIndex = 0;
      for (const kpiact of newKPIActivityArr) {
        let scoreList = await helper.getKPIScoreAndActual(
          req.organization_id,
          kpiact.admin_activity_id,
          kpiact.client_admin_activity,
          req.query.fromDate,
          req.query.toDate
        );

        let avgYtdValue = 0;
        let avgYtdScore = 0;
        if (scoreList.length > 0) {
          scoreidx = 0;
          for (const element of scoreList) {
            avgYtdValue = 0;
            avgYtdScore = 0;
            itemFreq = element.frequency;
            //  console.log(itemFreq);
            itemIndex = scoreList.findIndex(
              (score) => score.frequency == itemFreq
            );
            // console.log(itemIndex);
            const kpiscoresList = scoreList.filter(
              (el, idx) => idx <= itemIndex
            );
            // console.log(kpiscoresList);
            let ytd = await helper.getYtDValues(kpiscoresList, itemFreq);
            scoreList[scoreidx].ytdValue = ytd.actualValue;
            scoreList[scoreidx].ytdScore = ytd.actualScore;
            scoreidx++;
          }
          avgYtdValue =
            scoreList.reduce((a, b) => a + b.ytdValue, 0) / scoreList.length;
          avgYtdScore =
            scoreList.reduce((a, b) => a + b.ytdScore, 0) / scoreList.length;
        }
        if (kpi_dedup[kpiIndex]) {
          kpi_dedup[kpiIndex].avgYtdScore = avgYtdScore;
          kpi_dedup[kpiIndex].avgYtdValue = avgYtdValue;
        }

        kpiIndex++;
      }

      details = {};
      details.kpi = newKPIActivityArr;
      details.observation = newOBSActivityArr;
      res.send(details);
    } else {
      console.log("document evidence");

      let property_mapping = `select * from property_mapping where  ${library_idsCond} && organization_id = ${req.organization_id} && role_id=4`;
      let activity_mapping = `select * from activity_mapping where ${library_idsCond}`;

      if (fromDate && toDate) {
        where = ` and responsedate between '${fromDate}' and '${toDate}' `;
      }

      let sqlAdmindoc = ` select C.*,C.id as admin_activity_id,u.name as updatorname, u.id as updator_id ,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from activity_mapping as  A inner join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id})
      inner join admin_activities as C on C.id=A.admin_activity_id  && C.type=3
      left join storage_activity_document As D on D.admin_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      && B.role_id=4  && B.organization_id=${req.organization_id} && C.type=3 
      && A.admin_activity_id is not  null 
      group by A.admin_activity_id`;

      let sqlAdminActOrgdoc = ` select C.*,C.admin_activity_id as id,u.name as updatorname, u.id as updator_id ,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from activity_mapping as  A inner join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id}) 
      inner join activities_organization as C on C.admin_activity_id=A.admin_activity_id  && C.type=3 && C.organization_id=${req.organization_id}
      left join storage_activity_document As D on D.admin_activity_id = C.admin_activity_id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) )  
      && B.role_id=4   && B.organization_id=${req.organization_id} && C.type=3 
      && A.admin_activity_id is not  null 
      group by A.admin_activity_id`;

      let sqlClientdoc = `
      select C.*, C.id as client_admin_activity,u.name as updatorname, u.id as updator_id,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from activity_mapping as  A inner join property_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id}) 
      inner join client_admin_activities as C on C.id=A.client_activity_id  && C.type=3 && C.organization_id=${req.organization_id}
      left join storage_activity_document As D on D.client_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where  (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      && B.role_id=4  && B.organization_id=${req.organization_id} && C.type=3 && A.client_activity_id is not  null 
      group by A.client_activity_id
      `;

      if (req.role_id == 4) {
        sqlAdmindoc = ` select C.*,C.id as admin_activity_id,u.name as updatorname, u.id as updator_id ,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from (${activity_mapping}  && admin_activity_id is not null) as  A inner join (${property_mapping}) as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id})
      inner join admin_activities as C on C.id=A.admin_activity_id  && C.type=3
      left join storage_activity_document As D on D.admin_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      group by A.admin_activity_id`;

        sqlAdminActOrgdoc = ` select C.*,C.admin_activity_id as id,u.name as updatorname, u.id as updator_id ,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from (${activity_mapping}  && admin_activity_id is not null) as  A inner join (${property_mapping}) as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id}) 
      inner join activities_organization as C on C.admin_activity_id=A.admin_activity_id  && C.type=3 && C.organization_id=${req.organization_id}
      left join storage_activity_document As D on D.admin_activity_id = C.admin_activity_id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) )  
      group by A.admin_activity_id`;

        sqlClientdoc = `
      select C.*, C.id as client_admin_activity,u.name as updatorname, u.id as updator_id,'' as file_no,D.document_link as attachment_link,D.expiry_date,
      (case when  D.document_link  is not null then 100 else null END) as score,
      (case when  D.document_link  is not null then 'Completed' else 'Pending' END) as status,D.comment
      from (${activity_mapping}  && client_activity_id is not null) as  A inner join (${property_mapping}) as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  && A.organization_id in (0,${req.organization_id}) 
      inner join client_admin_activities as C on C.id=A.client_activity_id  && C.type=3 && C.organization_id=${req.organization_id}
      left join storage_activity_document As D on D.client_activity_id = C.id && D.organization_id=${req.organization_id} ${where}
      left join users as u on u.id = B.user_id
      where  (B.user_id=${req.userId}   or (B.assignto=${req.userId} && (case when  B.expirydate is null then '0000-00-00' else  B.expirydate  end ) >= CURDATE()) ) 
      group by A.client_activity_id
      `;
      }
 

      let adminActivitiesdoc = await db.sequelize.query(sqlAdmindoc, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      let adminActivitiesOrgdoc = await db.sequelize.query(sqlAdminActOrgdoc, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      let clientActivitiesdoc = await db.sequelize.query(sqlClientdoc, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      adminActivitiesdoc.map((x) => {
        zz = adminActivitiesOrgdoc.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });
        if (zz) {
          delete zz.id;
          delete zz.status;
          delete zz.attachment_link;
          Object.assign(x, zz);
        }
      });

      let actListdoc = [...adminActivitiesdoc, ...clientActivitiesdoc];
      let doc_act_dedup = [];
      if (actListdoc.length > 0) {
        doc_act_dedup = actListdoc.filter(
          (kpi, index, self) => index === self.findIndex((t) => t.id === kpi.id)
        );
      }

      const newActivityArr = [];
      for (const docEl of doc_act_dedup) {
        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          docEl.response_frequency,
          docEl.submission_day
        );

        //  console.log(responseHeadList);

        if(responseHeadList.length > 0) {
          for (const responseHead of responseHeadList) {
            let firstDate = helper.dateFormatUSA(responseHead.responseDate);
            let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);
  
            where = ` and admin_activity_id='${docEl.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
  
            if (docEl.client_admin_activity) {
              where = ` and client_activity_id=${docEl.client_admin_activity} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
            }
  
            let storage_activity_documents = await db.sequelize.query(
              `select *,(select name from users where id=storage_activity_document.updator_id) as updatorname from storage_activity_document where organization_id = ${req.organization_id} ${where} limit 1`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );
 
            let stoageRes = {
              updatorname: "",
              score: "",
              attachment_link: "",
              comment: "",
              expiry_date: responseHead.responseEndDate,
              // description: "",
              storage_id: null,
            };
            if (storage_activity_documents.length) {
              stoageRes = {
                attachment_link: storage_activity_documents[0].document_link,
                comment: storage_activity_documents[0].comment,
                expiry_date: storage_activity_documents[0].expiry_date,
                // description: storage_activity_documents[0].description,
                updatorname: storage_activity_documents[0].updatorname,
                storage_id: storage_activity_documents[0].id,
                score: 100,
              };
            }
  
            //console.log(stoageRes);
  
            newActivityArr.push({
              ...docEl,
              ...stoageRes,
              response: responseHead.week,
              responseDate: responseHead.responseDate,
              responseEndDate: responseHead.responseEndDate,
            });
          }

        } else {
            newActivityArr.push({
              ...docEl,
              updatorname: null,
              score: null,
              attachment_link: null,
              comment: null,
              expiry_date: null,
              // description: null,
              storage_id: null,
              response: null,
              responseDate: null,
              responseEndDate: null,
            });
        }

        
      }

      res.send(newActivityArr);
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};
