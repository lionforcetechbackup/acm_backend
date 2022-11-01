const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
const multer = require("multer");
const { access } = require("fs");
const { exit } = require("process");
const helper = require("../util/helper");
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

assignElementAdmin = async (assign_element, id, req) => {
  // console.log(assign_element, id)
  var org_id = null;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  if (assign_element.length > 0) {
    for (let index = 0; index < assign_element.length; index++) {
      const element = assign_element[index];
      let countDetail = await db.activity_elements.count();
      if (req.role_id === 1) {
        var admin_activity_element = crypto
          .createHash("sha256")
          .update(
            req.body.name + "_" + element.element_name + "_" + element.substandard_id
          )
          .digest("hex");
      } else {
        var admin_activity_element = crypto
          .createHash("sha256")
          .update(req.body.name + "_" + element.element_name + "_" + org_id)
          .digest("hex");
      }

      var activity_elements_check = await db.sequelize.query(
        `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name='${element.element_name}'`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (activity_elements_check && activity_elements_check[0].count !== 0) {
        return true;
      } else {

        let substandardEl = await db.sub_standards.findOne({
          where : {
            id : element.substandard_id
          }
        })

        if(substandardEl) {
          element.element_name = substandardEl.description;
          element.substandard_id = substandardEl.substandard_uid;
        }

        await db.activity_elements
          .create({
            id: admin_activity_element,
            admin_activity_id: id,
            // substandard_id: element.substandard_id,
            substandard_id: element.substandard_id,
            element_code: "E" + countDetail,
            element_name: element.element_name,
            status: master.status.active,
            organization_id: org_id,
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
          });
      }
    }
  } else {
    return assign_element;
  }
};
updateElementAdmin = async (assign_element, id, req) => {
  var org_id = null;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  if (assign_element.length > 0) {
    // console.log(assign_element.length);

    for (let index = 0; index < assign_element.length; index++) {
      const element = assign_element[index];
      let countDetail = await db.activity_elements.count();

      if (element.id) {
        await db.activity_elements
          .update(
            {
              admin_activity_id: id,
              // substandard_id: element.substandard_id,
              element_name: element.element_name,
              status: master.status.active,
              organization_id: org_id,
            },
            {
              where: { id: req.body.id },
            }
          )
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
          }).catch(error=> console.log(error)) ;
      } else {
        var admin_activity_element = "";
        if (req.role_id === 1) {
          admin_activity_element = crypto
            .createHash("sha256")
            .update(
              req.body.name + "_" + element.element_name
            )
            .digest("hex");
        } else {
          admin_activity_element = crypto
            .createHash("sha256")
            .update(req.body.name + "_" + element.element_name + "_" + req.organization_id)
            .digest("hex");
        }

        var activity_elements_check = await db.sequelize.query(
          `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name='${element.element_name}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (activity_elements_check && activity_elements_check[0].count !== 0) {
          if (assign_element.length == index + 1) {
            return datas;
          }
        } else {

          let substandard_uid = crypto.createHash("sha256").update(element.element_name.trim()).digest("hex"); 
          await db.activity_elements
            .upsert({
              id: admin_activity_element,
              admin_activity_id: id,
              substandard_id: substandard_uid,
              element_code: "E" + countDetail,
              element_name: element.element_name,
              status: master.status.active,
              organization_id: org_id,
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
            }).catch(error=> console.log(error)) ;
        }
      }
    }
  } else {
    return assign_element;
  }
};

exports.activityTypeGet = async (req, res) => {
  res.send(master.activity_type);
};
abbrevation = (str) => {
  // var str = "Java Script Object Notation";
  var matches = str.match(/\b(\w)/g); // ['J','S','O','N']
  var acronym = matches.join(""); // JSON
  return acronym;
};
exports.create = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  var assign_element = req.body.assign_element;
  if (req.body.name != "") {
    var codeCreate = abbrevation(req.body.name);
  } else {
    var codeCreate = "";
  }
  try {
    var code = await db.admin_activities.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
    var elementCode = await db.activity_elements.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });

    var admin_activity_id = crypto
      .createHash("sha256")
      .update(req.body.name.trim() + "_" + req.body.type)
      .digest("hex");

    var activity_check = db.sequelize.query(
      `select * from admin_activities where id='${admin_activity_id}'`
    );

    if (activity_check && activity_check.length > 0) {
      var duplicate = {
        code: "duplicate",
        id: activity_check.id,
      };
      res.send(duplicate);
    } else {
      if (req.body.type == 1) {
        //type 1 checklist
        //console.log(admin_activity_id)
        db.admin_activities
          .create(
            {
              id: admin_activity_id,
              code: "Chk." + codeCreate + "." + code,
              description: req.body.description,
              type: req.body.type,
              name: req.body.name,
              response_frequency: req.body.response_frequency,
              submission_day: req.body.submission_day,
              status: master.status.active,
            },
            {
              logging: console.log,
            }
          )
          .then(async (data) => {
            if (assign_element !== null && assign_element.length > 0) {
              await assignElementAdmin(assign_element, data.id, req);
            }

            if (
              req.body.substandard_id !== null &&
              req.body.substandard_id.length > 0
            ) {
              await helper.activitySessionMappingInsert(req, admin_activity_id);
              substandard_ids = req.body.substandard_id.map((sub) => sub.id);
              substandard_ids.forEach((sub_id, key) => {
                // console.log(sub_id, key,1111111111)
                db.sequelize
                  .query(
                    `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then((finaldata) => {
                    //console.log(finaldata);
                    ///step4-activity_mapping create
                    //console.log(req.body.name);
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
                      .create({
                        id: admin_activity_id_mapping,
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        admin_activity_id: data.id,
                        status: master.status.active,
                        organization_id: org_id,
                      })
                      .then((mappingdata) => {
                        auditCreate.create({
                          user_id: req.userId,
                          table_name: "admin_activities",
                          primary_id: mappingdata.id,
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
                          //res.send(data);
                          res.send({ message: "activity Created" });
                        }
                      })
                      .catch((error) => {
                        logger.info("/error", error);
                        db.admin_activities
                          .destroy({
                            where: {
                              id: data.id,
                            },
                          })
                          .then((errordata) => res.send(error));
                      });
                  })
                  .catch((error) => {
                    logger.info("/error", error);
                    db.admin_activities
                      .destroy({
                        where: {
                          id: data.id,
                        },
                      })
                      .then((errordata) => res.send(error));
                  });
              });
            } else if (req.body.library_id && req.body.library_id !== null) {
              var admin_activity_id_mapping = crypto
                .createHash("sha256")
                .update(
                  req.body.name +
                    "_" +
                    0 +
                    "_" +
                    0 +
                    "_" +
                    0 +
                    "_" +
                    req.body.library_id
                )
                .digest("hex");

              db.activity_mapping
                .create({
                  id: admin_activity_id_mapping,
                  library_id: req.body.library_id,
                  chapter_id: null,
                  standard_id: null,
                  substandard_id: null,
                  admin_activity_id: data.id,
                  status: master.status.active,
                  organization_id: org_id,
                })
                .then((mappingdata) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "admin_activities",
                    primary_id: mappingdata.id,
                    event: "create",
                    new_value: req.body,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "activity_mapping",
                    primary_id: "0",
                    event: "create",
                    new_value: mappingdata.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });

                  res.send({ message: "activity Created" });
                })
                .catch((error) => {
                  logger.info("/error", error);
                  db.admin_activities
                    .destroy({
                      where: {
                        id: data.id,
                      },
                    })
                    .then((errordata) => res.send(error));
                });
            } else {
              res.send({ message: "activity Created" });
            }
            // db.activity_mapping.create({
            //   library_id: req.body.library_id, chapter_id: req.body.chapter_id, standard_id: req.body.standard_id, substandard_id: req.body.substandard_id, admin_activity_id: data.id,status:master.status.active
            // }).then((mappingdata) => {
            //   auditCreate.create({ "user_id": req.userId, 'table_name': "admin_activities", 'primary_id': data.id, 'event': "create", 'new_value': mappingdata.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
            //   auditCreate.create({ "user_id": req.userId, 'table_name': "activity_mapping", 'primary_id': mappingdata.id, 'event': "create", 'new_value': mappingdata.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
            //   res.send(data);
            // }).catch((error) => {
            //   logger.info("/error", error);
            //   db.admin_activities.destroy({
            //     where: {
            //       id: data.id
            //     }
            //   }).then(errordata => res.send(error))
            // })
          })
          .catch((error) => {
            console.log(error);
            logger.info("/error", error);
            res.send(error);
          });
      } else if (req.body.type == 2) {
        if (req.body.kpi == 0) {
          var codeValue = "Obs." + codeCreate + "." + code;
        } else {
          var codeValue = "Kpi." + codeCreate + "." + code;
        }

        adminActivities = await db.admin_activities.create({
          id: admin_activity_id,
          code: codeValue,
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
          status: master.status.active,
          assign_dummy: "",
          // req.body.assign_dummy == ""
          //   ? null
          //   : JSON.stringify(JSON.stringify(req.body.assign_dummy)),
          // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy))
        });

        if (
          req.body.substandard_id !== null &&
          req.body.substandard_id.length > 0
        ) {
          await helper.activitySessionMappingInsert(req, admin_activity_id);
          substandard_ids = req.body.substandard_id.map((sub) => sub.id);
          subIdx = 0;
          for (const sub_id of substandard_ids) {
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

            mappingdata = await db.activity_mapping.create({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              admin_activity_id: adminActivities.id,
              status: master.status.active,
              organization_id: org_id,
            });

            await auditCreate.create({
              user_id: req.userId,
              table_name: "admin_activities",
              primary_id: "0",
              event: "create",
              new_value: req.body,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            await auditCreate.create({
              user_id: req.userId,
              table_name: "activity_mapping",
              primary_id: "0",
              event: "create",
              new_value: mappingdata.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            if (subIdx + 1 == req.body.substandard_id.length) {
              return res.send({ message: "activity Created" });
            }
            subIdx++;
          }
        } else if (req.body.library_id && req.body.library_id !== null) {
          var admin_activity_id_mapping = crypto
            .createHash("sha256")
            .update(
              req.body.name +
                "_" +
                0 +
                "_" +
                0 +
                "_" +
                0 +
                "_" +
                req.body.library_id
            )
            .digest("hex");

          db.activity_mapping
            .create({
              id: admin_activity_id_mapping,
              library_id: req.body.library_id,
              chapter_id: null,
              standard_id: null,
              substandard_id: null,
              admin_activity_id: adminActivities.id,
              status: master.status.active,
              organization_id: org_id,
            })
            .then((mappingdata) => {
              auditCreate.create({
                user_id: req.userId,
                table_name: "admin_activities",
                primary_id: "0",
                event: "create",
                new_value: req.body,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_mapping",
                primary_id: "0",
                event: "create",
                new_value: mappingdata.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });

              return res.send({ message: "activity Created" });
            })
            .catch((error) => {
              logger.info("/error", error);
              db.admin_activities
                .destroy({
                  where: {
                    id: data.id,
                  },
                })
                .then((errordata) => res.send(error));
            });
        } else {
          return res.send({ message: "activity Created" });
        }
      } else if (req.body.type == 3) {
        var element = req.body;
        var fileLink = null;
        if (req.file) {
          var path = req.file.destination + "/" + req.file.filename;
          fileLink = path.replace("./", "");
        }
        //console.log(fileLink)
        adminActivities = await db.admin_activities.create({
          id: admin_activity_id,
          code: "Doc." + codeCreate + "." + code,
          description: element.description,
          type: element.type,
          name: element.name,
          response_frequency: element.response_frequency,
          submission_day: element.submission_day,
          document_name: element.document_name,
          document_description: element.document_description,
          document_link: fileLink,
          expiry_days: element.expiry_days,
          status: master.status.active,
          assign_dummy: "",
          // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy))
          // element_dummy:(req.body.element_dummy == '')?null:JSON.stringify(JSON.stringify(req.body.element_dummy)),
          // assign_dummy:(req.body.assign_dummy == '')?null:JSON.stringify(JSON.stringify(req.body.assign_dummy))
        });

        if (
          req.body.substandard_id !== null &&
          req.body.substandard_id.length > 0
        ) {
          await helper.activitySessionMappingInsert(req, admin_activity_id);
          substandard_ids = req.body.substandard_id.map((sub) => sub.id);
          subIdx = 0;
          for (const sub_id of substandard_ids) {
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

            mappingdata = await db.activity_mapping.create({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              admin_activity_id: adminActivities.id,
              status: master.status.active,
              organization_id: org_id,
            });

            await auditCreate.create({
              user_id: req.userId,
              table_name: "admin_activities",
              primary_id: "0",
              event: "create",
              new_value: req.body,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            await auditCreate.create({
              user_id: req.userId,
              table_name: "activity_mapping",
              primary_id: "0",
              event: "create",
              new_value:  mappingdata.dataValues,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });
            if (subIdx + 1 == req.body.substandard_id.length) {
              return res.send({ message: "activity Created" });
            }
            subIdx++;
          }
        } else if (req.body.library_id && req.body.library_id !== null) {
          var admin_activity_id_mapping = crypto
            .createHash("sha256")
            .update(
              req.body.name +
                "_" +
                0 +
                "_" +
                0 +
                "_" +
                0 +
                "_" +
                req.body.library_id
            )
            .digest("hex");

          db.activity_mapping
            .create({
              id: admin_activity_id_mapping,
              library_id: req.body.library_id,
              chapter_id: null,
              standard_id: null,
              substandard_id: null,
              admin_activity_id: adminActivities.id,
              status: master.status.active,
              organization_id: org_id,
            })
            .then((mappingdata) => {
              auditCreate.create({
                user_id: req.userId,
                table_name: "admin_activities",
                primary_id: "0",
                event: "create",
                new_value: req.body,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_mapping",
                primary_id: "0",
                event: "create",
                new_value: mappingdata.dataValues,
                url: req.url,
                user_agent: req.headers["user-agent"],
                ip_address: req.connection.remoteAddress,
              });
              res.send({ message: "activity Created" });
            })
            .catch((error) => {
              logger.info("/error", error);
              db.admin_activities
                .destroy({
                  where: {
                    id: data.id,
                  },
                })
                .then((errordata) => res.send(error));
            });
        } else {
          res.send("stored");
        }
      }
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};
exports.update = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  // var substandard_Ids = [1, 2, 3, 6];
  var deletedsubId = [4, 5];
  // var assign_element = [{ id:1,substandard_id: 1, element_name: "giri" }, { substandard_id: 2, element_name: "ram" }]
  var remove_assign_id = req.body.remove_assign_id;
  var assign_element = req.body.assign_element;
  var remove_substandard_ids = req.body.remove_substandard_ids;

  if (req.body.name != "") {
    var codeCreate = abbrevation(req.body.name);
  } else {
    var codeCreate = "";
  }

  try {
    var code = await db.admin_activities.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
    var elementCode = await db.activity_elements.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });

    if (req.body.type == 1) {
      //type 1 checklist
      adminActivity = await db.admin_activities.update(
        {
          code: "Chk." + codeCreate + "." + code,
          description: req.body.description,
          type: req.body.type,
          name: req.body.name,
          response_frequency: req.body.response_frequency,
          submission_day: req.body.submission_day,
          element_dummy: "",
          assign_dummy: "",
        },
        {
          where: { id: req.body.id },
        }
      );

      await auditCreate.create({
        user_id: req.userId,
        table_name: "admin_activities",
        primary_id: req.body.id,
        event: "update",
        new_value: req.body, //req.body data too long error
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });

      // ====maping===
 

      if (assign_element != undefined && assign_element.length > 0) {
        await updateElementAdmin(assign_element, req.body.id, req);
      }
 

      if (remove_assign_id != undefined && remove_assign_id.length > 0) {
        await db.activity_elements.destroy({
          where: {
            admin_activity_id: req.body.id,
            id: {
              [Op.in]: remove_assign_id,
            },
          },
        });
      }

      // =============
      if (
        req.body.remove_substandard_ids != undefined &&
        req.body.remove_substandard_ids.length > 0
      ) {
        await db.activity_mapping.destroy({
          where: {
            admin_activity_id: req.body.id,
            id: {
              [Op.in]: remove_substandard_ids,
            },
          },
        });
      }

      if (
        req.body.substandard_id != undefined &&
        req.body.substandard_id.length > 0
      ) {
        await helper.activitySessionMappingInsert(req, req.body.id, 1);
        let substandard_ids = req.body.substandard_id.filter(
          (el) => el.mapping_id == null
        );
        substandard_ids = req.body.substandard_id.map((sub) => sub.id);
        key = 0;
        insertActivityList = [];
        for (const sub_id of substandard_ids) {
          finaldata = await db.sequelize.query(
            `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          var find = await db.activity_mapping.findAll({
            where: {
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              admin_activity_id: req.body.id,
            },
          });

          if (find.length == 0) {
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
                  finaldata[0].libraryId
              )
              .digest("hex");

            insertActivityList.push({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              admin_activity_id: req.body.id,
              status: master.status.active,
              organization_id: org_id,
            });

            /*  db.activity_mapping
            .create({
              id: admin_activity_id_mapping,
              library_id: finaldata[0].library_id,
              chapter_id: finaldata[0].chapter_id,
              standard_id: finaldata[0].standard_id,
              substandard_id: finaldata[0].id,
              admin_activity_id: req.body.id,
              status: master.status.active,
              organization_id: org_id,
            })
            .then((mappingdata) => {
              
              if (key + 1 == req.body.substandard_id.length) {
                res.send({message: "Activity Updated Successfully"});
              }
            })
            .catch((error) => {
              //console.log(error);
             logger.info("/error", error);
              db.admin_activities
                .destroy({
                  where: {
                    id: req.body.id,
                  },
                })
                .then((errordata) => res.send(error));
            }); */
          }

          key++;
        }

        console.log('insertActivityList',insertActivityList.length);
        db.activity_mapping.bulkCreate(insertActivityList).then((bulRes) => {
          return res.send({ message: "Activity Updated Successfully" });
        });
      } else {
        return res.send({ message: "Activity Updated Successfully" });
      }
    } else if (req.body.type == 2) {
      if (req.body.kpi == 0) {
        var codeValue = "Obs." + codeCreate + "." + code;
      } else {
        var codeValue = "Kpi." + codeCreate + "." + code;
      }
      db.admin_activities
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
            kpi_name: req.body.kpi_name,
            observation_name: req.body.observation_name,
            // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
            assign_dummy: "",
          },
          {
            where: { id: req.body.id },
          }
        )
        .then(async (data) => {
          if (req.body.substandard_id) {
            await helper.activitySessionMappingInsert(req, req.body.id, 1);

            await helper.updateSuperAdminSubstandard(req);

            if (
              req.body.remove_substandard_ids &&
              req.body.remove_substandard_ids != undefined &&
              req.body.remove_substandard_ids.length > 0
            ) {
              await db.activity_mapping.destroy({
                where: {
                  admin_activity_id: req.body.id,
                  id: {
                    [Op.in]: remove_substandard_ids,
                  },
                },
                //  logging: console.log,
              });
            }
          }

          if (req.role_id == 1) {
            await db.client_admin_datacollections.update(
              {
                admin_activity_id: data.id,
                type_of_number: req.body.type_of_number,
                target: req.body.target,
                client_id: req.body.client_id,
                organization_id: req.body.organization_id,
              },
              {
                where: {
                  admin_activity_id: req.body.id,
                  organization_id: req.body.organization_id,
                },
              }
            );
          } else {
            await db.client_admin_datacollections.update(
              {
                client_activity_id: data.id,
                type_of_number: req.body.type_of_number,
                target: req.body.target,
                client_id: req.body.client_id,
                organization_id: req.body.organization_id,
              },
              {
                where: {
                  client_activity_id: req.body.id,
                  organization_id: req.body.organization_id,
                },
              }
            );
          }

          res.send("updated");
          // db.activity_mapping.create({ //client_admin_datacollections while updation
          //   library_id: req.body.library_id, chapter_id: req.body.chapter_id, standard_id: req.body.standard_id, substandard_id: req.body.substandard_id, admin_activity_id: data.id,
          // }).then((mappingdata) => {
          //   auditCreate.create({ "user_id": req.userId, 'table_name': "admin_activities", 'primary_id': data.id, 'event': "create", 'new_value': mappingdata.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
          //   auditCreate.create({ "user_id": req.userId, 'table_name': "activity_mapping", 'primary_id': mappingdata.id, 'event': "create", 'new_value': mappingdata.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
          //   res.send(data);
          // }).catch((error) => {
          //   logger.info("/error", error);
          //   db.admin_activities.destroy({
          //     where: {
          //       id: data.id
          //     }
          //   }).then(errordata => res.send(error))
          // })
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    } else {
      var path = "";
      if (req.file) {
        path = req.file.destination + "/" + req.file.filename;
      }
      // console.log(req.body,111111111111)

      // if(req.file){

      // }else{

      // }
      // let upload = multer({ storage: storage, fileFilter: fileFilter }).single('file');
      var element = req.body;

      db.admin_activities
        .update(
          {
            code: "Doc." + codeCreate + "." + code,
            description: element.description,
            type: element.type,
            name: element.name,
            response_frequency:
              element.response_frequency != ""
                ? element.response_frequency
                : null,
            submission_day:
              element.submission_day != "" ? element.submission_day : null,
            document_name:
              element.document_name != "" ? element.document_name : null,
            document_link: path != "" ? path : null,
            expiry_days: element.expiry_days != "" ? element.expiry_days : null,
            // element_dummy: (req.body.element_dummy == '') ? null : JSON.stringify(JSON.stringify(req.body.element_dummy)),
            assign_dummy: "",
          },
          {
            where: { id: req.body.id },
          }
        )
        .then(async (data) => {
          if (req.body.substandard_id.length > 0) {
            await helper.activitySessionMappingInsert(req, req.body.id, 1);
            // let substandard_ids = req.body.substandard_id.map((sub) => sub.id);
            await helper.updateSuperAdminSubstandard(req);

            if (
              req.body.remove_substandard_ids &&
              req.body.remove_substandard_ids != undefined &&
              req.body.remove_substandard_ids.length > 0
            ) {
              await db.activity_mapping.destroy({
                where: {
                  admin_activity_id: req.body.id,
                  id: {
                    [Op.in]: remove_substandard_ids,
                  },
                },
                //  logging: console.log,
              });
            }

            return res.send("updated");

            /* substandard_ids.forEach((sub_id, key) => {
              if (sub_id != "" && sub_id != 0) {
                db.sequelize
                  .query(
                    `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                    {
                      type: db.sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then((finaldata) => {
                    //console.log(finaldata);
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
                          finaldata[0].libraryId
                      )
                      .digest("hex");

                    /*
                      db.activity_mapping
                      .create({
                        id: admin_activity_id_mapping,
                        library_id: finaldata[0].library_id,
                        chapter_id: finaldata[0].chapter_id,
                        standard_id: finaldata[0].standard_id,
                        substandard_id: finaldata[0].id,
                        admin_activity_id: data.id,
                        status: master.status.active,
                        organization_id: org_id,
                      })
                       */
            /*
                    db.activity_mapping
                      .findAll({
                        where: {
                          id: admin_activity_id_mapping,
                          library_id: finaldata[0].library_id,
                          chapter_id: finaldata[0].chapter_id,
                          standard_id: finaldata[0].standard_id,
                          substandard_id: finaldata[0].id,
                        },
                      })
                      .then((countRes) => {
                        console.log(countRes.length == 0);
                        if (countRes.length == 0) {
                          db.activity_mapping
                            .create({
                              id: admin_activity_id_mapping,
                              library_id: finaldata[0].library_id,
                              chapter_id: finaldata[0].chapter_id,
                              standard_id: finaldata[0].standard_id,
                              substandard_id: finaldata[0].id,
                              admin_activity_id: req.body.id,
                              status: master.status.active,
                              organization_id: org_id,
                            })
                            .then((mappingdata) => {
                              auditCreate.create({
                                user_id: req.userId,
                                table_name: "admin_activities",
                                primary_id: req.body.id,
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
                            })
                            .catch((error) => {
                              console.log(error);
                              // logger.info("/error", error);
                              db.admin_activities
                                .destroy({
                                  where: {
                                    id: req.body.id,
                                  },
                                })
                                .then((errordata) => res.send(error));
                            });
                        }

                        if (key + 1 == req.body.substandard_id.length) {
                          return res.send({
                            message: "Activity Created Successfully",
                          });
                        }
                      });
                  })
                  .catch((error) => {
                    console.log(error);
                    logger.info("/error", error);
                    db.admin_activities
                      .destroy({
                        where: {
                          id: req.body.id,
                        },
                      })
                      .then((errordata) => res.send(error));
                  });
              }
              if (key + 1 == req.body.substandard_id.length) {
                return res.send("updated");
              }
            });  */
          } else {
            return res.send("updated");
          }
        })
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
          res.send(error);
        });
    }
  } catch (error) {
    console.log(error);
    logger.info("/error", error);
    res.send(error);
  }
};
exports.get = async (req, res) => {
  try {
    await db.admin_activities
      .findAll({
        attributes: ["id", "name"],
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        order: [["id", "DESC"]],
      })
      .then(async (data) => {
        if (data.length > 0) {
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            var datas = await db.activity_mapping.findAll({
              attributes: ["substandard_id"],
              where: { admin_activity_id: element.id },
            });
            data[index].dataValues.mapping = datas;
            if (data.length == index + 1) {
              res.send(data);
            }
          }
        } else {
          res.send(data);
        }
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

exports.getById = async (req, res) => {
  try {
    let activity = await db.admin_activities.findAll({
      where: { id: req.params.id },
    });
    //console.log(activity[0].dataValues.id);

    if (activity[0].dataValues.type == 1) {
      // var element =
      /* await db.activity_elements
        .findAll({
          where: { admin_activity_id: req.params.id },
        })
        .then((actEl) => {
         // console.log(actEl.length);
          activity[0].dataValues.elements = actEl;
          activity[0].dataValues.assign_element = actEl;
        }); */

      let actEl = await db.activity_elements.findAll({
        where: { admin_activity_id: req.params.id },
      });
      let idxel = 0;
      for (const element of actEl) {
        let substd = await db.sequelize.query(
          `select standard_id,chapter_id,A.name from sub_standards as A left join standards as B on A.standard_id=B.id 
           where A.substandard_uid="${element.substandard_id}"`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (actEl[idxel] && substd[0]) {
          actEl[idxel].dataValues.standard_id = substd[0].standard_id;
          actEl[idxel].dataValues.chapter_id = substd[0].chapter_id;
          actEl[idxel].dataValues.substandard_name = substd[0].name;
        }

        idxel++;
      }

      activity[0].dataValues.elements = actEl;
      activity[0].dataValues.assign_element = actEl;
    }

    if (req.role_id == 1 || req.role_id == 2 || req.role_id == 3) {
      orgwhere = "";
      if (req.role_id == 2) {
        orgwhere = `and (organization_id=0 || organization_id='${req.organization_id}')`;
      }

      var assign = await db.sequelize.query(
        `select activity_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc,sub_standards.session_class_id from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id where admin_activity_id='${req.params.id}' `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      var datacoll = await db.sequelize.query(
        `select * from client_admin_datacollections where admin_activity_id='${req.params.id}' ${orgwhere}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      var assign = await db.sequelize.query(
        `select * from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      var datacoll = await db.sequelize.query(
        `select * from client_admin_datacollections where admin_activity_id='${req.params.id}' and organization_id=${req.organization_id}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    }

    activity[0].dataValues.assign = assign;
    activity[0].dataValues.admin_activity_id = activity[0].dataValues.id;
    activity[0].dataValues.client_activity_id = null;
    if (datacoll && datacoll.length > 0) {
      activity[0].dataValues.target = datacoll[0].target;
      activity[0].dataValues.type_of_number = datacoll[0].type_of_number;
    }
    res.send(activity);
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.getActivityList = async(req,res) => {
  let activities = await db.sequelize.query(`select  B.* from activity_mapping as A inner join admin_activities as B on A.admin_activity_id = B.id && A.library_id=1008 group by admin_activity_id order by name`, {
    type : db.sequelize.QueryTypes.SELECT
  });

  activities = activities.map((el,idx)=> ({
    name : idx+1+' '+el.name
  }))
  res.send(activities)
}

exports.getById_updator = async (req, res) => {
  try {
    var activity = await db.admin_activities.findAll({
      where: { id: req.params.id },
    });
    //console.log(activity[0].dataValues.id);

    if (activity[0].dataValues.type == 1) {
      // var element =
      await db.activity_elements
        .findAll({
          where: { admin_activity_id: req.params.id },
        })
        .then((actEl) => {
          activity[0].dataValues.elements = actEl;
          activity[0].dataValues.assign_element = actEl;
        });
    }
    var assign = await db.activity_mapping.findAll({
      where: { admin_activity_id: req.params.id },
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
    activity[0].dataValues.assign = [];
    activity[0].dataValues.admin_activity_id = activity[0].dataValues.id;
    activity[0].dataValues.client_activity_id = null;

    res.send(activity);
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.delete = async (req, res) => {
  //db.admin_activities.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.admin_activities
      .update(
        {
          status: master.status.delete,
        },
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "admin_activities",
          primary_id: data.id,
          event: "status change",
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
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.statusChange = async (req, res) => {
  try {
    db.admin_activities
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
          table_name: "admin_activities",
          primary_id: data.id,
          event: "status change",
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

exports.getByIdCommon = async (req, res) => {
  //console.log(req.query.type);
  var whereval = {};
  if (req.query.type == "library") {
    whereval = { library_id: req.query.id };
  } else if (req.query.type == "standard") {
    whereval = { standard_id: req.query.id };
  } else if (req.query.type == "substandard") {
    whereval = { substandard_id: req.query.id };
  } else if (req.query.type == "chapter") {
    whereval = { chapter_id: req.query.id };
  } else if (req.query.type == "activity") {
    whereval = { admin_activity_id: req.query.id };
  }

  if(req.role_id==1) {
    whereval.organization_id = 0;
  }

  if (req.query.limit) {
    db.admin_activities
      .findAll({
        limit: parseInt(req.query.limit),
        order: [["createdAt", "DESC"]],
        where: { status: { [Op.notIn]: [master.status.delete] } },
        include: [
          {
            model: db.activity_mapping,
            where: whereval,
          },
        ],
        group: ["id"],
        raw: true,
      })
      .then(async (data) => {
        if (data[0].type == 1) {
          var element = await db.activity_elements.findAll({
            where: { admin_activity_id: data[0].id },
          });
          data[0].elements = element;
          data[0].assign_element = element;
        }
        var assign = await db.activity_mapping.findAll({
          where: { admin_activity_id: data[0].id },
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
        data[0].assign = assign;

        data = data.map(el =>  {
          //return {...el,sortItem : el.name}
         if(el.type==1) {
            return {...el,sortItem : el.name}
          }
      
          if(el.type==2) {
            if(el.kpi==1) {
              return {...el,sortItem : el.kpi_name}
            } else {          
              return {...el,sortItem : el.observation_name}
            }
          }
      
          if(el.type==3) {
            return {...el,sortItem : el.document_name}
          }   
         
        })
      
        data.sort(helper.compare);

        // console.log(data.map(el=>el.sortItem));

        res.send(data);
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  } else {
    db.activity_mapping
      .findAll({
        where: whereval,
        order: [["createdAt", "DESC"]],
        attributes: [
          "admin_activities.*",
          "activity_mapping.admin_activity_id",
          "activity_mapping.client_activity_id",
          "activity_mapping.createdAt",
        ],
        include: [
          {
            model: db.admin_activities,
            as: "admin_activities",
            where: { status: { [Op.notIn]: [master.status.delete] } },
            attributes: [],
            nested: false,
            required: true,
          },
        ],
        group: [
          "id",
          "activity_mapping.admin_activity_id",
          "activity_mapping.client_activity_id",
          //"activity_mapping.createdAt",
        ],
        raw: true,
        logging : true
      })
      .then(async (data) => {
        //console.log(data.length);
        if (data[0].type == 1) {
          var element = await db.activity_elements.findAll({
            where: { admin_activity_id: data[0].id },
          });
          data[0].element_dummy = element;
          data[0].elements = element;
          data[0].assign_element = element;
        }
        var assign = await db.activity_mapping.findAll({
          where: { admin_activity_id: data[0].id },
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
        data[0].assign = assign;
        data[0].assign_dummy = assign;
        data[0].admin_activity_id = data[0].id;
        data[0].client_activity_id = null;

        data = data.map(el =>  {
          // return {...el,sortItem : el.name}
           if(el.type==1) {
            return {...el,sortItem : el.name}
          }
      
          if(el.type==2) {
            if(el.kpi==1) {
              return {...el,sortItem : el.kpi_name}
            } else {          
              return {...el,sortItem : el.observation_name}
            }
          }
      
          if(el.type==3) {
            return {...el,sortItem : el.document_name}
          }     
         
        })
      
        data.sort(helper.compare); 
        res.send(data);
      })
      .catch((error) => {
        console.log(error);
        logger.info("/error", error);
        res.send(error);
      });
  }
};
exports.clientgetByIdCommon = async (req, res) => {
  var where = {};

  if (req.query.type == "library") {
    where = {
      library_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [0, req.organization_id] },
    };
  } else if (req.query.type == "standard") {
    where = {
      standard_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [0, req.organization_id] },
    };
  } else if (req.query.type == "substandard") {
    where = {
      substandard_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [0, req.organization_id] },
    };
  } else if (req.query.type == "chapter") {
    where = {
      chapter_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [0, req.organization_id] },
    };
  } else if (req.query.type == "activity") {
    where = {
      admin_activity_id: req.query.id,
      organization_id: { [Op.in]: [0, req.organization_id] },
    };
  }

  var admin = await db.activity_mapping.findAll({
    where: where,
    logging: console.log,
    attributes: [
      "admin_activities.*",
      "activity_mapping.admin_activity_id",
      [
        db.sequelize.fn(
          "GROUP_CONCAT",
          db.sequelize.col("activity_mapping.substandard_id")
        ),
        "substandard_id",
      ],
      [
        db.sequelize.fn(
          "GROUP_CONCAT",
          db.sequelize.col("activity_mapping.standard_id")
        ),
        "standard_id",
      ],
    ],
    include: [
      {
        model: db.admin_activities,
        as: "admin_activities",
        where: {
          status: {
            [Op.notIn]: [master.status.delete],
          },
        },
        attributes: [],
        nested: false,
        required: true,
      },
      {
        model: db.client_admin_datacollections,
        as: "clientAdminDatacollections",
        attributes: [],
        nested: false,
      },
    ],
    group: ["admin_activities.id"],
    raw: true,
  });

  let custom_activities = [];
  for (let index = 0; index < admin.length; index++) {
    custom_activities.push(admin[index].id);
  }
  // console.log(custom_activities);

  if (admin.length > 0) {
    var client_activity = await db.activities_organization.findAll({
      where: {
        admin_activity_id: { [Op.in]: [custom_activities] },
        organization_id: req.organization_id,
      },
      logging: console.log,
    });

    /* admin.map((x) =>
      Object.assign(
        x,
        client_activity.find((y) => y.id === x.id)
      )
    );*/

    admin.map((x) => {
      zz = client_activity.find((y) => {
        return y.admin_activity_id === x.admin_activity_id;
      });
      if (zz) {
        delete zz.dataValues["id"];
        Object.assign(x, zz.dataValues);
      }
    });

    var datacollectionAct = await db.client_admin_datacollections.findAll({
      where: {
        admin_activity_id: { [Op.in]: [custom_activities] },
        organization_id: req.organization_id,
      },
      logging: console.log,
    });

    admin.map((x) => {
      zz = datacollectionAct.find((y) => {
        return y.admin_activity_id === x.admin_activity_id;
      });

      if (zz) {
        delete zz.dataValues["id"];
        Object.assign(x, zz.dataValues);
      }
    });
  }

  for (let index = 0; index < admin.length; index++) {
    if (admin[index].type === 1) {
      if (req.role_id == 1) {
        sqlAssignedEl = `select act.*, sub.standard_id,name as substandardname from activity_elements act LEFT JOIN  sub_standards sub on sub.id=act.substandard_id where act.admin_activity_id='${admin[index].id}' AND organization_id is null `;
      } else {
        sqlAssignedEl = `select act.*, sub.standard_id,name as substandardname from activity_elements act LEFT JOIN  sub_standards sub on sub.id=act.substandard_id where act.admin_activity_id='${admin[index].id}' AND (organization_id is null or organization_id=${req.organization_id} ) `;
      }

      var element = await db.sequelize.query(sqlAssignedEl, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      admin[index].elements = element;
      admin[index].assign_element = element;
    }
  }
  /*
    if (client_activity && client_activity.length > 0) {
    for (let index = 0; index < client_activity.length; index++) {
      admin[index].response_frequency =
        client_activity[0].dataValues.response_frequency;
      admin[index].submission_day =
        client_activity[0].dataValues.submission_day;
      admin[index].kpi = client_activity[0].dataValues.kpi;
      admin[index].kpi_name = client_activity[0].dataValues.kpi_name;
      admin[index].type_of_measure =
        client_activity[0].dataValues.type_of_measure;
      admin[index].aggregation_type =
        client_activity[0].dataValues.aggregation_type;
      admin[index].observation_name =
        client_activity[0].dataValues.observation_name;
      admin[index].observation_type =
        client_activity[0].dataValues.observation_type;
      admin[index].currency_type = client_activity[0].dataValues.currency_type;
      admin[index].document_name = client_activity[0].dataValues.document_name;
      admin[index].document_description =
        client_activity[0].dataValues.document_description;
      admin[index].document_link = client_activity[0].dataValues.document_link;
      admin[index].expiry_days = client_activity[0].dataValues.expiry_days;
    }
  }
  */

  if (req.query.type == "library") {
    clientwhere = {
      library_id: req.query.id,
      client_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [req.organization_id, 0] },
    };
  } else if (req.query.type == "standard") {
    clientwhere = {
      standard_id: req.query.id,
      client_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [req.organization_id, 0] },
    };
  } else if (req.query.type == "substandard") {
    clientwhere = {
      substandard_id: req.query.id,
      client_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [req.organization_id, 0] },
    };
  } else if (req.query.type == "chapter") {
    clientwhere = {
      chapter_id: req.query.id,
      client_activity_id: { [Op.ne]: null },
      organization_id: { [Op.in]: [req.organization_id, 0] },
    };
  } else if (req.query.type == "activity") {
    clientwhere = {
      client_activity_id: req.query.id,
    };
  } else {
    clientwhere = {};
  }

  if (req.headers["organization"]) {
    clientwhere.organization_id = req.headers["organization"];
  }

  clientActwhere = {
    status: {
      [Op.notIn]: [master.status.delete],
    },
  };

  if (req.role_id == 2 || req.role_id == 3) {
    clientActwhere.createdby = req.userId;
  }

  clientadmin = [];

  var clientadmin = await db.activity_mapping.findAll({
    where: clientwhere,
    attributes: [
      "activity_mapping.client_activity_id",
      "client_activities.*",
      "clientAdminDatacollections.target",
      "clientAdminDatacollections.totarget",
      "clientAdminDatacollections.type_of_number",
      [
        db.sequelize.fn(
          "GROUP_CONCAT",
          db.sequelize.col("activity_mapping.substandard_id")
        ),
        "substandard_id",
      ],
      //"clientAdminDatacollections.*",
    ],
    include: [
      {
        model: db.client_admin_activities,
        as: "client_activities",
        where: clientActwhere,
        attributes: [],
        nested: false,
        required: true,
      },
      {
        model: db.client_admin_datacollections,
        as: "clientAdminDatacollections",
        attributes: [],
        nested: false,
      },
      // {
      //   model: db.client_admin_datacollections,
      //   as: "clientAdminDatacollections",
      //   attributes: [],
      //   nested: false,
      //   required: true,
      // },
    ],
    group: ["client_activities.id"],
    raw: true,
  });

  for (let index = 0; index < clientadmin.length; index++) {
    if (clientadmin[index].type === 1) {
      if (req.role_id == 1) {
        sqlAssignedEl = `select act.*, sub.standard_id,name as substandardname from activity_elements act LEFT JOIN  sub_standards sub on sub.id=act.substandard_id where act.client_activity_id=${clientadmin[index].id} AND organization_id is null `;
      } else {
        sqlAssignedEl = `select act.*, sub.standard_id,name as substandardname from activity_elements act LEFT JOIN  sub_standards sub on sub.id=act.substandard_id where act.client_activity_id=${clientadmin[index].id} AND (organization_id=${req.organization_id}  or organization_id is null )`;
      }

      var element = await db.sequelize.query(sqlAssignedEl, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      clientadmin[index].elements = element;
      clientadmin[index].assign_element = element;
    }
  }
  let final = clientadmin.concat(admin);

  let idx = 0;
  for (const element of final) {
    // console.log(element.substandard_id);
    substandard = element.substandard_id;
    if (substandard && substandard.includes(",")) {
      temp = substandard.split(",");
      var quotedAndCommaSeparated = "'" + temp.join("','") + "'";

      sql = `select id,code,name from sub_standards where id in (${quotedAndCommaSeparated})`;
    } else {
      sql = `select id,code,name from sub_standards where id='${substandard}'`;
    }

    substndards = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    final[idx].substandrds = substndards;
    //console.log(substndards);
    idx++;
  }

  final = final.map(el =>  {
    return {...el,sortItem : el.name}
  /*  if(el.type==1) {
      return {...el,sortItem : el.name}
    }

    if(el.type==2) {
      if(el.kpi==1) {
        return {...el,sortItem : el.kpi_name}
      } else {          
        return {...el,sortItem : el.observation_name}
      }
    }

    if(el.type==3) {
      return {...el,sortItem : el.document_name}
    } */   
   
  })

  final.sort(helper.compare);

  res.send(final);
};
