const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const e = require("express");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    req.body.document_link = path.replace("./", "");
  } else {
    req.body.document_link = "";
  }


  // let responseHeadList = await helper.getResponseHead(
  //   fromDate,
  //   toDate,
  //   activity.response_frequency,
  //   activity.submission_day
  // );

  // console.log(responseHeadList); return;
 

  try {
    db.storage_activity_document
      .create({
        organization_id: req.body.organization_id,
        mapping_id: req.body.mapping_id,
        admin_activity_id:
          req.body.admin_activity_id == "" ? null : req.body.admin_activity_id,
        client_activity_id:
          req.body.client_activity_id == ""
            ? null
            : req.body.client_activity_id,
        updator_id: req.body.updator_id,
        document_link:
          req.body.document_link == "" ? null : req.body.document_link,
        comment: req.body.comment,
        expiry_date: req.body.expiry_date,
        description: req.body.description,
        responsedate: req.body.responsedate,
        status: master.status.active,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_activity_document",
          primary_id: data.id,
          event: "create",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        //res.send(data);
        res.send({ message: "Activity Updated Succcefully" });
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

exports.updateCA = async (req, res) => {
  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    req.body.document_link = path.replace("./", "");
  }

  let wherecondition = ``;

  if (+req.body.client_activity_id && +req.body.client_activity_id != null) {
    wherecondition =
      wherecondition +
      ` client_activity_id='${req.body.client_activity_id}' and organization_id=${req.organization_id}`;
  } else if (
    req.body.admin_activity_id &&
    req.body.admin_activity_id !== null
  ) {
    wherecondition =
      wherecondition +
      ` admin_activity_id='${req.body.admin_activity_id}' and organization_id=${req.organization_id}`;
  }

  if (req.body.id && req.body.id != null) {
    wherecondition = wherecondition + ` and id='${req.body.id}' `;
  }

  var check_exist = await db.sequelize.query(
    `SELECT * FROM storage_activity_document where ${wherecondition}`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (check_exist && check_exist.length > 0) {
    try {
      db.storage_activity_document
        .update(
          {
            organization_id: req.body.organization_id,
            mapping_id: null,
            admin_activity_id:
              req.body.admin_activity_id !== null
                ? req.body.admin_activity_id
                : null,
            client_activity_id:
              req.body.client_activity_id !== null
                ? req.body.client_activity_id
                : null,
            // updator_id: req.userId,
            document_link: req.body.document_link,
            // comment: req.body.comment,
            // expiry_date: req.body.expiry_date,
            // description: req.body.description,
            status: master.status.active,
          },
          {
            where: { id: check_exist[0].id },
          }
        )
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "storage_activity_document",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send({ message: "Activity Updated Successfully" });
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
    res.send([]);
  }
};
exports.update = async (req, res) => {
  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    req.body.document_link = path.replace("./", "");
  }
  //console.log(req.file);
  //console.log(req.body.document_link);

  let wherecondition = ``;

  if (+req.body.client_activity_id && +req.body.client_activity_id != null) {
    wherecondition =
      wherecondition +
      `updator_id=${req.userId} and client_activity_id='${req.body.client_activity_id}' and organization_id=${req.organization_id}`;
  } else if (
    req.body.admin_activity_id &&
    req.body.admin_activity_id !== null
  ) {
    wherecondition =
      wherecondition +
      `updator_id=${req.userId} and admin_activity_id='${req.body.admin_activity_id}' and organization_id=${req.organization_id}`;
  }

  if (req.body.id && req.body.id != null) {
    wherecondition = wherecondition + ` and id='${req.body.id}' `;
  }

  //console.log( `SELECT * FROM storage_activity_document where ${wherecondition}`);
  var check_exist = await db.sequelize.query(
    `SELECT * FROM storage_activity_document where ${wherecondition}`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (check_exist && check_exist.length > 0) {
    try {
      db.storage_activity_document
        .update(
          {
            organization_id: req.body.organization_id,
            mapping_id: null,
            admin_activity_id:
              req.body.admin_activity_id !== null
                ? req.body.admin_activity_id
                : null,
            client_activity_id:
              req.body.client_activity_id !== null
                ? req.body.client_activity_id
                : null,
            updator_id: req.userId,
            document_link: req.body.document_link,
            comment: req.body.comment,
            expiry_date: req.body.expiry_date,
            description: req.body.description,
            status: master.status.active,
          },
          {
            where: { id: check_exist[0].id },
          }
        )
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "storage_activity_document",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send({ message: "Activity Updated Successfully" });
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
      db.storage_activity_document
        .create({
          organization_id: req.body.organization_id,
          mapping_id: null,
          admin_activity_id:
            req.body.admin_activity_id !== null
              ? req.body.admin_activity_id
              : null,
          client_activity_id:
            req.body.client_activity_id !== "undefined" &&
            req.body.client_activity_id !== undefined &&
            req.body.client_activity_id !== null
              ? req.body.client_activity_id
              : null,
          updator_id: req.userId,
          document_link: req.body.document_link,
          comment: req.body.comment,
          expiry_date: req.body.expiry_date,
          responsedate: req.body.responsedate,
          description: req.body.description,
          status: master.status.active,
        })
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "storage_activity_document",
            primary_id: req.body.id,
            event: "update",
            new_value: req.body,
            url: req.url,
            user_agent: req.headers["user-agent"],
            ip_address: req.connection.remoteAddress,
          });
          res.send({ message: "Activity Updated Successfully" });
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
          // console.log(startDate);
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

          where =
            where +
            ` and DATE_FORMAT(A.responsedate,"%Y-%m-%d") between DATE_FORMAT('${startDate}',"%Y-%m-%d") and DATE_FORMAT('${expiryDate}',"%Y-%m-%d")`;
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
    // console.log(activityDetails);

    filterDate = await helper.getStartAndEndDate(
      fromdate,
      todate,
      activityDetails.dataValues.response_frequency,
      activityDetails.dataValues.submission_day 
    );
 

    where =
      where +
      ` and  A.responsedate between '${helper.dateFormatUSA(
        filterDate.startDate
      )}' and '${helper.dateFormatUSA(filterDate.endDate)}' `;
   
  }
 
  try {
  

    db.sequelize
      .query(
        `SELECT 
    A.*, B.id as organizationScoreJoin_id, B.name as organizationScoreJoin_name, B.company_type as organizationScoreJoin_company_type, B.organization_type as organizationScoreJoin_organization_type, B.parent_id as organizationScoreJoin_parent_id, B.email as organizationScoreJoin_email, B.country as organizationScoreJoin_country, B.state as organizationScoreJoin_state, B.city as organizationScoreJoin_city, B.address as organizationScoreJoin_address, B.zipcode as organizationScoreJoin_zipcode, B.mobile_no as organizationScoreJoin_mobile_no, B.contact_person as organizationScoreJoin_contact_person, B.package as organizationScoreJoin_package, B.no_client_admin as organizationScoreJoin_no_client_admin, B.no_viewer as organizationScoreJoin_no_viewer, B.no_surveyor as organizationScoreJoin_no_surveyor, B.no_updator as organizationScoreJoin_no_updator, B.user_added as organizationScoreJoin_user_added, B.valid_from as organizationScoreJoin_valid_from, B.valid_to as organizationScoreJoin_valid_to, B.status as organizationScoreJoin_status,
    C.name AS userDetail_name, C.email AS userDetail_email, C.id AS userDetail_id,
    D.id AS adminActivityDetail_id, D.type AS adminActivityDetail_type, D.name AS adminActivityDetail_name, D.description AS adminActivityDetail_description, D.code AS adminActivityDetail_code, D.response_frequency AS adminActivityDetail_response_frequency, D.kpi AS adminActivityDetail_kpi,E.id AS clientActivityDetail_id, E.type AS clientActivityDetail_type, E.name AS clientActivityDetail_name, E.description AS clientActivityDetail_description, E.code AS clientActivityDetail_code, E.response_frequency AS clientActivityDetail_response_frequency, E.kpi AS clientActivityDetail_kpi 
    FROM storage_activity_document AS A 
   LEFT OUTER JOIN organizations AS B ON A.organization_id = B.id 
   LEFT OUTER JOIN users AS C ON A.updator_id = C.id 
   LEFT OUTER JOIN admin_activities AS D ON A.admin_activity_id = D.id 
   LEFT OUTER JOIN client_admin_activities AS E ON A.client_activity_id = E.id 
   ${where} order by A.id desc`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then(async (responseData) => {

      
 
        let data = responseData.map((el) => {
          let tempAdminActDetail = null;
          let tempClientActDetail = null;
          if (el.admin_activity_id && el.admin_activity_id != "null") {
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
            comment: el.comment,
            createdAt: el.createdAt,
            description: el.adminActivityDetail_description ? el.adminActivityDetail_description : el.clientActivityDetail_description,
            document_link: el.document_link,
            document_name: el.document_name,
            expiry_date: el.expiry_date,
            id: el.id,
            mapping_id: el.mapping_id,
            organization_id: el.organization_id,
            status: el.status,
            updator_id: el.updator_id,
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

        let sql;
        if (req.params.type == 1) {
          sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_desc,D.code as std_code,D.name as std_name,D.description as std_desc from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id 
          left join sub_standards as C on activity_mapping.substandard_id=C.id
          left join standards as D on activity_mapping.standard_id = D.id
          where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        } else {
          sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_desc,D.code as std_code,D.name as std_name,D.description as std_desc from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id 
          left join sub_standards as C on activity_mapping.substandard_id=C.id
          left join standards as D on activity_mapping.standard_id = D.id
          where property_mapping.organization_id in (0,${req.organization_id}) AND client_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
        }
        if (req.role_id == 6) {
          if (req.params.type == 1) {
            sql = `select activity_mapping.*, property_mapping.*, standards.code as std_code, standards.name as std_name, standards.description as std_desc, sub_standards.code as sub_code,sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id  && property_mapping.organization_id =${req.organization_id} and property_mapping.user_id=${req.userId}
          where property_mapping.organization_id =${req.organization_id} AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} 
          and property_mapping.substandard_id IS NOT null`;
          } else {
            sql = `select activity_mapping.*, property_mapping.*, standards.code as std_code,standards.name as std_name, standards.description as std_desc, sub_standards.code as sub_code,sub_standards.name as sub_name, sub_standards.description as sub_desc from activity_mapping INNER JOIN standards on standards.id=activity_mapping.standard_id INNER JOIN sub_standards on sub_standards.id=activity_mapping.substandard_id INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id  && property_mapping.organization_id =${req.organization_id} and property_mapping.user_id=${req.userId}
            where property_mapping.organization_id =${req.organization_id} AND client_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} 
            and property_mapping.substandard_id IS NOT null`;
          }
        }

        // console.log(sql);

        var assign = await db.sequelize.query(sql, {
          type: db.sequelize.QueryTypes.SELECT,
        });
 

        for (let i = 0; i < data.length; i++) {
          data[i].assign = assign;
          data[i].score = "";
          if (data[i].document_link) {
            data[i].document_name = data[i].document_link.replace(
              "public/uploads/",
              ""
            );
            data[i].score = 100;
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
    db.storage_activity_document
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
          data[i].dataValues.assign = [];
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
  //db.storage_activity_document.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.storage_activity_document
      .destroy({
        where: { id: req.params.id },
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_activity_document",
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
    db.storage_activity_document
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
          table_name: "storage_activity_document",
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

exports.documentReport = async (req, res) => {
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

  let userRoleConds = "";

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    roleCond = " && p.role_id=4";

    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      userRoleConds = ` && p.user_id=${req.userId} `;
      roleCond = `  && p.role_id=${req.role_id}`;
    }

    let property_mapping = ` select * from property_mapping as p where  organization_id=${req.organization_id}  ${roleCond} and (status=1 || status is null)
      and library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) 
       group by substandard_id  `;

    let sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
        from activity_mapping m left join admin_activities as A  on m.admin_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.admin_activity_id is not null
        left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.headers["organization"]}
        left join users as e on e.id = p.user_id
        where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
        and A.id is not null  group by A.id,m.library_id
        `;

    let clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
        from activity_mapping m left join client_admin_activities as A  on m.client_activity_id=A.id and m.organization_id in (0,${req.headers["organization"]})  && m.client_activity_id is not null
        left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.headers["organization"]}
        left join users as e on e.id = p.user_id
        where m.library_id in (select library_id from organization_libraries where organization_id=${req.headers["organization"]} and status=1) ${userRoleConds}  
        and A.id is not null  group by A.id,m.library_id
        `;

    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      let assignedLibraries = null;

      let assignedLibs = await db.property_mapping
        .findAll({
          where: {
            user_id: req.userId,
            role_id: req.role_id,
          },
          group: ["library_id"],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((el) => el.library_id);
          }
          return [];
        });

      if (assignedLibs.length > 0) {
        assignedLibraries = "'" + assignedLibs.join("','") + "'";
      }

      let activity_mapping = `select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (0,${req.organization_id})  && admin_activity_id is not null `;
      property_mapping = `select * from property_mapping as p where  organization_id=${req.organization_id}  && p.role_id=${req.role_id} and (status=1 || status is null)
        and library_id in (${assignedLibraries})
       group by substandard_id`;

      sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id
        from (${activity_mapping}) m 
        left join admin_activities as A  on m.admin_activity_id=A.id 
        left join (${property_mapping}) as p on p.substandard_id = m.substandard_id
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.organization_id}
        left join users as e on e.id = p.user_id
        where  A.id is not null    ${userRoleConds}   group by A.id,m.library_id`;

      activity_mapping = `select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (${req.organization_id})  && client_activity_id is not null `;
      clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
        from  (${activity_mapping}) m 
        left join client_admin_activities as A  on m.client_activity_id=A.id
        left join (${property_mapping})  as p on p.substandard_id = m.substandard_id  
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.headers["organization"]}
        left join users as e on e.id = p.user_id
        where  A.id is not null   ${userRoleConds} group by A.id,m.library_id
        `;
    }

    if (req.role_id == 2 || req.role_id == 3) {
      let assignedLibraries = null;

      let assignedLibs = await db.organization_libraries
        .findAll({
          where: {
            organization_id: req.organization_id,
            status: 1,
          },
          group: ["library_id"],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((el) => el.library_id);
          }
          return [];
        });

      if (assignedLibs.length > 0) {
        assignedLibraries = "'" + assignedLibs.join("','") + "'";
      }

      property_mapping = ` select * from property_mapping as p where  organization_id=${req.organization_id}  ${roleCond} and (status=1 || status is null)
      and library_id in  (${assignedLibraries}) group by substandard_id  `;

      let activity_mapping = `(select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (0,${req.organization_id})  && admin_activity_id is not null )`;

      sql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as admin_activity_id,m.client_activity_id,m.library_id 
        from ${activity_mapping} m left join admin_activities as A  on m.admin_activity_id=A.id 
        left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.headers["organization"]}
        left join users as e on e.id = p.user_id
        where m.library_id in (${assignedLibraries}) ${userRoleConds}  
        and A.id is not null  group by A.id,m.library_id
        `;

      activity_mapping = `(select * from activity_mapping where library_id in (${assignedLibraries}) && organization_id in (${req.organization_id})  && client_activity_id is not null )`;

      clientSql = `select  A.name as activity,A.code,A.submission_day,A.response_frequency,m.client_activity_id,m.admin_activity_id,
        c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
        m.id,A.type,A.submission_day,A.response_frequency,A.id as client_activity_id,m.library_id 
        from ${activity_mapping} m left join client_admin_activities as A  on m.client_activity_id=A.id 
        left join (${property_mapping}) as p on p.substandard_id = m.substandard_id  
        left join libraries as c on m.library_id=c.id
        left join organizations as d on d.id=${req.headers["organization"]}
        left join users as e on e.id = p.user_id
        where m.library_id in (${assignedLibraries}) ${userRoleConds}  
        and A.id is not null  group by A.id,m.library_id
        `;
    }

    let adminActivities = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let clientActivities = await db.sequelize.query(clientSql, {
      type: db.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    let admin_activity_ids_arr = adminActivities.map(
      (el) => el.admin_activity_id !== null && el.admin_activity_id
    );

    admin_activity_ids_arr = admin_activity_ids_arr.toString();
    admin_activity_ids_temp = admin_activity_ids_arr.split(",");
    let admin_activity_ids_arr_list =
      "'" + admin_activity_ids_temp.join("','") + "'";

    let activityOrganization = await db.sequelize.query(
      `select * from activities_organization where organization_id = ${req.organization_id} && admin_activity_id in (${admin_activity_ids_arr_list})`,
      {
        type: db.sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    adminActivities.map((x) => {
      zz = activityOrganization.find((y) => {
        return y.admin_activity_id === x.admin_activity_id;
      });
      if (zz) {
        delete zz.id;
        Object.assign(x, zz);
      }
    });

    if (clientActivities.length > 0) {
      adminActivities = adminActivities.concat(clientActivities);
    }

    //document type start
    const documentActivities = adminActivities.filter(function (e) {
      return e.type == 3;
    });

    let newActivityArr = [];

    for (const activity of documentActivities) {
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

      let responseHeadList = await helper.getResponseHead(
        fromDate,
        toDate,
        activity.response_frequency,
        activity.submission_day
      );
      let where = "";
      for (const responseHead of responseHeadList) {
        let firstDate = helper.dateFormatUSA(responseHead.responseDate);
        let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

        where = ` and admin_activity_id='${activity.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

        if (activity.client_activity_id) {
          where = ` and client_activity_id=${activity.client_activity_id} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
        }

        let storage_activity_documents = await db.sequelize.query(
          `select *,(select name from users where id=storage_activity_document.updator_id) as updatorname from storage_activity_document where organization_id = ${req.organization_id} ${where} limit 1`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        let stoageRes = {
          document_link: "",
          document_name: "",
          comment: "",
          expiry_date: responseHead.responseEndDate,
          status: "Pending",
          response_date: null,
          storage_id: null,
        };
        if (storage_activity_documents.length) {
          stoageRes = {
            document_link: storage_activity_documents[0].document_link,
            comment: storage_activity_documents[0].comment,
            expiry_date: storage_activity_documents[0].expiry_date,
            document_name: storage_activity_documents[0].document_name,
            status: "Completed",
            response_date: storage_activity_documents[0].responsedate,
          };
        }

        newActivityArr.push({
          ...activity,
          ...stoageRes,
          response: responseHead.week,
        });
      }
    }

    newActivityArr.forEach((element, idx) => {
      newActivityArr[idx].document_name = element.document_link
        ? element.document_link.replace("public/uploads/", "")
        : null;
      let expiry_date = helper.getDueDate(
        element.submission_day,
        element.response_frequency,
        element.response_date
      );
      // newActivityArr[idx].expiry_date = expiry_date; expiry date is already there
    });

    newActivityArr = newActivityArr.map((el) => ({
      ...el,
      activity: el.doc_Activity_name ? el.doc_Activity_name : el.activity,
    }));

    //document type end

    return res.send(newActivityArr);
  } else {
    res.send([]);
  }

  /*
  let sql = "";
  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    //|| req.role_id == 5
    let userRoleConds = "";
    roleCond = " && p.role_id=4";
    if (req.role_id == 4 || req.role_id == 5 || req.role_id == 6) {
      userRoleConds = ` && p.user_id=${req.userId} `;
      roleCond = `  && p.role_id=${req.role_id}`;
    }

    let whereResDateCond = '';
    if(req.query.fromDate && req.query.toDate) {
      whereResDateCond = ` and responsedate between '${req.query.fromDate}' and '${req.query.toDate}' `;
    }


    sql = `   select A.name as activity,A.document_name as doc_Activity_name,A.code,b.expiry_date,m.client_activity_id,m.admin_activity_id,b.id as storage_id,
  (case when b.document_link is null then 'Pending' else 'Completed' end) as status,
  c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
  b.document_link,comment,submission_day,A.response_frequency,b.createdAt as upload_date,
  m.id,A.type,A.id as admin_activity_id,m.client_activity_id,b.createdAt as response_date,m.library_id from activity_mapping m
  left join admin_activities as A  on m.admin_activity_id=A.id  and m.organization_id in (0,${req.organization_id})  and A.type=3
  left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
  left join storage_activity_document as b on A.id=b.admin_activity_id && b.organization_id=${req.organization_id} ${whereResDateCond}
  left join libraries as c on m.library_id=c.id
  left join organizations as d on d.id=${req.organization_id}
  left join users as e on e.id = p.user_id
  where m.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) ${userRoleConds}    group by A.code,m.library_id  order by b.id desc`;

    // console.log(sql);
    const clientsql = ` 
    select A.document_name as activity,A.document_name as doc_Activity_name,A.code,b.expiry_date,m.client_activity_id,m.admin_activity_id,b.id as storage_id,
  	(case when b.document_link is null then 'Pending' else 'Completed' end) as status,
    c.name as libraryname,d.name as company_name,GROUP_CONCAT(DISTINCT  IF(e.name is null, '', e.name ) SEPARATOR '')  as assignTo,
    	b.document_link,comment,submission_day,A.response_frequency,b.createdAt as upload_date,
    m.id,A.type,A.id as client_activity_id,m.admin_activity_id,b.createdAt as response_date,m.library_id from activity_mapping m
left join client_admin_activities as A  on m.client_activity_id=A.id  and m.organization_id in (${req.organization_id})  and A.type=3
left join property_mapping as p on p.substandard_id = m.substandard_id && p.organization_id=${req.organization_id} ${roleCond}
left join storage_activity_document as b on A.id=b.client_activity_id && b.organization_id=${req.organization_id} ${whereResDateCond}
left join libraries as c on m.library_id=c.id
left join organizations as d on d.id=${req.organization_id}
left join users as e on e.id = p.user_id
where m.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id} and status=1) ${userRoleConds}  and A.type=3  group by A.code,m.library_id  order by b.id desc`;

    try {
      let adminActivities = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      let admin_activity_ids_arr = adminActivities.map(
        (el) => el.admin_activity_id !== null && el.admin_activity_id
      );
      admin_activity_ids_arr = admin_activity_ids_arr.toString();
      let admin_activity_ids_temp = admin_activity_ids_arr.split(",");
      var admin_activity_ids_arr_list =
        "'" + admin_activity_ids_temp.join("','") + "'";
      const activityOrganization = await db.sequelize.query(
        `select *,document_name as doc_Activity_name from activities_organization where organization_id = ${req.organization_id} && admin_activity_id in (${admin_activity_ids_arr_list})`,
        {
          type: db.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      adminActivities.map((x) => {
        zz = activityOrganization.find((y) => {
          return y.admin_activity_id === x.admin_activity_id;
        });
        if (zz) {
          delete zz.id;
          delete zz.status;
          delete zz.document_link;
          Object.assign(x, zz);
        }
      });

      
      const clientActivities = await db.sequelize.query(clientsql, {
        type: db.sequelize.QueryTypes.SELECT,
      });
     
      if (clientActivities.length > 0) {
        adminActivities = adminActivities.concat(clientActivities);
      }

      const activities = adminActivities.filter(function (e) {
        return e.type == 3;
      });
      let newActivityArr=[];
      for (const activity of activities) {
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

        let responseHeadList = await helper.getResponseHead(
          fromDate,
          toDate,
          activity.response_frequency,
          activity.submission_day
        );

        for (const responseHead of responseHeadList) {
          let firstDate = helper.dateFormatUSA(responseHead.responseDate);
          let secondDate = helper.dateFormatUSA(responseHead.responseEndDate);

          where = ` and admin_activity_id='${activity.admin_activity_id}' and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;

          if (activity.client_activity_id) {
            where = ` and client_activity_id=${activity.client_activity_id} and responsedate between date_format('${firstDate}','%Y-%m-%d') and date_format('${secondDate}','%Y-%m-%d')`;
          }

          let storage_activity_documents = await db.sequelize.query(
            `select *,(select name from users where id=storage_activity_document.updator_id) as updatorname from storage_activity_document where organization_id = ${req.organization_id} ${where} limit 1`,
            {
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          let stoageRes = { document_link: "", document_name: "",comment : "", expiry_date: responseHead.responseEndDate, status: "Pending",response_date : null,
          storage_id: null };
          if (storage_activity_documents.length) {
            stoageRes = {
              document_link: storage_activity_documents[0].document_link,
              comment: storage_activity_documents[0].comment,
              expiry_date: storage_activity_documents[0].expiry_date,
              document_name: storage_activity_documents[0].document_name,
              status: "Completed",
              response_date : storage_activity_documents[0].responsedate,
            };
          }

          newActivityArr.push({
            ...activity,
            ...stoageRes,
            response: responseHead.week,
          });
        }

      }

     
      
      newActivityArr.forEach((element, idx) => {
        newActivityArr[idx].document_name = element.document_link
          ? element.document_link.replace("public/uploads/", "")
          : null;
        // console.log(element.submission_day, element.response_frequency, element.response_date);
        let expiry_date = helper.getDueDate(
          element.submission_day,
          element.response_frequency,
          element.response_date
        );
        newActivityArr[idx].expiry_date = expiry_date;
      });

      newActivityArr = newActivityArr.map(el => ({
        ...el,
        activity : el.doc_Activity_name ? el.doc_Activity_name : el.activity
      }))

      return res.send(newActivityArr);
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }

  //console.log(sql);

  db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      console.log(error);
      res.send(error);
    });
*/
};

exports.uploadeddocuments = async (req, res) => {
  //console.log(req.userId);
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;
  var where = {
    status: { [Op.notIn]: [master.status.delete] },
    updator_id: req.userId,
  };

  if (req.headers["organization"] != undefined && req.headers["organization"]) {
    where.organization_id = req.headers["organization"];
  }

  if (
    req.role_id == 4 ||
    req.role_id == 5 ||
    req.role_id == 6 ||
    req.role_id == 2 ||
    req.role_id == 3
  ) {
    //|| req.role_id == 5
    let userRoleConds = "";
    let libraryCond = "";
    let dateCond = ""; 
    if(fromDate && fromDate !="" && toDate && toDate !="") {
    dateCond = ` && date_format(A.createdAt,"%Y-%m-%d") between '${fromDate}' and '${toDate}' `;
    }

    if (req.role_id == 4) {
      userRoleConds = ` && A.updator_id=${req.userId} `;
    }

    if (req.role_id > 3) {
      libraryCond = ` && AM.library_id in (select library_id from property_mapping where user_id=${req.userId}) `;
    }

    const sql = `select A.id,C.id as admin_activity_id,null as client_activity_id ,A.document_link, replace(A.document_link,"public/uploads/","") as document_name,'Document Evidence' as activity_type,C.name as activity,
    C.code,L.name as libraryname,D.name as assignTo,E.name as company_name,A.updatedAt as uploaded_date, A.expiry_date from 
    storage_activity_document as A  
    left join admin_activities as C on A.admin_activity_id = C.id && A.organization_id=${req.organization_id}
    left join activity_mapping as AM on C.id = AM.admin_activity_id && AM.organization_id in (0,${req.organization_id})  && AM.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id})
    ${libraryCond}
    left join property_mapping as PM on AM.substandard_id = PM.substandard_id && AM.standard_id = PM.standard_id && PM.organization_id=${req.organization_id}
    left join libraries as L on AM.library_id = L.id
    left join users as D on A.updator_id = D.id
    left join organizations as E on A.organization_id = E.id 
    where A.organization_id = ${req.organization_id} ${userRoleConds}  and (A.document_link !='' and A.document_link is not null)  && A.admin_activity_id !="null" ${dateCond}  group by A.id
`;

    //console.log(sql);
    const clientsql = ` select A.id,null as admin_activity_id,C.id as client_activity_id ,A.document_link, replace(A.document_link,"public/uploads/","") as document_name,'Document Evidence' as activity_type,C.name as activity,
    C.code,L.name as libraryname,D.name as assignTo,E.name as company_name,A.updatedAt as uploaded_date, A.expiry_date from 
    storage_activity_document as A  
    left join client_admin_activities as C on A.client_activity_id = C.id  
    left join activity_mapping as AM on C.id = AM.client_activity_id && AM.organization_id in (0,${req.organization_id})   && AM.library_id in (select library_id from organization_libraries where organization_id=${req.organization_id})
    ${libraryCond} 
    left join property_mapping as PM on AM.substandard_id = PM.substandard_id && AM.standard_id = PM.standard_id && PM.organization_id=${req.organization_id}
    left join libraries as L on AM.library_id = L.id
    left join users as D on A.updator_id = D.id
    left join organizations as E on A.organization_id = E.id 
    where A.organization_id = ${req.organization_id} and AM.client_activity_id is not null and (A.document_link !='' and A.document_link is not null) ${dateCond}  group by A.id `;

    //console.log(sql);
    //console.log(clientsql);
    try {
      let adminActivities = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      let clientActivities = await db.sequelize.query(clientsql, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (clientActivities.length > 0) {
        adminActivities = adminActivities.concat(clientActivities);
      }

      return res.send(adminActivities);
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
};
