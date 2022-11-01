const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  try {
    db.storage_observation
      .create({
        mapping_id: req.body.mapping_id,
        organization_id: req.organization_id,
        updator_id: req.body.updator_id,
        admin_activity_id: req.body.admin_activity_id,
        client_activity_id: req.body.client_activity_id,
        observation_type: req.body.observation_type,
        currency_type: req.body.currency_type,
        currency: req.body.currency,
        comments: req.body.comments,
        expiry_date: req.body.expiry_date,
        frequency: req.body.response_frequency,
        responsedate : req.body.responsedate,
        status: 1,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_observation",
          primary_id: data.id,
          event: "create",
          new_value: data.dataValues,
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
  } catch (error) {
    logger.info("/error", error);
    res.send(error);
  }
};

async function getfrequencyObservation(freq) {
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
  var frequency = "";

  var d = new Date();
  var n = d.getMonth();
  if (freq === "Monthly") {
    frequency = monthNames[n];
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
    frequency = currentquarter;
  } else if (freq === "Biannual") {
    let biann = BiAnnual[0];
    if (n + 1 / 6 === 1) {
      biann = BiAnnual[0];
    } else if (n + 1 / 6 === 2) {
      biann = BiAnnual[1];
    }

    frequency = biann;
  } else if (freq === "Annual") {
    let ann = Annual[0];
    if (n + 1 / 12 === 1) {
      ann = Annual[0];
    }
    frequency = ann;
  } else if (freq === "Weekly") {
    currentdate = new Date();
    var oneJan = new Date(currentdate.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (currentdate - oneJan) / (24 * 60 * 60 * 1000)
    );
    var result = Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
    frequency = "Week" + result;
  }

  return frequency;
}
exports.update = async (req, res) => {
  var frequency = "";
  if (req.body.id && req.body.id !== null) {
   
    try {
 
      db.storage_observation
        .update(
          {
            currency: req.body.currency,
            comments: req.body.comments,
          },
          {
            where: { id: req.body.id },
          }
        )
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "storage_observation",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send({ message: "updated" });
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    } catch (error) {
      logger.info("/error", error);
      res.send(error);
    }
  } else {
    if (req.body.response_frequency && req.body.response_frequency !== null) {
      console.log(req.body.response_frequency);
      frequency = await getfrequencyObservation(req.body.response_frequency);
      console.log(frequency);
    }
    let wherecondition = ``;
    if (frequency === null && frequency === "") {
      res.send("Error");
    } else {
      console.log(frequency);
      if (req.body.admin_activity_id && req.body.admin_activity_id !== null) {
        wherecondition =
          wherecondition +
          ` frequency='${frequency}' and updator_id=${req.userId} and admin_activity_id='${req.body.admin_activity_id}' and organization_id=${req.organization_id}`;
      } else if (
        req.body.client_activity_id &&
        req.body.client_activity_id !== null
      ) {
        wherecondition =
          wherecondition +
          ` frequency='${frequency}' and updator_id=${req.userId} and client_activity_id='${req.body.client_activity_id}' and organization_id=${req.organization_id}`;
      }
      wherecondition = ``;
      if (frequency === null && frequency === "") {
        res.send("Error");
      } else {
        console.log(frequency);
        if (req.body.admin_activity_id && req.body.admin_activity_id !== null) {
          wherecondition =
            wherecondition +
            ` frequency='${frequency}' and updator_id=${req.userId} and admin_activity_id='${req.body.admin_activity_id}' and organization_id=${req.organization_id}`;
        } else if (
          req.body.client_activity_id &&
          req.body.client_activity_id !== null
        ) {
          wherecondition =
            wherecondition +
            ` frequency='${frequency}' and updator_id=${req.userId} and client_activity_id='${req.body.client_activity_id}' and organization_id=${req.organization_id}`;
        }
        console.log(wherecondition);
        var observation_checklist = await db.sequelize.query(
          `SELECT * FROM storage_observation where ${wherecondition}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (observation_checklist && observation_checklist.length > 0) {
          try {
            db.storage_observation
              .update(
                {
                  mapping_id: null,
                  organization_id: req.organization_id,
                  updator_id: req.userId,
                  admin_activity_id: req.body.admin_activity_id,
                  client_activity_id: req.body.client_activity_id,
                  observation_type: req.body.observation_type,
                  currency_type: req.body.currency_type,
                  currency: req.body.currency,
                  comments: req.body.comments,
                  expiry_date: req.body.expiry_date,
                  frequency: frequency,
                  status: 1,
                  currency_type: "$",
                },
                {
                  where: { id: req.body.id },
                }
              )
              .then((data) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_observation",
                  primary_id: req.body.id,
                  event: "update",
                  new_value: req.body,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                res.send({ message: "updated" });
              })
              .catch((error) => {
                logger.info("/error", error);
                res.send(error);
              });
          } catch (error) {
            logger.info("/error", error);
            res.send(error);
          }
        } else {
          try {
            db.storage_observation
              .create({
                mapping_id: null,
                organization_id: req.organization_id,
                updator_id: req.userId,
                admin_activity_id: req.body.admin_activity_id,
                client_activity_id: req.body.client_activity_id,
                observation_type: req.body.observation_type,
                currency_type: req.body.currency_type,
                currency: req.body.currency,
                comments: req.body.comments,
                expiry_date: req.body.expiry_date,
                frequency: frequency,
                status: 1,
                currency_type: "$",
                responsedate: req.body.responsedate,
              })
              .then((data) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_observation",
                  primary_id: req.body.id,
                  event: "update",
                  new_value: req.body,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                res.send({ message: "updated" });
              })
              .catch((error) => {
                logger.info("/error", error);
                res.send(error);
              });
          } catch (error) {
            logger.info("/error", error);
            res.send(error);
          }
        }
      }
    }
  }
};
exports.get = async (req, res) => {
  let where = "";

  let fromdate = req.query.fromDate;
  let todate = req.query.toDate;
  let filterDate = null;
  if (
    fromdate &&
    fromdate &&
    fromdate != "undefined" &&
    todate != "undefined"
  ) {
    filterDate = helper.getStartAndEndDate(
      fromdate,
      todate,
      req.query.response_frequency,
      req.query.submission_day
    );
  }

  if (req.params.type == 1) {
    //admin activity
    var whereCondition = {
      admin_activity_id: req.params.id,
      organization_id: req.headers["organization"],
      status: { [Op.notIn]: [master.status.delete] },
    };
    where = `where A.admin_activity_id='${req.params.id}' &&  A.organization_id=${req.headers["organization"]} &&  A.status not in(${master.status.delete}) `;
  } else {
    var whereCondition = {
      client_activity_id: req.params.id,
      organization_id: req.headers["organization"],
      status: { [Op.notIn]: [master.status.delete] },
    };
    where = `where  A.client_activity_id=${req.params.id} &&  A.organization_id=${req.headers["organization"]} &&  A.status not in(${master.status.delete}) `;
  }

  activityOrganization = {};

  if (req.params.type == 1) {
    activityOrganization = await db.activities_organization.findOne({
      where: whereCondition,
    });
  } else {
    activityOrganization = await db.activities_organization.findOne({
      where: {
        client_admin_activity: req.params.id,
        organization_id: req.headers["organization"],
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
  }
  let activityDetails = null;
  if (!activityOrganization) {
    if (req.params.type == 1) {
      activityDetails = await db.admin_activities.findOne({
        where: {
          id: req.params.id,
          status: { [Op.notIn]: [master.status.delete] },
        },
      });
    } else {
      activityDetails = await db.client_admin_activities.findOne({
        where: {
          id: req.params.id,
          organization_id: req.headers["organization"],
          status: { [Op.notIn]: [master.status.delete] },
        },
      });
    }
  } else {
    activityDetails = { ...activityOrganization };
  }

  if (activityDetails) {
    if (activityDetails.submission_day && activityDetails.response_frequency) {
      let expiryDate = await helper.getDueDate(
        activityDetails.submission_day,
        activityDetails.response_frequency
      );

      if (expiryDate) {
        let startDate = expiryDate;
        if (activityDetails.response_frequency == "Weekly") {
          startDate = new Date(expiryDate);
          startDate.setDate(startDate.getDate() - 7);
          //console.log(startDate);
          startDate =
            startDate.getFullYear() +
            "-" +
            (startDate.getMonth() + 1) +
            "-" +
            startDate.getDate();

          console.log(startDate);
        } else if (activityDetails.response_frequency == "Monthly") {
          startDate = new Date(expiryDate);
          startDate.setMonth(startDate.getMonth() - 1);
          startDate =
            startDate.getFullYear() +
            "-" +
            (startDate.getMonth() + 1) +
            "-" +
            startDate.getDate();
          console.log(startDate);
        } else if (activityDetails.response_frequency == "Quarterly") {
          startDate = new Date(expiryDate);
          startDate.setMonth(startDate.getMonth() - 3);
          startDate =
            startDate.getFullYear() +
            "-" +
            (startDate.getMonth() + 1) +
            "-" +
            startDate.getDate();
          console.log(startDate);
        } else if (activityDetails.response_frequency == "Biannual") {
          startDate = new Date(expiryDate);
          startDate.setMonth(startDate.getMonth() - 6);
          startDate =
            startDate.getFullYear() +
            "-" +
            (startDate.getMonth() + 1) +
            "-" +
            startDate.getDate();
          console.log(startDate);
        } else if (activityDetails.response_frequency == "Annual") {
          startDate = new Date(expiryDate);
          startDate.setFullYear(startDate.getFullYear() - 6);
          startDate =
            startDate.getFullYear() +
            "-" +
            (startDate.getMonth() + 1) +
            "-" +
            startDate.getDate();
          console.log(startDate);
        }

        if (startDate) {
          // whereCondition.createdAt = {
          //   $between: [startDate, expiryDate],
          // };

          // where =
          //   where +
          //   ` and DATE_FORMAT(A.createdAt,"%Y-%m-%d") between DATE_FORMAT('${startDate}',"%Y-%m-%d") and DATE_FORMAT('${expiryDate}',"%Y-%m-%d")`;
        
          }
      }
    }
  }

  if (filterDate) {
    where =
      where +
      ` and DATE_FORMAT(A.responsedate,"%Y-%m-%d") between DATE_FORMAT('${filterDate.startDate}',"%Y-%m-%d") and DATE_FORMAT('${filterDate.endDate}',"%Y-%m-%d")`;
  } else {
    
    let today = new Date(); 
    fromdate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
        todate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
   
  
    filterDate = await helper.getStartAndEndDate(
      fromdate,
      todate,
      activityDetails.dataValues.response_frequency,
      activityDetails.dataValues.submission_day
    );

    where =
    where +
    ` and  A.responsedate between '${helper.dateFormatUSA(filterDate.startDate)}' and '${ helper.dateFormatUSA(filterDate.endDate) }' `;
 
 /*
    if(activityDetails.response_frequency=="Weekly" || activityDetails.response_frequency=="Monthly") {
     where =
     where +
     ` and DATE_FORMAT(A.responsedate,"%Y-%m") = date_format(CURDATE(),"%Y-%m")`;
 
    } else if(activityDetails.response_frequency=="Annual") {
     where =
     where +
     ` and DATE_FORMAT(A.responsedate,"%Y-%m") between CURDATE() and DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
    } else {
     where =
     where +
     ` and DATE_FORMAT(A.responsedate,"%Y") = date_format(CURDATE(),"%Y")`;
    } */
   }

  try {
    // db.storage_observation
    //   .findAll({
    //     //     where: {
    //     //       status: {[Op.notIn]:[ master.status.delete ]}
    //     // }
    //     where: whereCondition,
    //     include: [
    //       { model: db.admin_activities, as: "adminActivityDetail" },
    //       { model: db.client_admin_activities, as: "clientActivityDetail" },
    //       { model: db.users, as: "userDetail" },
    //     ],
    //   })
 

    db.sequelize
      .query(
        `SELECT 
  A.*, B.id as organizationScoreJoin_id, B.name as organizationScoreJoin_name, B.company_type as organizationScoreJoin_company_type, B.organization_type as organizationScoreJoin_organization_type, B.parent_id as organizationScoreJoin_parent_id, B.email as organizationScoreJoin_email, B.country as organizationScoreJoin_country, B.state as organizationScoreJoin_state, B.city as organizationScoreJoin_city, B.address as organizationScoreJoin_address, B.zipcode as organizationScoreJoin_zipcode, B.mobile_no as organizationScoreJoin_mobile_no, B.contact_person as organizationScoreJoin_contact_person, B.package as organizationScoreJoin_package, B.no_client_admin as organizationScoreJoin_no_client_admin, B.no_viewer as organizationScoreJoin_no_viewer, B.no_surveyor as organizationScoreJoin_no_surveyor, B.no_updator as organizationScoreJoin_no_updator, B.user_added as organizationScoreJoin_user_added, B.valid_from as organizationScoreJoin_valid_from, B.valid_to as organizationScoreJoin_valid_to, B.status as organizationScoreJoin_status,
  C.name AS userDetail_name, C.email AS userDetail_email, C.id AS userDetail_id,D.id AS adminActivityDetail_id, D.type AS adminActivityDetail_type, D.name AS adminActivityDetail_name, D.code AS adminActivityDetail_code, D.response_frequency AS adminActivityDetail_response_frequency, D.kpi AS adminActivityDetail_kpi,E.id AS clientActivityDetail_id, E.type AS clientActivityDetail_type, E.name AS clientActivityDetail_name, E.code AS clientActivityDetail_code, E.response_frequency AS clientActivityDetail_response_frequency, E.kpi AS clientActivityDetail_kpi 
  FROM storage_observation AS A 
 LEFT OUTER JOIN organizations AS B ON A.organization_id = B.id 
 LEFT OUTER JOIN users AS C ON A.updator_id = C.id 
 LEFT OUTER JOIN admin_activities AS D ON A.admin_activity_id = D.id 
 LEFT OUTER JOIN client_admin_activities AS E ON A.client_activity_id = E.id 
 ${where} GROUP BY updator_id, mapping_id`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then(async (responseData) => {
        let data = responseData.map((el) => {
          let tempAdminActDetail = null;
          let tempClientActDetail = null;
          if (el.admin_activity_id) {
            tempAdminActDetail = {
              id: el.adminActivityDetail_id,
              type: el.adminActivityDetail_type,
              name: el.adminActivityDetail_name,
              code: el.adminActivityDetail_code,
              response_frequency: el.adminActivityDetail_response_frequency,
              kpi: el.adminActivityDetail_kpi,
            };
          }
          if (el.client_activity_id) {
            tempClientActDetail = {
              id: el.clientActivityDetail_id,
              type: el.clientActivityDetail_type,
              name: el.clientActivityDetail_name,
              code: el.clientActivityDetail_code,
              response_frequency: el.clientActivityDetail_response_frequency,
              kpi: el.clientActivityDetail_kpi,
            };
          }
          return {
            admin_activity_id: el.admin_activity_id,
            adminActivityDetail: tempAdminActDetail,
            client_activity_id: el.client_activity_id,
            clientActivityDetail: tempClientActDetail,
            aggregation_type: el.aggregation_type,
            createdAt: el.createdAt,
            id: el.id,
            comments: el.comments,
            currency_type: el.currency_type,
            expiry_date: el.expiry_date,
            frequency: el.frequency,
            organization_id: el.organization_id,
            status: el.status,
            currency: el.currency,
            updator_id: el.updator_id,
            observation_type: el.observation_type,
            userDetail: {
              name: el.userDetail_name,
              email: el.userDetail_email,
              id: el.userDetail_id,
            },
            organizationScoreJoin: {
              id: el.organizationScoreJoin_id,
              name: el.organizationScoreJoin_name,
              company_type: el.organizationScoreJoin_company_type,
              organization_type: el.organizationScoreJoin_organization_type,
              parent_id: el.organizationScoreJoin_parent_id,
              email: el.organizationScoreJoin_email,
              country: el.organizationScoreJoin_country,
              state: el.organizationScoreJoin_state,
              city: el.organizationScoreJoin_city,
              address: el.organizationScoreJoin_address,
              zipcode: el.organizationScoreJoin_zipcode,
              mobile_no: el.organizationScoreJoin_mobile_no,
              status: el.organizationScoreJoin_status,
            },
          };
        });
        let sql = "";
        if (req.params.type == 1) {
          sql = `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        } else {
          sql = `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND client_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        }
        var assign = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        // console.log(assign);
        for (let i = 0; i < data.length; i++) {
          data[i].assign = assign;
          data[i].score = data[i].currency ? 100 : 0;
        }

        if (req.params.type == 1) {
          var client_activity = await db.activities_organization.findOne({
            where: whereCondition,
          });

          if (client_activity && data.length > 0) {
            console.log("done");
            data[0].adminActivityDetail.observation_name =
              client_activity.dataValues.observation_name;
            data[0].adminActivityDetail.kpi_name =
              client_activity.dataValues.kpi_name;
          }
        }

        res.send(data);
      })
      .catch((error) => {
        console.log(error);
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
    db.storage_observation
      .findAll({
        where: {
          id: req.params.id,
        },
        include: [
          { model: db.admin_activities, as: "adminActivityDetail" },
          { model: db.client_admin_activities, as: "clientActivityDetail" },
        ],
      })
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          data[i].assign = [];
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
  //db.storage_observation.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.storage_observation
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
          table_name: "storage_observation",
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
    db.storage_observation
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
          table_name: "storage_observation",
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
