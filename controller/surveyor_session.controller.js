const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
const e = require("express");
const helper = require("../util/helper")
exports.create = async (req, res) => {
  try {
    var get = await db.surveyor_session.count({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
  } catch (error) {
    logger.info("Error Count", error);
    res.send(error);
  }
  var code = "SES" + (parseInt(get) + 1);
  var session_class_uniq = crypto
    .createHash("sha256")
    .update(code + "_" + req.body.name)
    .digest("hex");
  db.surveyor_session
    .create(
      {
        id: session_class_uniq,
        code: code,
        name: req.body.name,
        user_id: req.body.user_id,
        library_id: req.body.library_id,
        category_id: req.body.category_id !== "" ? req.body.category_id : null,
        class_id: req.body.class_id !== "" ? req.body.class_id : null,
        //  category_id: category_id,
        // class_id: class_id,
        date: req.body.date,
        to_date: req.body.to_date,
        from_time: req.body.from_time,
        to_time: req.body.to_time,
        survey_status: master.status.active,
        status: master.status.active,
        client_id: req.body.client_id,
      },
      { logging: true }
    )
    .then(async (data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "surveyor_session",
        primary_id: data.id,
        event: "create",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });


       await helper.addNewSessionNotificationSurveyor(req, req.body.class_id,req.body.user_id);
      //res.send(data)
      //res.send("added")
    })
    .catch((error) => {
      logger.info("Error Create", error);
      res.send(error);
    });

  res.send("added");
};
exports.update = async (req, res) => {
  try {
    db.surveyor_session
      .update(
        {
          name: req.body.name,
          user_id: req.body.user_id,
          category_id: req.body.category_id != "" ? req.body.category_id : null,
          class_id: req.body.class_id != "" ? req.body.class_id : null,
          date: req.body.date,
          to_date: req.body.to_date,
          from_time: req.body.from_time,
          to_time: req.body.to_time,
          survey_status: req.body.survey_status,
          client_id: req.body.client_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "surveyor_session",
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
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  try {
    db.surveyor_session
      .findAll({
        include: [
          {
            model: db.users,
            as: "userdetails",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            where: where,
          },
        ],
        where: { status: { [Op.notIn]: [master.status.delete] } },
        order: [["createdAt", "DESC"]],
      })
      .then(async (data) => {
        var survey_category = [];
        var session = [];
        if (data && data.length > 0) {
          for (let index = 0; index < data.length; index++) {
            if (
              data[index].dataValues.category_id &&
              data[index].dataValues.category_id.includes(",")
            ) {
              temp = data[index].dataValues.category_id.split(",");
              var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
              let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
              // console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.category_id) {
              let query = `select * from surveyor_categories where id in ('${data[index].dataValues.category_id}')`;
              //  console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            if (
              data[index].dataValues.class_id &&
              data[index].dataValues.class_id.includes(",")
            ) {
              sessiontemp = data[index].dataValues.class_id.split(",");
              var sessioninlist = "'" + sessiontemp.join("','") + "'";
              let query = `select *,(select category_name from surveyor_categories where id=session_classes.surveyor_category_id) as catname 
               from session_classes where id in (${sessioninlist})`;
              //console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.class_id) {
              let query = `select *,(select category_name from surveyor_categories where id=session_classes.surveyor_category_id) as catname 
              from session_classes where id in ('${data[index].dataValues.class_id}')`;
              // console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            data[index].dataValues.categorydetails = survey_category;
            data[index].dataValues.classdetails = session;
          }
        }
        res.send(data);
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
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  try {
    db.surveyor_session
      .findAll({
        include: [
          {
            model: db.users,
            as: "userdetails",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            where: where,
          },
        ],
        where: {
          id: req.params.id,
        },
      })
      .then(async (data) => {
        var survey_category = [];
        var session = [];
        if (data && data.length > 0) {
          for (let index = 0; index < data.length; index++) {
            if (
              data[index].dataValues.category_id &&
              data[index].dataValues.category_id.includes(",")
            ) {
              temp = data[index].dataValues.category_id.split(",");
              var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
              let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.category_id) {
              let query = `select * from surveyor_categories where id in ('${data[index].dataValues.category_id}')`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            if (
              data[index].dataValues.class_id &&
              data[index].dataValues.class_id.includes(",")
            ) {
              sessiontemp = data[index].dataValues.class_id.split(",");
              var sessioninlist = "'" + sessiontemp.join("','") + "'";
              let query = `select * from session_classes where id in (${sessioninlist})`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.class_id) {
              let query = `select * from session_classes where id in ('${data[index].dataValues.class_id}')`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            data[index].dataValues.categorydetails = survey_category;
            data[index].dataValues.classdetails = session;
          }
        }
        res.send(data);
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
exports.delete = async (req, res) => {
  console.log("h");
  //db.surveyor_session.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.surveyor_session
      .destroy({
        where: { id: req.params.id },
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "surveyor_session",
          primary_id: data.id,
          event: "delete",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("deleted");
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
    db.surveyor_session
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
          table_name: "surveyor_session",
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

exports.surveyor_list = async (req, res) => {
  var where = {
    role_id: master.role.surveyor,
    status: { [Op.notIn]: [master.status.delete] },
  };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  try {
    let userList = await db.users.findAll({
      include: [
        { model: db.organizations, as: "parentOrganizationJoin" },
        { model: db.organizations, as: "organizationJoin" },
        { model: db.property_mapping, as: "property_mapping" }, // property mapping
      ],
      where: where,
      attributes: {
        exclude: ["password", "temporary_password", "jwt", "otp"],
      },
      order: [["id", "DESC"]],
      group: ["users.id"],
    });

    if (userList.length > 0) {
      let index = 0;
      for (const user of userList) {
        let survey_category = [];
        let session = [];
        // console.log(user.surveyor_category);
        if (user.surveyor_category && user.surveyor_category.includes(",")) {
          let temp = user.surveyor_category.split(",");
          let quotedAndCommaSeparated = "'" + temp.join("','") + "'";
          let query = `select A.*,B.name as library_name from surveyor_categories as A left join libraries as B on A.library_id=B.id where A.id in (${quotedAndCommaSeparated})`;
          // console.log(query);
          survey_category = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
          });
        } else if (user.surveyor_category) {
          let query = `select A.*,B.name as library_name from surveyor_categories as A left join libraries as B on A.library_id=B.id where A.id = '${user.surveyor_category}'`;
          survey_category = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
          });
        }

        //console.log(survey_category);

        if (user.surveyor_session && user.surveyor_session.includes(",")) {
          let sessiontemp = user.surveyor_session.split(",");
          var sessioninlist = "'" + sessiontemp.join("','") + "'";
          let query = `select * from session_classes where id in (${sessioninlist})`;
          session = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
          });
        } else if (user.surveyor_session) {
          let query = `select * from session_classes where id = '${user.surveyor_session}'`;
          session = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
          });
        }

        if (user.property_mapping) {
          let propIdx = 0;
          for (const propEl of user.property_mapping) {
            let substandards = await db.sequelize.query(
              `select name,code from sub_standards where id='${propEl.substandard_id}'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (substandards.length > 0) {
              user.property_mapping[propIdx].dataValues.substandardName =
                substandards[0].name;
              user.property_mapping[propIdx].dataValues.substandardCode =
                substandards[0].code;
            } else {
              user.property_mapping[propIdx].dataValues.substandardName = null;
              user.property_mapping[propIdx].dataValues.substandardCode = null;
            }
            propIdx++;
            //console.log(substandards);
          }
        }

        // userList[index].dataValues.property_mapping[0].substandardName =
        //   "zzzzz";

        userList[index].dataValues.categorydetailsJoin = survey_category;
        userList[index].dataValues.classdetailsJoin = session;
        userList[index].dataValues.surveyor_type =
          +userList[index].dataValues.surveyor_type;

        if (userList.length == index + 1) {
          res.send(userList);
        }
        index++;
      }
    } else {
      res.status(200).send(userList);
    }

    /*

    Asynchronous issue callback
    db.users
      .findAll({
        include: [
          /*  {
            model: db.session_classes,
            as: "classdetailsJoin",

            include: [
              {
                model: db.libraries,
                as: "librarydetails",
              },
            ],
          },
          { model: db.surveyor_categories, as: "categorydetailsJoin" }, 
          { model: db.organizations, as: "parentOrganizationJoin" },
          { model: db.organizations, as: "organizationJoin" },
          { model: db.property_mapping, as: "property_mapping" }, // property mapping
        ],
        where: where,
        attributes: {
          exclude: ["password", "temporary_password", "jwt", "otp"],
        },
        order: [["id", "DESC"]],
      })
      .then(async (data) => {
        var survey_category = [];
        var session = [];
        if (data && data.length > 0) {
          for (let index = 0; index < data.length; index++) {
            console.log(data[index].dataValues.surveyor_category);
            if (
              data[index].dataValues.surveyor_category &&
              data[index].dataValues.surveyor_category.includes(",")
            ) {
              temp = data[index].dataValues.surveyor_category.split(",");
              var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
              let query = `select A.*,B.name as library_name from surveyor_categories as A left join libraries as B on A.library_id=B.id where A.id in (${quotedAndCommaSeparated})`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.surveyor_category) {
              // survey_category.push(data[index].dataValues.surveyor_category);
              let query = `select A.*,B.name as library_name from surveyor_categories as A left join libraries as B on A.library_id=B.id where A.id = '${data[index].dataValues.surveyor_category}'`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
              //console.log(survey_category);
            }

            if (
              data[index].dataValues.surveyor_session &&
              data[index].dataValues.surveyor_session.includes(",")
            ) {
              sessiontemp = data[index].dataValues.surveyor_session.split(",");
              var sessioninlist = "'" + sessiontemp.join("','") + "'";
              let query = `select * from session_classes where id in (${sessioninlist})`;
              //console.log(query)
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.surveyor_session) {
              //session.push(data[index].dataValues.surveyor_session);
              let query = `select * from session_classes where id = '${data[index].dataValues.surveyor_session}'`;
              //console.log(query)
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            data[index].dataValues.categorydetailsJoin = survey_category;
            data[index].dataValues.classdetailsJoin = session;
          }
        }

        //for (var i = 0; i < 2; i++) //length shoud me data.length

        for (var i = 0; i < data.length; i++) {
          //console.log(data[i].dataValues);
          data[i].dataValues.surveyor_type = +data[i].dataValues.surveyor_type;
        }
        res.send(data);
      });  */
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.surveyor_list2 = async (req, res) => {
  var where = {
    role_id: master.role.surveyor,
    status: { [Op.notIn]: [master.status.delete] },
  };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  try {
    db.users
      .findAll({
        include: [
          {
            model: db.session_classes,
            as: "classdetailsJoin",

            include: [
              {
                model: db.libraries,
                as: "librarydetails",
              },
            ],
          },
          { model: db.surveyor_categories, as: "categorydetailsJoin" },
          { model: db.organizations, as: "parentOrganizationJoin" },
          { model: db.organizations, as: "organizationJoin" },
        ],
        where: where,
        attributes: {
          exclude: ["password", "temporary_password", "jwt", "otp"],
        },
        order: [["id", "DESC"]],
      })
      .then((data) => {
        for (var i = 0; i < 2; i++) {
          //console.log(data[i].dataValues);
          data[i].dataValues.surveyor_type = +data[i].dataValues.surveyor_type;
        }
        res.send(data);
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

exports.userSession = async (req, res) => {
 // console.log(req.userId);
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  try {
    db.surveyor_session
      .findAll({
        include: [
          {
            model: db.users,
            as: "userdetails",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            where: where,
          },
        ],
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          user_id: req.userId,
        },
        order: [["id", "DESC"]],
      })
      .then(async (data) => {
        //  console.log(data);
        let survey_category = [];
        let session = [];
        if (data && data.length > 0) {
          //  console.log(data.length);
          for (let index = 0; index < data.length; index++) {
            if (
              data[index].dataValues.category_id &&
              data[index].dataValues.category_id.includes(",")
            ) {
              temp = data[index].dataValues.category_id.split(",");
              let quotedAndCommaSeparated = "'" + temp.join("','") + "'";
              let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
              //  console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.category_id) {
              let query = `select * from surveyor_categories where id in ('${data[index].dataValues.category_id}')`;
              //  console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            if (
              data[index].dataValues.class_id &&
              data[index].dataValues.class_id.includes(",")
            ) {
              sessiontemp = data[index].dataValues.class_id.split(",");
              let sessioninlist = "'" + sessiontemp.join("','") + "'";
              let query = `select * from session_classes where id in (${sessioninlist})`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.class_id) {
              let query = `select * from session_classes where id in ('${data[index].dataValues.class_id}')`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            data[index].dataValues.categorydetails = survey_category;
            data[index].dataValues.classdetails = session;

            //console.log(data[index].dataValues.class_id);
            let survey_status = 1;
            let statusCond =
              "ROUND(avg(IFNULL(external_surveyor_score,null)/2)*100) as  surveyor_score ";

            if (data[index].dataValues.userdetails.surveyor_type == 1) {
              statusCond =
                "ROUND(avg(IFNULL(internal_surveyor_score,null)/2)*100) as surveyor_score";
            }

            /*  console.log(`select sub.id,sub.name,sub.code,sub.description,${statusCond}
            from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id
            LEFT JOIN score_mapping score on sub.id = score.substanard_id and
            score.organization_id=${req.organization_id}
            where pm.user_id=${data[index].dataValues.userdetails.id} and pm.organization_id=${req.organization_id} and sub.status not in (2) and pm.library_id=${data[index].dataValues.library_id}  and sub.session_class_id like '%${data[index].dataValues.class_id}%'       
            group by sub.id`); */

            const substandardScores = await db.sequelize.query(
              `select sub.id,sub.name,sub.code,sub.description,${statusCond}
           from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id
           LEFT JOIN score_mapping score on sub.id = score.substanard_id and
           score.organization_id=${req.organization_id}
           where pm.user_id=${data[index].dataValues.userdetails.id} and pm.organization_id=${req.organization_id} and sub.status not in (2) and pm.library_id=${data[index].dataValues.library_id}  and sub.session_class_id like '%${data[index].dataValues.class_id}%'       
           group by sub.id`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            for (const element of substandardScores) {
              if (!element.surveyor_score) {
                survey_status = 0;
              }
            }

            data[index].dataValues.status = survey_status;
          }
        }
        res.send(data);
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

exports.userSessionGetById = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }
  try {
    db.surveyor_session
      .findAll({
        include: [
          {
            model: db.users,
            as: "userdetails",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            where: where,
          },
          /*  {
            model: db.session_classes,
            as: "classdetails",
            include: [
              {
                model: db.libraries,
                as: "librarydetails",
              },
            ],
          },
          { model: db.surveyor_categories, as: "categorydetails" },*/
        ],
        where: {
          id: req.params.id,
        },
      })
      .then(async (data) => {
        var survey_category = [];
        var session = [];
        var libraryid = "";
        if (data && data.length > 0) {
          for (let index = 0; index < data.length; index++) {
            if (
              data[index].dataValues.category_id &&
              data[index].dataValues.category_id.includes(",")
            ) {
              temp = data[index].dataValues.category_id.split(",");
              var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
              let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.category_id) {
              let query = `select * from surveyor_categories where id in ('${data[index].dataValues.category_id}')`;
              console.log(query);
              survey_category = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            if (
              data[index].dataValues.class_id &&
              data[index].dataValues.class_id.includes(",")
            ) {
              sessiontemp = data[index].dataValues.class_id.split(",");
              var sessioninlist = "'" + sessiontemp.join("','") + "'";
              let query = `select * from session_classes where id in (${sessioninlist})`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            } else if (data[index].dataValues.class_id) {
              let query = `select * from session_classes where id in ('${data[index].dataValues.class_id}')`;
              console.log(query);
              session = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT,
              });
            }

            data[index].dataValues.categorydetails = survey_category;
            libraryid = survey_category[0].library_id;
            data[index].dataValues.classdetails = session;

            if (libraryid !== "") {
              let query = `select * from libraries where id in (${libraryid})`;
              console.log(query);
              data[index].dataValues.libraries = await db.sequelize.query(
                query,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );
            }
          }
        }
        res.send(data);
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

exports.userSessionLibrary = async (req, res) => {
  console.log(req.userId);
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  try {
    db.surveyor_session
      .findAll({
        include: [
          {
            model: db.users,
            as: "userdetails",
            attributes: {
              exclude: ["password", "temporary_password", "jwt", "otp"],
            },
            where: where,
          },
          {
            model: db.session_classes,
            as: "classdetails",
            include: [
              {
                model: db.libraries,
                as: "librarydetails",
              },
            ],
          },
          { model: db.surveyor_categories, as: "categorydetails" },
        ],
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          user_id: req.userId,
        },
        order: [["id", "DESC"]],
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

exports.surveyorESRfind = async (req, res) => {
  let org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }

  const surveyorUserDetail = await db.users.findOne({
    where : {
      id : req.userId
    }
  })

 

  let fromDate = req.body.from_date;
  let toDate = req.body.to_date;
  let dateFilter = '';
  let userRole = "Surveyor";

  if(fromDate && fromDate !="" && toDate && toDate !="") {
    if(surveyorUserDetail.surveyor_type ==1) {
      dateFilter = ` and date_format(internal_surveyor_assesment_date,"%Y-%-m-%d") between '${fromDate}' and '${toDate}'`;

    } else {
      dateFilter = ` and date_format(external_surveyor_assesment_date,"%Y-%-m-%d") between '${fromDate}' and '${toDate}' `;
    }
  }
  whereOrg = "";

  if (req.headers["organization"]) {
    whereOrg += ` A.organization_id='${req.headers["organization"]}'`;
  }

  if (userRole == "Surveyor") {
    whereUserRole =
      ` && (C.internal_surveyor_score is not null or C.external_surveyor_comment is not null) ${dateFilter}`;
  } else {
    whereUserRole = " && C.updator_score is not null";
  }

  query = `select (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id &&  ${whereOrg}  and user_id=${req.userId} && role_id=5          
  where  ${whereOrg} && B.esr=1) as total_esr, 
  (select count(*) from property_mapping as A left join sub_standards as B on  A.substandard_id = B.id  &&  ${whereOrg}  and user_id=${req.userId} && role_id=5          
  where  ${whereOrg} && B.esr !=1) as total_nonesr,    
   (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg}   and user_id=${req.userId} && role_id=5 
      left join score_mapping as C on C.substanard_id  =B.id 
      where  ${whereOrg} && B.esr=1 ${whereUserRole}) as total_esr_complete,
  (select count(*) from property_mapping  as A left join sub_standards as B on B.id=A.substandard_id &&  ${whereOrg}  and user_id=${req.userId} && role_id=5  
      left join score_mapping as C on C.substanard_id  =B.id 
      where  ${whereOrg} && B.esr !=1 ${whereUserRole}) as total_nonesr_complete     
  from score_mapping limit 1`;

  if (req.role_id == 2 || req.role_id == 3) {
    query = ` select 
    (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id  where A.esr=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} && status=1)) as total_esr,  
     (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id  where A.esr !=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} && status=1)) as total_nonesr,
     (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id left join score_mapping as C on C.substanard_id  =A.id  where A.esr=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} && status=1)  && C.updator_score is not null) as total_esr_complete,
      (select  count(distinct( A.id)) from sub_standards as A inner join activity_mapping as B on A.id = B.substandard_id && A.standard_id=B.standard_id left join score_mapping as C on C.substanard_id  =A.id  where A.esr !=1 && B.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} && status=1)  && C.updator_score is not null) as total_nonesr_complete`;
  }

  console.log(query);

  await db.sequelize
    .query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((esrData) => {
      if (esrData[0]) {
        total_esr = +esrData[0].total_esr;
        total_nonesr = +esrData[0].total_nonesr;
        totalSubstandard = total_esr + total_nonesr;
        total_esr_complete = +esrData[0].total_esr_complete;
        total_nonesr_complete = +esrData[0].total_nonesr_complete;
        total_esr_incomplete = total_esr - esrData[0].total_esr_complete;
        total_nonesr_incomplete =
          total_nonesr - esrData[0].total_nonesr_complete;

        if (totalSubstandard) {
          total_esr_per = (total_esr / totalSubstandard) * 100;
          total_nonesr_per = (total_nonesr / totalSubstandard) * 100;
        } else {
          total_esr_per = 0;
          total_nonesr_per = 0;
        }

        totalSubstandardComplete = total_esr_complete + total_nonesr_complete;
        if (total_esr) {
          total_esr_complete_per = (total_esr_complete / total_esr) * 100;
        } else total_esr_complete_per = 0;

        if (total_nonesr) {
          total_nonesr_complete_per =
            (total_nonesr_complete / total_nonesr) * 100;
        } else total_nonesr_complete_per = 0;

        totalSubstandardInComplete =
          total_esr_incomplete + total_nonesr_incomplete;

        console.log(total_esr_incomplete);

        if (totalSubstandardInComplete) {
          total_esr_incomplete_per = (total_esr_incomplete / total_esr) * 100;
          total_nonesr_incomplete_per =
            (total_nonesr_incomplete / total_nonesr) * 100;
        } else {
          total_esr_incomplete_per = 0;
          total_nonesr_incomplete_per = 0;
        }
        console.log(totalSubstandardInComplete);
        console.log(total_esr_incomplete_per);

        esrData[0].total_esr_incomplete = total_esr_incomplete;
        esrData[0].total_nonesr_incomplete = total_nonesr_incomplete;
        esrData[0].total_esr_per = total_esr_per.toFixed(2);
        esrData[0].total_nonesr_per = total_nonesr_per.toFixed(2);
        esrData[0].total_esr_complete_per = total_esr_complete_per.toFixed(2);
        esrData[0].total_nonesr_complete_per =
          total_nonesr_complete_per.toFixed(2);
        esrData[0].total_esr_incomplete_per =
          total_esr_incomplete_per.toFixed(2);
        esrData[0].total_nonesr_incomplete_per =
          total_nonesr_incomplete_per.toFixed(2);
        res.send(esrData);
      } else res.send(esrData);
    });

  /*
  console.log(req.body);
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  var user = await db.users.findOne({
    where: {
      id: req.userId,
    },
  });

  if (user.surveyor_type == 1) {
    var where = {
      organization_id: req.headers["organization"],
      internal_surveyor_id: req.userId,
    };
  } else {
    var where = {
      organization_id: req.headers["organization"],
      external_surveyor_id: req.userId,
    };
  }

  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }

  if (req.body.charttype == 1) {
    await db.score_mapping
      .findAll({
        where: where,
        include: [
          {
            model: db.sub_standards,
            as: "substandardJoin",
          },
        ],
      })
      .then((data) => {
        if (data.length > 0) {
          let esryes = data.filter(function (e) {
            return e.substandardJoin.esr == 1;
          });
          let esrno = data.filter(function (e) {
            return e.substandardJoin.esr != 1;
          });
          console.log(esryes.length, esrno.length, data.length);
          const final = {
            esr: (esryes.length / data.length) * 100,
            nonesr: (esrno.length / data.length) * 100,
          };
          res.send(final);
        } else {
          const final = { esr: 0, nonesr: 0 };

          res.send(final);
        }
      });
  } else {
    var find_client_activity = await db.client_admin_activities
      .findAll({ where: { organization_id: req.headers["organization"] } })
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    // var find_library=await db.organization_libraries.findAll({where:{organization_id:req.headers['organization']}}).then(function (accounts) { return (accounts.map(account => account.library_id)) })
    var find_mapping_client = await db.activity_mapping
      .findAll({
        where: {
          client_activity_id: { [Op.in]: find_client_activity },
          organization_id: { [Op.in]: [org_id, 0] },
        },
        group: ["substandard_id"],
      })
      .then(function (accounts) {
        return accounts.map((account) => account.substandard_id);
      });

    // var find_mapping_admin=await db.activity_mapping.findAll({where:{library_id:{ [Op.in]: find_library } },group:['substandard_id']})
    var substandards = await db.sub_standards.findAll({
      where: { id: { [Op.in]: find_mapping_client } },
    });
    let esryes = substandards.filter(function (e) {
      return e.esr == 1;
    });
    let nonesr = substandards.filter(function (e) {
      return e.esr != 1;
    });
    let esr_map = esryes.map((e) => {
      return e.id;
    });
    let non_esr_map = nonesr.map((e) => {
      return e.id;
    });

    if (user.surveyor_type == 1) {
      var where1 = {
        organization_id: req.headers["organization"],
        internal_surveyor_id: req.userId,
        substanard_id: { [Op.in]: esr_map },
      };

      var where2 = {
        organization_id: req.headers["organization"],
        internal_surveyor_id: req.userId,
        substanard_id: { [Op.in]: non_esr_map },
      };
    } else {
      var where1 = {
        organization_id: req.headers["organization"],
        external_surveyor_id: req.userId,
        substanard_id: { [Op.in]: esr_map },
      };

      var where2 = {
        organization_id: req.headers["organization"],
        external_surveyor_id: req.userId,
        substanard_id: { [Op.in]: non_esr_map },
      };
    }

    // let esrno= substandards.filter(function (e) { return (e.esr != 1)});
    var score = await db.score_mapping
      .findAll({
        where: where1,
        group: ["substanard_id"],
      })
      .then((data) => {
        return data.map((data) => data.substanard_id);
      });
    var Nonscore = await db.score_mapping
      .findAll({
        where: where2,
        group: ["substanard_id"],
      })
      .then((data) => {
        return data.map((data) => data.substanard_id);
      });
    // res.send({score,map})
    let persentage_calculate_esr = (
      (score.length / esr_map.length) *
      100
    ).toFixed(2);
    let persentage_calculate_nonesr = (
      (Nonscore.length / non_esr_map.length) *
      100
    ).toFixed(2);

    res.send({
      esrpercentage: persentage_calculate_esr,
      esrstore_count: score.length,
      esr_count: esr_map.length,
      nonesr_storecount: non_esr_map.length,
      nonesr_count: Nonscore.length,
      nonesrpercentage: persentage_calculate_nonesr,
    });
  } */
};

exports.surveyorKPI = async (req, res) => {
  var where = { organization_id: req.headers["organization"], type: 2 };
  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }
  if (req.body.kpi_id) {
    where.id = req.body.kpi_id;
  }
  db.client_admin_activities
    .findAll({
      where: where,
      include: [
        {
          model: db.storage_activity_kpi,
          as: "storejoin",
          // where: { updator_id: req.userId },
          where: { organization_id: req.headers["organization"] },
          include: [{ model: db.storage_activity_kpi_elements, as: "element" }],
        },
      ],
    })
    .then((data) => {
      res.send(data);
    });
};

exports.surveyorObservation = async (req, res) => {
  var monthNameList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (req.headers["organization"]) {
    var where = { organization_id: req.headers["organization"], type: 2 };
  } else {
    var where = { type: 2 };
  }

  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.query.to_date,
    };
  }
  if (req.body.kpi_id) {
    where.id = req.body.kpi_id;
  }
  db.client_admin_activities
    .findAll({
      where: where,
      include: [
        {
          model: db.storage_observation,
          as: "storeobservationjoin",
          //where: { updator_id: req.userId },
          where: { organization_id: req.headers["organization"] },
          //  include:[
          //    { model: db.storage_activity_kpi_elements, as: 'element',}
          //  ]
        },
      ],
    })
    .then(async (data) => {
      data = [];
      // monthNameList.forEach((month,el) => {
      //   monthData = {month : '0' };
      //   data = {...data,...monthData};
      //    console.log(data);
      //      //data.push(monthData)
      // });

      data = await monthNameList.map((el) => {
        return {
          month: el,
          observation: Math.floor(Math.random() * 100),
        };
      });

      res.send(data);
      // .then(data => {
      //   res.send(data);
      // })
      // data = {
      //   "jan" : '10',
      //   "feb" : "90",
      //   "mar" : "0",
      //   "apr" : "15",
      //   "may" : "16",
      //   "jun" : "17",
      //   "jul" : "0",
      //   "aug" : "0",
      //   "sep" : "0",
      //   "oct" : "0",
      //   "nov" : "0",
      //   "dec" : "0"
      // }
    });
};

exports.surveyorComplianceMet = async (req, res) => {
  //console.log(req.headers);

  var user = await db.users.findOne({
    where: {
      id: req.userId,
    },
  });

  if (user.surveyor_type == 1) {
    var where = {
      organization_id: req.headers["organization"],
      internal_surveyor_id: req.userId,
    };
  } else {
    var where = {
      organization_id: req.headers["organization"],
      external_surveyor_id: req.userId,
    };
  }

  // var where = {
  //   organization_id: req.headers["organization"],
  //   updator_id: req.userId,
  // };

  if (req.body.from_date) {
    where.createdAt = {
      [Op.gte]: req.body.from_date,
    };
  }
  if (req.body.to_date) {
    where.createdAt = {
      [Op.lte]: req.body.to_date,
    };
  }

  if (req.body.sort == "all") {
    await db.score_mapping
      .findAll({
        where: where,
        attributes: [
          "id",
          "organization_id",
          "library_id",
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updator_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "internal_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "external_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "count",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updatormet",
          ],
        ],
        group: ["library_id"],
      })
      .then((data) => {
        res.send(data);
      });

    // var score = await db.score_mapping.findAll({
    //   where: where,
    //   // attributes: ['id', 'organization_id',
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('updator_score')), 'updator_score_all'],
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('internal_surveyor_score')), 'internal_surveyor_score_all'],
    //   //   [db.sequelize.fn('SUM', db.score_mapping.sequelize.col('external_surveyor_score')), 'external_surveyor_score_all'],
    //   //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'count'],
    //   //   [db.sequelize.fn('count', db.score_mapping.sequelize.col('updator_score')), 'updatormet']
    //   // ],
    // // group:['']
    //   }).then((data)=>{
    //     if(data.length>0){
    //       let complience= data.filter(function (e) { return (e.updator_score == 1)});
    //     console.log(complience.length);

    //     res.send(complience);
    //     }
    //   })
    // final[key].dataValues.library[key1].dataValues.score = score;
  } else {
    var score = await db.score_mapping
      .findAll({
        where: where,
        attributes: [
          "id",
          "organization_id",
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "updator_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("internal_surveyor_score")
            ),
            "internal_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "SUM",
              db.score_mapping.sequelize.col("external_surveyor_score")
            ),
            "external_surveyor_score_all",
          ],
          [
            db.sequelize.fn(
              "count",
              db.score_mapping.sequelize.col("updator_score")
            ),
            "count",
          ],
        ],
      })
      .then((data) => {
        res.send(data);
      });
    //final[key].dataValues.library[key1].dataValues.score = score;
  }
  // res.send(organization)
};

exports.surveyorCount = async (req, res) => {
  var where = { status: { [Op.notIn]: [master.status.delete] } };
  let overAllLibScore = 0;
  let overAllChapterScore = 0;
  let overAllStdScore = 0;
  if (req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  const userDetail = await db.users.findOne({
    where : {
      id : req.userId
    }
  })

  const prop_mappingsLibs = await db.property_mapping.findAll({
    where : {
      user_id : req.userId,
      role_id : 5,
      organization_id : req.organization_id
    },
    group : ["library_id"]
  }).then(props=>props.map(el=>el.library_id)) ; 
  surveyorType = userDetail.surveyor_type; 
  for (const element of prop_mappingsLibs) {
    let libscore = await helper.getLibraryScoreUpdatorSurveyorComp(
      req,
      element,
     req.userId,
      surveyorType,
      null,
      null,
      null,
      null,
      req.organization_id,
      null,
      null
    );
 
    overAllLibScore = +overAllLibScore + +libscore;
  
    let chapterScore = await helper.getChapterScoreUpdatorSurv(
      req,
      element,
     req.userId,
      surveyorType,
      null,
      null,
      null,
      null,
      req.organization_id,
      null,
      null
    );

    overAllChapterScore = +overAllChapterScore + +chapterScore;
  
    let standardScore = await helper.getStandardScoreUpdatorSurv(
      req,
      element,
     req.userId,
      surveyorType,
      null,
      null,
      null,
      null,
      req.organization_id,
      null,
      null
    );
    
    overAllStdScore = +overAllStdScore + +standardScore;
  }


 
  let completedSession = 0;
  let pendingSession = 0;

  const surveyor_session = await db.surveyor_session.findAll({
    include: [
      {
        model: db.users,
        as: "userdetails",
        attributes: {
          exclude: ["password", "temporary_password", "jwt", "otp"],
        },
        where: where,
      },
    ],
    where: {
      status: { [Op.notIn]: [master.status.delete] },
      user_id: req.userId,
    },
    order: [["id", "DESC"]],
  });

  if (surveyor_session.length > 0) {
    for (let index = 0; index < surveyor_session.length; index++) {
      let survey_status = 1;
      let statusCond =
        "ROUND(avg(IFNULL(external_surveyor_score,null)/2)*100) as  surveyor_score ";

      if (surveyor_session[index].dataValues.userdetails.surveyor_type == 1) {
        statusCond =
          "ROUND(avg(IFNULL(internal_surveyor_score,null)/2)*100) as surveyor_score";
      }

      const substandardScores = await db.sequelize.query(
        `select sub.id,sub.name,sub.code,sub.description,${statusCond}
     from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id
     LEFT JOIN score_mapping score on sub.id = score.substanard_id and
     score.organization_id=${req.organization_id}
     where pm.user_id=${surveyor_session[index].dataValues.userdetails.id} and pm.organization_id=${req.organization_id} and sub.status not in (2) and pm.library_id=${surveyor_session[index].dataValues.library_id}  and sub.session_class_id like '%${surveyor_session[index].dataValues.class_id}%'       
     group by sub.id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      for (const element of substandardScores) {
        if (!element.surveyor_score) {
          survey_status = 0;
        }
      }

      surveyor_session[index].dataValues.status = survey_status;
    }

    completedSession = surveyor_session.filter(
      (el) => el.dataValues.status == 1
    ).length;
    pendingSession = surveyor_session.filter(
      (el) => el.dataValues.status == 0
    ).length;
  }

  let sql = ``;
  sql = `select 

    (select count(distinct(id)) from surveyor_session where user_id=${req.userId} AND YEAR(createdAt) = YEAR(CURDATE()) AND survey_status=${master.status.active})  as PendingSession,
    
    (select count(distinct(id)) from surveyor_session where user_id=${req.userId} AND YEAR(createdAt) = YEAR(CURDATE()) AND survey_status=${master.status.inactive})  as CompletedSession`;

  await db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
     
      // substandardAssignedCount = data[0].substandardAssignedCount;
      var details = {};
      // details.overall_score = OverallScore.toFixed(0);
      // details.chapter_score = ChapterScore.toFixed(0);
      // details.standard_score = StandardScore.toFixed(0);

      details.overall_score = overAllLibScore.toFixed(0);
      details.chapter_score = overAllChapterScore.toFixed(0);
      details.standard_score = overAllStdScore.toFixed(0);

      details.task_completed = completedSession;

      details.task_pending = pendingSession;
      res.send(details);
    })
    .catch((error) => {
      res.send(error);
    });
};
