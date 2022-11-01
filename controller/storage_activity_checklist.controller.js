const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const multer = require("multer");
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

exports.updateFile = async (req, res) => {
  let id = req.body.id;
  let attachment_link = req.body.attachment_link;
 

  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    attachment_link = path.replace("./", "");
  }
 
  db.storage_activity_checklist_elements
    .findOne({
      where: {
        id: id,
      },
    })
    .then((resEl) => {
      return db.storage_activity_checklist_elements.update(
        {
          attachment_link: attachment_link,
          storage_id : resEl.storage_id,
          element_id : resEl.element_id,
          response : resEl.response,
          comments : resEl.comments,
          status : resEl.status
        },
        {
          where: {
            id: id,
          },
        }
      ) ;
    }).then(result=> {
      res.send({message : "Success"});
    })
    .catch((error) => {
      console.log(error);
      res.status(401).send(error);
    });
};

exports.createFile = async (req, res) => {
  if (req.file) {
    var path = req.file.destination + "/" + req.file.filename;
    req.body.document_link = path.replace("./", "");
    console.log(req.body.document_link);
    data = {
      status: "file uploaded successfully",
      name: req.body.document_link,
    };
    res.send(data);
  } else {
    res.send("Please select file");
  }
};

exports.create = async (req, res) => {
  //req.body.element = [{ element_id: 1, response: 1, comment: "jhhh" }];
  var score = 0;
  var totalyes = 0;
  var totalelem = 0;
  var totalna = 0;
  for (let index = 0; index < req.body.element.length; index++) {
    if (req.body.element[index].response === "Yes") {
      totalyes++;
      totalelem++;
    } else if (req.body.element[index].response === "N/A") {
      totalna++;
      totalelem++;
    } else {
      totalelem++;
    }
  }

  if (!req.body.file_no) {
    return res.send("File No is Missing");
  }
  score = Math.floor((totalyes / (totalelem - totalna)) * 100);

  try {
    db.storage_activity_checklist
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
        file_no: req.body.file_no,
        response_frequency: req.body.response_frequency,
        response_date: req.body.response_date,
        file_status: req.body.file_status,
        score: score,
        status: master.status.active,
      })
      .then((data) => {
        if (req.body.element.length > 0) {
          for (let index = 0; index < req.body.element.length; index++) {
            const element = req.body.element[index];
            db.storage_activity_checklist_elements
              .create({
                storage_id: data.dataValues.id,
                element_id: element.element_id,
                attachment_link: element.attachment_link,
                response: element.response,
                comments: element.comments,
                status: master.status.active,
              })
              .then((datasub) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_activity_checklist_element",
                  primary_id: datasub.id,
                  event: "create",
                  new_value: datasub.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                if (req.body.element.length == index + 1) {
                  res.send(data);
                }
              });
          }
        } else {
          res.send(data);
        }
        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_activity_checklist",
          primary_id: data.dataValues.id,
          event: "create",
          new_value: data.dataValues,
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
  var score = 0;
  var totalyes = 0;
  var totalelem = 0;
  var totalna = 0;
  for (let index = 0; index < req.body.element.length; index++) {
    if (req.body.element[index].response === "Yes") {
      totalyes++;
      totalelem++;
    } else if (req.body.element[index].response === "N/A") {
      totalna++;
      totalelem++;
    } else {
      totalelem++;
    }
  }
  score = Math.floor((totalyes / (totalelem - totalna)) * 100);

  db.storage_activity_checklist
    .update(
      {
        organization_id: req.body.organization_id,
        mapping_id: req.body.mapping_id,
        admin_activity_id:
          req.body.admin_activity_id == "" ? null : req.body.admin_activity_id,
        client_activity_id:
          req.body.client_activity_id == ""
            ? null
            : req.body.client_activity_id,
        updator_id: req.body.updator_id,
        file_no: req.body.file_no,
        response_frequency: req.body.response_frequency,
        // response_date: req.body.response_date,
        file_status: req.body.file_status,
        score: score,
        status: master.status.active,
      },
      {
        where: { id: req.body.id },
      }
    )
    .then(async (data) => {
      if (req.body.element.length > 0) {
        for (let index = 0; index < req.body.element.length; index++) {
          const element = req.body.element[index];
          if (element.id) {
            console.log(element.id);
            await db.storage_activity_checklist_elements.update(
              {
                storage_id: req.body.id,
                element_id: element.element_id,
                attachment_link: element.attachment_link,
                response: element.response,
                comments: element.comments,
                status: master.status.active,
              },
              {
                where: { id: element.id },
              }
            );

            await auditCreate.create({
              user_id: req.userId,
              table_name: "storage_activity_checklist_element",
              primary_id: element.id,
              event: "updated",
              new_value: element,
              url: req.url,
              user_agent: req.headers["user-agent"],
              ip_address: req.connection.remoteAddress,
            });

            if (req.body.element.length == index + 1) {
              res.send({ msg: "updated" });
            }
          } else {
            db.storage_activity_checklist_elements
              .create({
                storage_id: req.body.id,
                element_id: element.element_id,
                attachment_link: element.attachment_link,
                response: element.response,
                comments: element.comments,
                status: master.status.active,
              })
              .then((datasub) => {
                auditCreate.create({
                  user_id: req.userId,
                  table_name: "storage_activity_checklist_element",
                  primary_id: datasub.id,
                  event: "create",
                  new_value: datasub.dataValues,
                  url: req.url,
                  user_agent: req.headers["user-agent"],
                  ip_address: req.connection.remoteAddress,
                });
                if (req.body.element.length == index + 1) {
                  res.send({ msg: "updated" });
                }
              });
          }
        }
      } else {
        res.send({ msg: "updated" });
      }
    })
    .catch((error) => {
      console.log(error);
      logger.info("/error", error);
      res.send(error);
    });
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
          //   ` and DATE_FORMAT(A.response_date,"%Y-%m-%d") between DATE_FORMAT('${startDate}',"%Y-%m-%d") and DATE_FORMAT('${expiryDate}',"%Y-%m-%d")`;
        }
      }
    }
  }

  //checklist
  // var checkStorage = await db.storage_activity_checklist.findAll({
  //   where: whereCondition,
  //   include: [
  //     { model: db.admin_activities, as: "adminActivityDetail" },
  //     { model: db.client_admin_activities, as: "clientActivityDetail" },
  //     { model: db.users, as: "userDetail" },
  //   ],
  // });

  if (filterDate) {
    where =
      where +
      ` and DATE_FORMAT(A.response_date,"%Y-%m-%d") between DATE_FORMAT('${filterDate.startDate}',"%Y-%m-%d") and DATE_FORMAT('${filterDate.endDate}',"%Y-%m-%d")`;
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
      ` and  A.response_date between '${helper.dateFormatUSA(
        filterDate.startDate
      )}' and '${helper.dateFormatUSA(filterDate.endDate)}' `;

   

    /*
    if(activityDetails.response_frequency=="Weekly" || activityDetails.response_frequency=="Monthly") {

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

      filterDate = await helper.getStartAndEndDate(
        fromdate,
        todate,
        activityDetails.response_frequency,
        activityDetails.submission_day
      );

      console.log(filterDate);

     where =
     where +
     ` and DATE_FORMAT(A.response_date,"%Y-%m") = date_format(CURDATE(),"%Y-%m")`;
 
    } else if(activityDetails.response_frequency=="Annual") {
     where =
     where +
     ` and DATE_FORMAT(A.response_date,"%Y-%m") between CURDATE() and DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
    } else {
     where =
     where +
     ` and DATE_FORMAT(A.response_date,"%Y-%m") = date_format(CURDATE(),"%Y-%m")`;
    } */
  }

  const checklistStorage = await db.sequelize.query(
    `SELECT 
A.*, B.id as organizationScoreJoin_id, B.name as organizationScoreJoin_name, B.company_type as organizationScoreJoin_company_type, B.organization_type as organizationScoreJoin_organization_type, B.parent_id as organizationScoreJoin_parent_id, B.email as organizationScoreJoin_email, B.country as organizationScoreJoin_country, B.state as organizationScoreJoin_state, B.city as organizationScoreJoin_city, B.address as organizationScoreJoin_address, B.zipcode as organizationScoreJoin_zipcode, B.mobile_no as organizationScoreJoin_mobile_no, B.contact_person as organizationScoreJoin_contact_person, B.package as organizationScoreJoin_package, B.no_client_admin as organizationScoreJoin_no_client_admin, B.no_viewer as organizationScoreJoin_no_viewer, B.no_surveyor as organizationScoreJoin_no_surveyor, B.no_updator as organizationScoreJoin_no_updator, B.user_added as organizationScoreJoin_user_added, B.valid_from as organizationScoreJoin_valid_from, B.valid_to as organizationScoreJoin_valid_to, B.status as organizationScoreJoin_status,
C.name AS userDetail_name, C.email AS userDetail_email, C.id AS userDetail_id,D.id AS adminActivityDetail_id, D.type AS adminActivityDetail_type, D.name AS adminActivityDetail_name, D.code AS adminActivityDetail_code, D.response_frequency AS adminActivityDetail_response_frequency, D.kpi AS adminActivityDetail_kpi,E.id AS clientActivityDetail_id, E.type AS clientActivityDetail_type, E.name AS clientActivityDetail_name, E.code AS clientActivityDetail_code, E.response_frequency AS clientActivityDetail_response_frequency, E.kpi AS clientActivityDetail_kpi 
FROM storage_activity_checklist AS A 
LEFT OUTER JOIN organizations AS B ON A.organization_id = B.id 
LEFT OUTER JOIN users AS C ON A.updator_id = C.id 
LEFT OUTER JOIN admin_activities AS D ON A.admin_activity_id = D.id 
LEFT OUTER JOIN client_admin_activities AS E ON A.client_activity_id = E.id 
${where} order by A.id desc`,
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  let checkStorage = checklistStorage.map((el) => {
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
      client_activity_id: el.client_activity_id,
      adminActivityDetail: tempAdminActDetail,
      clientActivityDetail: tempClientActDetail,
      createdAt: el.createdAt,
      file_no: el.file_no,
      file_status: el.file_status,
      id: el.id,
      mapping_id: el.mapping_id,
      organization_id: el.organization_id,
      response_frequency: el.response_frequency,
      response_date: el.response_date,
      score: el.score,
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

  if (checkStorage.length > 0) {
    let sql = "";
    if (req.params.type == 1) {
      // sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_des,D.code as std_code,D.name as std_name,D.description as std_desc
      //  from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id
      // left join sub_standards as C on activity_mapping.substandard_id=C.id
      // left join standards as D on activity_mapping.standard_id = D.id
      // where property_mapping.organization_id in (0,${req.organization_id}) AND admin_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
    
      sql =  `select  property_mapping.*,  null as client_activity_id, '${req.params.id}' as admin_activity_id,sub_standards.code as sub_code,sub_standards.name as sub_name,sub_standards.description as sub_des,standards.code as std_code,standards.name as std_name,standards.description as std_desc
      from   (select * from property_mapping where organization_id =${req.organization_id} && user_id=${req.userId} && 
      substandard_id in (select substandard_id from activity_mapping where organization_id in (0,${req.organization_id}) and admin_activity_id='${req.params.id}')
      ) as property_mapping  INNER JOIN standards on standards.id=property_mapping.standard_id
      INNER JOIN sub_standards on sub_standards.id=property_mapping.substandard_id where  property_mapping.substandard_id IS NOT null`
    } else {
      sql = `select activity_mapping.*,property_mapping.*,C.code as sub_code,C.name as sub_name,C.description as sub_des,D.code as std_code,D.name as std_name,D.description as std_desc
       from activity_mapping INNER JOIN property_mapping on activity_mapping.substandard_id = property_mapping.substandard_id
            left join sub_standards as C on activity_mapping.substandard_id=C.id
            left join standards as D on activity_mapping.standard_id = D.id
            where property_mapping.organization_id in (0,${req.organization_id}) AND client_activity_id='${req.params.id}' and property_mapping.user_id=${req.userId} and property_mapping.substandard_id IS NOT null`;
    }

    console.log("Assign start");
    var assign = await db.sequelize.query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    console.log("Assign Query End");
    //console.log(assign);
    //checkStorage[i].dataValues.assign = [];
    //es.send(checkStorage);

    for (let i = 0; i < checkStorage.length; i++) {
      checkStorage[i].assign = assign;
    }
    res.send(checkStorage);
  } else {
    res.send(checkStorage);
  }
};

exports.getById = async (req, res) => {
  whereCondition = {
    storage_id: req.params.id,
  };
  //checklist
  var checkStorage = await db.storage_activity_checklist_elements.findAll({
    where: whereCondition,
    include: [
      { model: db.activity_elements, as: "activity_elements" },
      // { model: db.admin_activities, as: "adminActivityDetail" },
      // { model: db.client_admin_activities, as: "clientActivityDetail" },
      { model: db.storage_activity_checklist, as: "file_id" },
    ],
    group: "element_id",
    order: [["activity_elements", "element_name", "asc"]],
  });
 

  let assignedLibCond={};
  if(req.role_id==4) {
    let substds = await db.property_mapping.findAll({
      where : {
        user_id : req.userId,
        organization_id : req.organization_id,
        role_id : req.role_id
      },
      group : ["substandard_id"]
    }).then(substds=>substds.map(el=>el.substandard_id)) ;
    if(substds.length > 0) {
      assignedLibCond = {
        id : {
          [Op.in] : substds
        }
      }
    }
     
  }

 

  let idx = 0;
  for (const element of checkStorage) {
    if(element.activity_elements) { 
      const substandard = await db.sub_standards.findOne({
        where: {
          substandard_uid: element.activity_elements.substandard_id,
          ...assignedLibCond
        },
      }); 
  
      checkStorage[idx].dataValues.activity_elements.element_name = substandard
        ? substandard.dataValues.description
        : checkStorage[idx].dataValues.activity_elements.element_name;
      checkStorage[idx].dataValues.activity_elements.dataValues.substandard_name =
        substandard
          ? substandard.dataValues.name
          : checkStorage[idx].dataValues.activity_elements.element_code;
  
      checkStorage[idx].dataValues.sortItem = substandard
        ? substandard.dataValues.name
        : checkStorage[idx].dataValues.activity_elements.element_code;
  
      checkStorage[idx].dataValues.activity_elements.dataValues.substandard_desc =
        substandard
          ? substandard.dataValues.description
          : checkStorage[idx].dataValues.activity_elements.element_name;
    }
   

    idx++;
  }

  checkStorage = checkStorage.map((el) => {
    return { ...el.dataValues };
  });

  checkStorage.sort(helper.compare);

  res.send(checkStorage);
};
exports.delete = async (req, res) => {
  //db.storage_activity_checklist.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    // db.storage_activity_checklist
    //   .update(
    //     {
    //       status: master.status.delete,
    //     },
    //     {
    //       where: { id: req.params.id },
    //     }
    //   )

    db.storage_activity_checklist_elements
      .update({
        attachment_link : null
      },{
        where: {
          id: req.params.id,
        },
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "storage_activity_checklist",
          primary_id: data[0],
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
    db.storage_activity_checklist
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
          table_name: "storage_activity_checklist",
          primary_id: data[0],
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
