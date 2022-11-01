const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const { getYtDValues } = require("../util/helper");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  try {
    db.storage_activity_kpi
      .create({
        organization_id: req.body.organization_id,
        mapping_id: req.body.mapping_id,
        client_activity_id: req.body.activity_id,
        admin_activity_id: req.body.admin_activity_id,
        aggregation_type: req.body.aggregation_type,
        type_of_measure: req.body.type_of_measure,
      })
      .then((data) => {
        req.body.response = [
          { frequency: "jan", target: 50, actual_value: 51, score: 100 },
          { frequency: "feb", target: 50, actual_value: 51, score: 100 },
          { frequency: "march", target: 50, actual_value: 51, score: 100 },
        ];
        if (req.body.response) {
          for (let index = 0; index < req.body.response.length; index++) {
            const element = req.body.response[index];

            if(element.score !=="" && element.score) {
              db.storage_activity_kpi_elements
              .create({
                storage_id: data.dataValues.id,
                frequency: element.frequency,
                target: element.target,
                actual_value: element.actual_value,
                score: element.score,
                responsedate: element.responsedate,
              })
              .then((subdata) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_activity_kpi_elements",
                  primary_id: subdata.dataValues.id,
                  event: "create",
                  new_value: subdata.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                if (req.body.response.length == index + 1) {
                  res.send(data);
                }
              });
            }
           
          }
        } else {
          res.send(data);
        }

        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_activity_kpi",
          primary_id: data[0],
          event: "create",
          new_value: data.dataValues.id,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
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
exports.update = async (req, res) => {
  let wherecondition = ``;
  if (req.body.admin_activity_id !== null) {
    wherecondition =
      wherecondition +
      `updator_id=${req.userId} and organization_id=${req.organization_id} and admin_activity_id='${req.body.admin_activity_id}'`;
  } else if (req.body.client_activity_id !== null) {
    wherecondition =
      wherecondition +
      `updator_id=${req.userId} and organization_id=${req.organization_id} and client_activity_id='${req.body.client_activity_id}'`;
  } else {
    return res.send("No Activity Found");
  }

  //console.log(`select * from storage_activity_kpi where ${wherecondition}`);
  var storage_activity_check = await db.sequelize.query(
    `select * from storage_activity_kpi where ${wherecondition}`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (storage_activity_check && storage_activity_check.length > 0) {
    try {
      if (req.body.response) {
        for (let index = 0; index < req.body.response.length; index++) {
          const element = req.body.response[index];
          //ytd = await getYtDValues([],req.body.type_of_measure) ;
          if (!isNaN(element.id)) {
            db.storage_activity_kpi_elements
              .update(
                {
                  storage_id: storage_activity_check[0].id,
                  frequency: element.frequency,
                  target: element.target,
                  totarget: element.totarget,
                  actual_value: element.actual,
                  score: element.score,
                  ytdScore: element.ytdScore,
                  ytdValue: element.ytdValue,
                },
                { where: { id: element.id }, returning: true, plain: true }
              )
              .then((subdata) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_activity_kpi_elements",
                  primary_id: element.id,
                  event: "create",
                  new_value: element.actual,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                if (req.body.response.length == index + 1) {
                  res.send("updated");
                }
              });
          } else {
            console.log(element.responsedate);

            db.storage_activity_kpi_elements
              .create({
                storage_id: storage_activity_check[0].id,
                frequency: element.frequency,
                target: element.target,
                totarget: element.totarget,
                actual_value: element.actual,
                score: element.score,
                ytdScore: element.ytdScore,
                ytdValue: element.ytdValue,
                // responsedate: DATE_FORMAT(element.responsedate,"%Y-%m-%d"),
                responsedate: element.responsedate,
              })
              .then((subdata) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_activity_kpi_elements",
                  primary_id: subdata.dataValues.id,
                  event: "create",
                  new_value: subdata.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                if (req.body.response.length === index + 1) {
                  res.send("updated");
                }
              });
          }
        }
      } else {
        res.send("updated");
      }
    } catch (error) {
      console.log(error);
      logger.info("/error", error);
      res.send(error);
    }
  } else {
    try {
      let activity_id = null;
      if (req.body.admin_activity_id !== null) {
        activity_id = req.body.admin_activity_id;
      }
      if (req.client_activity_id !== null) {
        activity_id = req.body.client_activity_id;
      }

      db.storage_activity_kpi
        .create({
          activity_id: activity_id,
          aggregation_type: req.body.aggregation_type,
          type_of_measure: req.body.type_of_measure,
          status: 1,
          organization_id: req.body.organization_id,
          mapping_id: null,
          updator_id: req.userId,
          admin_activity_id: req.body.admin_activity_id,
          client_activity_id: req.body.client_activity_id,
        })
        .then((subdata) => {
          if (req.body.response) {
            for (let index = 0; index < req.body.response.length; index++) {
              const element = req.body.response[index];
              db.storage_activity_kpi_elements
                .create({
                  storage_id: subdata.id,
                  frequency: element.frequency,
                  target: element.target,
                  totarget: element.totarget,
                  actual_value: element.actual,
                  score: element.score,
                  responsedate: element.responsedate,
                })
                .then((subdata) => {
                  auditCreate.create({
                    user_id: req.userId,
                    table_name: "storage_activity_kpi_elements",
                    primary_id: subdata.dataValues.id,
                    event: "create",
                    new_value: subdata.dataValues,
                    url: req.url,
                    user_agent: req.headers["user-agent"],
                    ip_address: req.connection.remoteAddress,
                  });
                  if (req.body.response.length == index + 1) {
                    res.send("updated");
                  }
                });
            }
          } else {
            res.send("updated");
          }
        });
    } catch (error) {
      logger.info("/error", error);
      res.send(error);
    }
  }
};

exports.get = async (req, res) => {
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

  let where = "";
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

  var target = await db.client_admin_datacollections.findAll({
    where: whereCondition,
  });

  var target_val = 0;
  var totarget_val = 0;
  if (target && target.length > 0) {
    target_val = target[0].dataValues.target;
    totarget_val = target[0].dataValues.totarget;
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
          // where =
          //   where +
          //   ` and DATE_FORMAT(F.responsedate,"%Y-%m-%d") between DATE_FORMAT('${startDate}',"%Y-%m-%d") and DATE_FORMAT('${expiryDate}',"%Y-%m-%d")`;
        }
      }
    }
  }

  if (filterDate) {
    where =
      where +
      ` and DATE_FORMAT(F.responsedate,"%Y-%m-%d") between DATE_FORMAT('${helper.dateFormatUSA(
        filterDate.startDate
      )}',"%Y-%m-%d") and DATE_FORMAT('${helper.dateFormatUSA(
        filterDate.endDate
      )}',"%Y-%m-%d")`;
  } else {
    // console.log(activityDetails.response_frequency);

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

    // console.log(filterDate);

    where =
      where +
      ` and  F.responsedate between '${helper.dateFormatUSA(
        filterDate.startDate
      )}' and '${helper.dateFormatUSA(filterDate.endDate)}' `;

    /*
    if(activityDetails.response_frequency=="Weekly" || activityDetails.response_frequency=="Monthly") {
     where =
     where +
     ` and DATE_FORMAT(F.responsedate,"%Y-%m") = date_format(CURDATE(),"%Y-%m")`;
 
    } else if(activityDetails.response_frequency=="Annual") {
     where =
     where +
     ` and DATE_FORMAT(F.responsedate,"%Y-%m") between CURDATE() and DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
    } else {
     where =
     where +
     ` and DATE_FORMAT(F.responsedate,"%Y") = date_format(CURDATE(),"%Y")`;
    } */
  }

  //  console.log(where);return;

  db.sequelize
    .query(
      `SELECT 
  A.*, B.id as organizationScoreJoin_id, B.name as organizationScoreJoin_name, B.company_type as organizationScoreJoin_company_type, B.organization_type as organizationScoreJoin_organization_type, B.parent_id as organizationScoreJoin_parent_id, B.email as organizationScoreJoin_email, B.country as organizationScoreJoin_country, B.state as organizationScoreJoin_state, B.city as organizationScoreJoin_city, B.address as organizationScoreJoin_address, B.zipcode as organizationScoreJoin_zipcode, B.mobile_no as organizationScoreJoin_mobile_no, B.contact_person as organizationScoreJoin_contact_person, B.package as organizationScoreJoin_package, B.no_client_admin as organizationScoreJoin_no_client_admin, B.no_viewer as organizationScoreJoin_no_viewer, B.no_surveyor as organizationScoreJoin_no_surveyor, B.no_updator as organizationScoreJoin_no_updator, B.user_added as organizationScoreJoin_user_added, B.valid_from as organizationScoreJoin_valid_from, B.valid_to as organizationScoreJoin_valid_to, B.status as organizationScoreJoin_status,
  C.name AS userDetail_name, C.email AS userDetail_email, C.id AS userDetail_id,D.id AS adminActivityDetail_id, D.type AS adminActivityDetail_type, D.name AS adminActivityDetail_name, D.code AS adminActivityDetail_code, D.response_frequency AS adminActivityDetail_response_frequency, D.kpi AS adminActivityDetail_kpi,E.id AS clientActivityDetail_id, E.type AS clientActivityDetail_type, E.name AS clientActivityDetail_name, E.code AS clientActivityDetail_code, E.response_frequency AS clientActivityDetail_response_frequency, E.kpi AS clientActivityDetail_kpi 
  FROM storage_activity_kpi AS A 
  LEFT OUTER JOIN storage_activity_kpi_elements as F on A.id=F.storage_id
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
      //  console.log(responseData);
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
          aggregation_type: el.aggregation_type,
          client_activity_id: el.client_activity_id,
          createdAt: el.createdAt,
          id: el.id,
          mapping_id: el.mapping_id,
          organization_id: el.organization_id,
          status: el.status,
          type_of_measure: el.type_of_measure,
          updator_id: el.updator_id,
          submission_day: activityDetails.dataValues.submission_day,
          adminActivityDetail: tempAdminActDetail,
          clientActivityDetail: tempClientActDetail,
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

      if (data.length > 0) {
        if (req.params.type == 1) {
          sql = `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        } else {
          sql = `select activity_mapping.*, property_mapping.*, standards.name as std_name, standards.description as std_desc, sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id where property_mapping.organization_id in (0,${req.organization_id}) AND client_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        }

        var assign = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });

        data.forEach(async (element, key) => {
          data[key].target = target_val; // Added taregt
          data[key].totarget = totarget_val; // Added taregt
          data[key].assign = assign;
          data[key].library = await db.activity_mapping.findAll({
            attributes: [
              "libraries_mapping.id",
              "libraries_mapping.code",
              "libraries_mapping.name",
            ],
            where: { id: element.mapping_id },
            include: [
              { model: db.libraries, as: "libraries_mapping", attributes: [] },
            ],
            raw: true,
          });

          storageWhere = { storage_id: element.id };
          let elResFreq = null;
          if (element.adminActivityDetail) {
            elResFreq = element.adminActivityDetail.response_frequency;
          } else if (element.clientActivityDetail) {
            elResFreq = element.clientActivityDetail.response_frequency;
          }

          let sqlelements = "";

          today = new Date();
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

          if (elResFreq == "Weekly") {
            sqlelements = `select *,(case when frequency is null then MONTHNAME(responsedate)  else frequency end ) as frequencymonth,
            (case when day(responsedate) <= 7 then 'Week 1' when  day(responsedate) <= 14 then 'Week 2' when  day(responsedate) <= 21 then 'Week 3'  else 'Week 4' end) as weekno 
             from storage_activity_kpi_elements where storage_id=${element.id} and  responsedate between '${filterDate.startDate}' and '${filterDate.endDate}' order by responsedate `;
          } else {
            sqlelements = `select *,(case when frequency is null then MONTHNAME(responsedate)  else frequency end ) as frequencymonth,
            (case when day(responsedate) <= 7 then 'Week 1' when  day(responsedate) <= 14 then 'Week 2' when  day(responsedate) <= 21 then 'Week 3'  else 'Week 4' end) as weekno 
             from storage_activity_kpi_elements where storage_id=${element.id} AND     responsedate between '${filterDate.startDate}' and '${filterDate.endDate}'  order by responsedate `;
          }

          let storageChkRes = await db.sequelize
            .query(sqlelements, {
              type: db.sequelize.QueryTypes.SELECT,
            })
            .then((elRes) => {
              if (elRes.length > 0) {
                return elRes.map((el) => ({
                  ...el,
                  frequency: el.frequency
                    ? el.frequency
                    : activityDetails.dataValues.response_frequency=='Weekly' ? el.frequencymonth + " " + el.weekno : el.frequencymonth,
                }));
              }
              return [];
            });

            storageChkRes = storageChkRes.map((el,idx)=>({...el,isrequired : storageChkRes.length==idx+1 ? true : false}));
          data[key].element = [...storageChkRes];
            // await db.storage_activity_kpi_elements.findAll({
            //   where:storageWhere,
            // });
            data[key].elements = [...storageChkRes];
          // await db.storage_activity_kpi_elements.findAll({
          //   where:storageWhere,
          // });

          if (element) {
            idxkpiel = 0;
            for (const kpiel of data[key].element) {
              data[key].element[idxkpiel].totarget = totarget_val;
              data[key].elements[idxkpiel].totarget = totarget_val;
              idxkpiel++;
            }
          }

          //update value from activity organizatrion table
          if (req.params.type == 1) {
            if (activityOrganization) {
              data[key].adminActivityDetail = {
                ...activityOrganization.dataValues,
              };
            }
          } else {
            if (activityOrganization) {
              data[key].clientActivityDetail = {
                ...activityOrganization.dataValues,
              };
            }
          }

          if (data.length == key + 1) {
            // console.log(data);
            res.send(data);
          }
        });
      } else {
        var dataout = [];
        console.log(dataout);
        res.send(dataout);
      }
    });
};

exports.getById = async (req, res) => {
  whereCondition = {
    id: req.params.id,
  };
  var checkStorage = await db.storage_activity_kpi.findAll({
    where: whereCondition,
    include: [
      { model: db.admin_activities, as: "adminActivityDetail" },
      { model: db.client_admin_activities, as: "clientActivityDetail" },
    ],
  });
  console.log("testing", checkStorage);
  if (checkStorage.length > 0) {
    for (let index = 0; index < checkStorage.length; index++) {
      const element = checkStorage[index];
      var checkStorageelement = await db.storage_activity_kpi_elements
        .findAll({ where: { storage_id: element.id } })
        .then(function (accounts) {
          return accounts.map((account) => account.score);
        });
      var value = checkStorageelement.map(function (elt) {
        return parseInt(elt);
      });
      var valuesum = value.reduce((a, b) => a + b, 0);
      console.log(valuesum, value.length);
      checkStorage[index].dataValues.assign = [];
      checkStorage[index].dataValues.score =
        (valuesum / (100 * value.length)) * 100;

      if (checkStorage.length == index + 1) {
        res.send(checkStorage);
      }
    }
  } else {
    res.send(checkStorage);
  }
};
exports.delete = async (req, res) => {
  //db.storage_activity_kpi.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.storage_activity_kpi
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
          table_name: "storage_activity_kpi",
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
    db.storage_activity_kpi
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
          table_name: "storage_activity_kpi",
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
