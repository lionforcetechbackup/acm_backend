const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
// const upload = require("../middleware/upload");
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
const helper = require("../util/helper")
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ".jpeg");
  },
});
var fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

exports.create = async (req, res) => {
  // let upload = upload.uploadFile;
  var code = await db.standards.findOne({
    where: { id: req.body.standard_id },
    // attributes: ["standards.*", "chapterjoin.id", "chapterjoin.library_id"],
    include: {
      model: db.chapters,
      as: "chapterjoin",
      attributes: ["id", "library_id"],
      //nested: false,
      required: true,
    },
  });
  var substandard = await db.sub_standards.findAll({
    where: {
      standard_id: req.body.standard_id,
      name: req.body.name,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  if (substandard.length == 0) {
    let upload = multer({ storage: storage, fileFilter: fileFilter }).single(
      "file"
    );
    var element = req.body;
    upload(req, res, function (err) {
      if (req.fileValidationError) {
        res.send(req.fileValidationError);
      } else if (err instanceof multer.MulterError) {
        res.send(err);
      } else if (err) {
        res.send(err);
      }
      if (req.file) {
        var path = req.file.destination + "/" + req.file.filename;
        var fileLink = path.replace("./", "");
      }

      var sub_standard_id = crypto
        .createHash("sha256")
        .update(
          element.name +
            "_" +
            element.standard_id +
            "_" +
            code.dataValues.chapter_id +
            "_" +
            code.dataValues.chapterjoin.library_id
        )
        .digest("hex");
 
        let substandard_uid = crypto.createHash("sha256").update(element.description.trim()).digest("hex");     

      db.sub_standards
        .create({
          id: sub_standard_id,
          standard_id: element.standard_id,
          code: code.dataValues.code + "." + element.name,
          name: element.name,
          description: element.description,
          esr: element.esr,
          surveyor_category_id: element.surveyor_category_id,
          session_class_id: element.session_class_id,
          unit_focus_area: element.unit_focus_area,
          file: fileLink,
          document_title:
            req.body.document_title != "" ? req.body.document_title : null,
            substandard_uid : substandard_uid,
          status: master.status.active,

        })
        .then((data) => {
          res.send(data);
        })
        .catch((error) => {
          logger.info("/error", error);
          res.send(error);
        });
    });
  } else {
    res.send({ error: "SubStandard Name already used!" });
  }
};
exports.update = async (req, res) => {
  // db.sub_standards.update({
  //   standard_id: req.body.standard_id, code: req.body.code, description: req.body.description, esr: req.body.esr, surveyor_category_id: req.body.surveyor_category_id, session_class_id: req.body.session_class_id, unit_focus_area: req.body.unit_focus_area, file: req.body.file,
  // }, {
  //   where: { id: req.body.id }
  // }).then(() => res.send("success"))

  //console.log(req.body.id);
  //process.exit(0);
 

  var code = await db.standards
    .findOne({
      where: { id: req.body.standard_id },
    })
    .catch((err) => console.log(err)); 
 

  var substandard = await db.sub_standards.findAll({
    where: {
      standard_id: req.body.standard_id,
      name: req.body.name,
      id: { [Op.notIn]: [req.body.id] },
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
 

  if (substandard.length == 0) {
    let upload = multer({ storage: storage, fileFilter: fileFilter }).single(
      "file"
    );
    var element = req.body;
    upload(req, res, function (err) {
      if (req.fileValidationError) {
        res.send(req.fileValidationError);
      } else if (err instanceof multer.MulterError) {
        res.send(err);
      } else if (err) {
        res.send(err);
      }
      if (req.file) {
        var path = req.file.destination + "/" + req.file.filename;
        var fileLink = path.replace("./", "");
      }

    
      db.sub_standards
        .update(
          {
            standard_id: element.standard_id,
            code: code.dataValues.code + "." + element.name,
            name: element.name,
            description: element.description,
            esr: element.esr,
            surveyor_category_id: element.surveyor_category_id,
            session_class_id: element.session_class_id,
            unit_focus_area: element.unit_focus_area,
            file: fileLink,
              document_title:
            element.document_title != "" ? element.document_title : null,
          },
          {
            where: { id: element.id },
          }
        )
        .then((data) => res.send(data))
        .catch((error) => {
          console.log(error);
          logger.info("/error", error);
          res.send(error);
        });
    });
  } else {
    res.send({ error: "SubStandard Name already used!" });
  }
};
exports.get = async (req, res) => {
  db.sub_standards
    .findAll({
      attributes: ["id", "standard_id", "name", "code"],
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
      order: [["id", "DESC"]],
    })
    .then((data) => res.send(data));
};

exports.getById = async (req, res) => {
  db.sub_standards
    .findAll({
      where: {
        id: req.params.id,
      },
    })
    .then((data) => res.send(data));
};
exports.delete = async (req, res) => {
  db.sub_standards
    .destroy(     
      {
        where: { id: req.params.id },
      }
    )
    .then((data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "libraries",
        primary_id: data[0],
        event: "delete",
        new_value: data,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });

      res.send("deleted");
    });
};
exports.statusChange = async (req, res) => {
  db.sub_standards
    .update(
      {
        status: req.params.status,
      },
      {
        where: { id: req.params.id },
      }
    )
    .then((data) => res.send("status changed"));
};

exports.getByStandardId = async (req, res) => {
  db.sub_standards
    .findAll({
      where: {
        standard_id: req.params.id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      order : [
        ["name"]
      ],
      raw : true
    })
    .then((data) => {
      data = data.map((el) => ({
        ...el,
        sortItem: el.name,
      }));
      data.sort(helper.compare);
      data = helper.sortAlphanumeric(data);
      res.send(data)
    });
};

exports.getByIdCommon = async (req, res) => {
  var whereCondition = " AND sub_standards.status !=" + master.status.delete;

  if (req.query.chapter_id) {
    if (req.query.type == "library") {
      whereCondition =
        " AND standards.chapter_id='" + req.query.chapter_id + "'";
    }
    // else if(req.query.type == 'chapter'){
    //   whereCondition=' AND standards.chapter_id='+req.query.chapter_id
    // }
  }
  if (req.query.type === "standard") {
    if (req.query.standard_id) {
      whereCondition =
        whereCondition +
        " AND sub_standards.standard_id='" +
        req.query.standard_id +
        "'";
    }
  }
  if (req.query.substandard_id) {
    whereCondition =
      whereCondition +
      " AND sub_standards.id='" +
      req.query.substandard_id +
      "'";
  }
  if (req.query.status) {
    whereCondition =
      whereCondition + " AND sub_standards.status=" + req.query.status;
  }

  let sql = "";
  if (req.query.limit) {
    var limit = parseInt(req.query.limit);

    if (req.query.type == "library") {
      sql = `SELECT sub_standards.* FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${
        req.query.id + whereCondition
      } ORDER by sub_standards.name LIMIT ${limit}`;
    } else if (req.query.type == "chapter") {
      sql = `SELECT sub_standards.* FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id WHERE standards.chapter_id='${req.query.id}'${whereCondition} ORDER by sub_standards.name LIMIT ${limit}`;
    } else if (req.query.type == "standard") {
      sql = `SELECT sub_standards.* FROM sub_standards WHERE sub_standards.standard_id='${req.query.id}' ${whereCondition} ORDER by sub_standards.name LIMIT ${limit}`;
    } else {
      sql = "";
    }
    if (sql == "") {
      res.send({ error: "Must Select type" });
    } else {
      // console.log(sql);
      db.sequelize
        .query(sql, { type: db.sequelize.QueryTypes.SELECT })
        .then((data) => {
          /*
          if (data.length > 0) {
            data.forEach((substandard, key) => {
              db.sequelize
                .query(
                  `select A.id,A.name from users as A left join property_mapping as B on A.id=B.user_id 
          where B.user_id is not null && B.substandard_id=${substandard.id}`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true,
                  }
                )
                .then((updater) => {
                  //console.log(updater);
                  substandard.updater = [...updater];
                  if (key + 1 == data.length) {
                    res.send(data);
                  }
                });
            });
          } else {
            res.send(data);
          }
*/

        data = data.map((el) => ({
            ...el,
            sortItem: el.name,
          })); 
          data = helper.sortAlphanumeric(data);
          res.send(data);
        });
    }
  } else {
    if (req.role_id !== 4 && req.role_id !== 5 && req.role_id !== 6) {
      if (req.query.type == "library") {
        if (req.role_id != 1) {
          organizationWhere = `and prop.organization_id=${req.organization_id} `;
        } else {
          organizationWhere = "";
        }
        sql = `SELECT sub_standards.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM sub_standards  LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id  ${organizationWhere}
          LEFT JOIN users usr ON prop.user_id = usr.id  INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${
            req.query.id + whereCondition
          }  group by id ORDER BY sub_standards.name`;
      } else if (req.query.type == "chapter") {
        if (req.role_id != 1) {
          organizationWhere = `and prop.organization_id=${req.organization_id} `;
        } else {
          organizationWhere = "";
        }
        sql = `SELECT sub_standards.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users  FROM sub_standards LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id ${organizationWhere}  LEFT JOIN users usr ON prop.user_id = usr.id  INNER JOIN standards ON sub_standards.standard_id=standards.id WHERE standards.chapter_id='${req.query.id}'${whereCondition} group by id ORDER BY sub_standards.name`;
      } else if (req.query.type == "standard") {
        if (req.role_id != 1) {
          organizationWhere = `and prop.organization_id=${req.organization_id} `;
        } else {
          organizationWhere = "";
        }
        sql = `SELECT sub_standards.*,GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM sub_standards LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id  ${organizationWhere} LEFT JOIN users usr ON prop.user_id = usr.id  WHERE sub_standards.standard_id='${req.query.id}' ${whereCondition} group by sub_standards.id ORDER BY sub_standards.name`;
      } else {
        sql = "";
      }

      //console.log(sql);

      //  console.log(sql);
      if (sql == "") {
        res.send({ error: "Must Select type" });
      } else {
        db.sequelize
          .query(sql, { type: db.sequelize.QueryTypes.SELECT })
          .then((data) => {

            data = data.map((el) => ({
              ...el,
              sortItem: el.name,
            })); 
            data = helper.sortAlphanumeric(data);

            res.send(data);
          });
      }
    } else {
      if (req.query.type == "library") {
        sql = `SELECT sub_standards.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM sub_standards  LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${
          req.organization_id
        }  LEFT JOIN users usr ON prop.user_id = usr.id  INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE prop.user_id = ${
          req.userId
        } and chapters.library_id=${
          req.query.id + whereCondition
        }  group by id ORDER BY sub_standards.name`;
      } else if (req.query.type == "chapter") {
        sql = `SELECT sub_standards.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users  FROM sub_standards LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id}  LEFT JOIN users usr ON prop.user_id = usr.id  INNER JOIN standards ON sub_standards.standard_id=standards.id WHERE prop.user_id = ${req.userId} and standards.chapter_id='${req.query.id}'${whereCondition} group by id ORDER BY sub_standards.name`;
      } else if (req.query.type == "standard") {
        sql = `SELECT sub_standards.*,  GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM sub_standards LEFT JOIN property_mapping prop  ON sub_standards.id = prop.substandard_id and prop.organization_id=${req.organization_id}  LEFT JOIN users usr ON prop.user_id = usr.id  WHERE prop.user_id = ${req.userId} and sub_standards.standard_id='${req.query.id}'${whereCondition} group by id ORDER BY sub_standards.name`;
      } else {
        sql = "";
      }
      console.log(sql);
      if (sql == "") {
        res.send({ error: "Must Select type" });
      } else {
        db.sequelize
          .query(sql, { type: db.sequelize.QueryTypes.SELECT })
          .then((data) => {

            data = data.map((el) => ({
              ...el,
              sortItem: el.name,
            })); 
            data = helper.sortAlphanumeric(data);
            
            res.send(data);
          });
      }
    }
  }

  // var standardData=await db.sequelize.query(`SELECT standards.* FROM standards INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${req.params.id}`, {
  //   type: db.sequelize.QueryTypes.SELECT
  // })
  // var subStandardData=await db.sequelize.query(`SELECT sub_standards.* FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${req.params.id}`, {
  //   type: db.sequelize.QueryTypes.SELECT
  // })
  // res.send({standardData:standardData,subStandardData:subStandardData})
};

exports.getSelfAssessmentSubstandardByPropMapping = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  let property_mapping_id = req.params.id;
  //console.log(property_mapping_id); process.exit();

  let property_mapping = await db.property_mapping.findOne({
    where: {
      id: property_mapping_id,
    },
    attributes: ["substandard.*"],
    include: [
      {
        model: db.sub_standards,
        as: "substandard",
        attributes: {
          exclude: ["createdAt", "updatedAt", "status", "chapter_id"],
        },
      },
      {
        model: db.standards,
        as: "standard",
        exclude: ["createdAt", "updatedAt", "description", "status"],
      },

      {
        model: db.chapters,
        as: "chapter",
        attributes: {
          exclude: ["createdAt", "updatedAt", "description", "status"],
        },
      },
      {
        model: db.libraries,
        as: "library",
        attributes: {
          exclude: ["createdAt", "updatedAt", "description", "status"],
        },
      },
    ],
  });

  if (property_mapping) {
   
    if (property_mapping.substandard.dataValues.id != null) {
      property_mapping.substandard.dataValues.unitfocus = null;
      property_mapping.substandard.dataValues.updatorScore = null;
      property_mapping.substandard.dataValues.updatorComment = null;

 
      let unitfocus = await db.sequelize.query(
        `select * from unit_focus_areas  where id='${property_mapping.substandard.dataValues.unit_focus_area}'`,
        {
          type: db.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      if (unitfocus.length > 0) {
        property_mapping.substandard.dataValues.unitfocus = unitfocus;
      }
      substandard_id = property_mapping.substandard.dataValues.id;

      // let updatorscoredetail = await db.sequelize.query(
      //   `select * from score_mapping where substanard_id='${substandard_id}' and updator_id =${req.userId}`,
      //   {
      //     type: db.sequelize.QueryTypes.SELECT,
      //     raw: true,
      //   }
      // );

      // if (updatorscoredetail.length > 0) {
      //   property_mapping.substandard.dataValues.updatorScore =
      //     updatorscoredetail[0].updator_score;
      //   property_mapping.substandard.dataValues.updatorComment =
      //     updatorscoredetail[0].updator_comment;
      // }

      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and updator_id =${req.userId}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          //console.log(data);
          if (data[0]) {
            property_mapping.substandard.dataValues.updatorScore =
              data[0].updator_score;
            property_mapping.substandard.dataValues.updatorComment =
              data[0].updator_comment;
          }
        });

      let orgCond = "";

      if (req.role_id > 3) {
        orgCond = ` and B.organization_id in(0,${req.organization_id})`;
      }

      let act = await db.sequelize.query(
        `select A.*,B.admin_activity_id,B.client_activity_id,B.client_activity_id as client_admin_activity  from client_admin_activities as A left join activity_mapping as B on A.id=B.client_activity_id where B.substandard_id='${substandard_id}' ${orgCond}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      property_mapping.substandard.dataValues.activities =
        act.length > 0 ? [...act] : null;

      // console.log(
      //   `select A.*,B.admin_activity_id,B.client_activity_id from admin_activities as A left join activity_mapping as B on A.id=B.admin_activity_id where B.substandard_id='${substandard_id}' ${orgCond}`
      // );

      let adminAct = await db.sequelize.query(
        `select A.*,B.admin_activity_id,B.client_activity_id from admin_activities as A left join activity_mapping as B on A.id=B.admin_activity_id where B.substandard_id='${substandard_id}' ${orgCond}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      //console.log(adminAct);
      if (adminAct.length > 0) {
        activityOrganization = await db.sequelize.query(
          `select A.*,B.admin_activity_id,B.client_activity_id from activities_organization as A left join activity_mapping as B on A.admin_activity_id=B.admin_activity_id where B.substandard_id='${substandard_id}' && A.organization_id='${req.organization_id}' `,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        );

        adminAct.map((x) => {
          let zz = activityOrganization.find((y) => {
            return y.admin_activity_id === x.admin_activity_id;
          });
          if (zz) {
            delete zz.id;
            Object.assign(x, zz);
          }
        });

        let activitiescopyarr = property_mapping.substandard.dataValues
          .activities
          ? [...property_mapping.substandard.dataValues.activities]
          : [];
        property_mapping.substandard.dataValues.activities =
          adminAct.length > 0 ? [...activitiescopyarr, ...adminAct] : null;
      }

      if (property_mapping.substandard.dataValues.activities.length > 0) {
        let idx_act = 0;
        let sql = "";
        for (const activity of property_mapping.substandard.dataValues
          .activities) {
          let fileLink = null;
          //admin_activity_id='${activity.id}' &&

          if (activity.type == 1) {          

              let today = new Date(); 
              let fromdate =
                  today.getFullYear() +
                  "-" +
                  (today.getMonth() + 1) +
                  "-" +
                  today.getDate();
              let todate =
              today.getFullYear() +
              "-" +
              (today.getMonth() + 1) +
              "-" +
              today.getDate();

              filterDate = await helper.getStartAndEndDate(
                fromdate,
                todate,
                activity.response_frequency,
                activity.submission_day);

                let filterDateCond = '';
               
                if(filterDate.startDate && filterDate.endDate) {
                  filterDateCond = `  and  response_date between '${helper.dateFormatUSA(filterDate.startDate)}' and '${ helper.dateFormatUSA(filterDate.endDate) }' `;
                }
               
   

            if (activity.admin_activity_id) {
              sql = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
              storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where admin_activity_id='${activity.id}' ${filterDateCond} && updator_id=${req.userId} && attachment_link is not null`;
            } else {
              sql = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
              storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where client_activity_id='${activity.id}' ${filterDateCond} && updator_id=${req.userId} && attachment_link is not null`;
            }
            // console.log();
            fileLinks = await db.sequelize.query(sql, {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            });
            property_mapping.substandard.dataValues.activities[
              idx_act
            ].fileLink = fileLinks;

            property_mapping.substandard.dataValues.activities[
              idx_act
            ].updaterScore = null;

            if (activity.admin_activity_id) {
              // sql = `
              // select avg(score) as score from storage_activity_checklist_elements as A left join storage_activity_checklist as B on A.storage_id = B.id
              // where admin_activity_id='${activity.id}' && organization_id=${req.headers["organization"]} limit 1
              // `;
              sql = `
               select avg(score) as score from  storage_activity_checklist  where admin_activity_id='${activity.id}' ${filterDateCond} && organization_id=${req.headers["organization"]} `;
            } else {
              sql = `
              select avg(score) as score from  storage_activity_checklist  where client_activity_id='${activity.id}' ${filterDateCond} && organization_id=${req.headers["organization"]} `;
            }

            //   console.log(sql);

            let updatoerSocre = await db.sequelize.query(sql, {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            });

            console.log('updatoerSocre',updatoerSocre);

            if (updatoerSocre && updatoerSocre.length > 0) {
              property_mapping.substandard.dataValues.activities[
                idx_act
              ].updaterScore = updatoerSocre[0].score;
            }
          }

          if (activity.type == 3) {
            actCond = "";

              let today = new Date(); 
              let fromdate =
                  today.getFullYear() +
                  "-" +
                  (today.getMonth() + 1) +
                  "-" +
                  today.getDate();
              let todate =
              today.getFullYear() +
              "-" +
              (today.getMonth() + 1) +
              "-" +
              today.getDate();

              filterDate = await helper.getStartAndEndDate(
                fromdate,
                todate,
                activity.response_frequency,
                activity.submission_day);

                let filterDateCond = '';
               
                if(filterDate.startDate && filterDate.endDate) {
                  filterDateCond = `  and  responsedate between '${helper.dateFormatUSA(filterDate.startDate)}' and '${ helper.dateFormatUSA(filterDate.endDate) }' `;
                }
                 

            if (activity.admin_activity_id) {
              actCond = `&& admin_activity_id='${activity.id}' `;
            } else {
              actCond = `&& client_activity_id='${activity.id}' `;
            }
            fileLinks = await db.sequelize.query(
              `select '' as file_no,document_link as attachment_link from storage_activity_document  where organization_id=${req.organization_id} ${actCond} ${filterDateCond} && updator_id=${req.userId} && document_link is not null`,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            );
            property_mapping.substandard.dataValues.activities[
              idx_act
            ].fileLink = fileLinks;

            property_mapping.substandard.dataValues.activities[
              idx_act
            ].updaterScore = null;

            updatoerSocre = await db.sequelize.query(
              `
              select (case when(document_link is not null) then 100 else 0 end ) as score from storage_activity_document 
              where   organization_id=${req.headers["organization"]} ${actCond} ${filterDateCond} limit 1
              `,
              {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              }
            );

            if (updatoerSocre && updatoerSocre.length > 0) {
              property_mapping.substandard.dataValues.activities[
                idx_act
              ].updaterScore = updatoerSocre[0].score;
            }
          }

          if (activity.type == 2) {
            property_mapping.substandard.dataValues.activities[
              idx_act
            ].fileLink = [];
            actCond = "";
            if (activity.admin_activity_id) {
              actCond = `&& admin_activity_id='${activity.id}' `;
            } else {
              actCond = `&& client_activity_id='${activity.id}' `;
            }
            if (activity.kpi == 1) {
              property_mapping.substandard.dataValues.activities[
                idx_act
              ].updaterScore = null;

           

              updatoerSocre = await db.sequelize.query(
                `
              select score from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id =B.id
              where   organization_id=${req.headers["organization"]} && score !="" ${actCond} limit 1
              `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  raw: true,
                }
              );
 

              if (updatoerSocre && updatoerSocre.length > 0) {
                property_mapping.substandard.dataValues.activities[
                  idx_act
                ].updaterScore = updatoerSocre[0].score;
              }
            } else {
              property_mapping.substandard.dataValues.activities[
                idx_act
              ].updaterScore = null;

              updatoerSocre = await db.sequelize.query(
                `
              select currency as score from storage_observation 
              where  organization_id=${req.headers["organization"]} ${actCond} limit 1
              `,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  raw: true,
                }
              );

              if (updatoerSocre && updatoerSocre.length > 0) {
                property_mapping.substandard.dataValues.activities[
                  idx_act
                ].updaterScore = updatoerSocre[0].score > 0 ? 100 : 0;
              }
            }
          }

          if (
            property_mapping.substandard.dataValues.activities.length ==
            idx_act + 1
          ) {
            res.send(property_mapping);
          }
          idx_act++;
        }
      } else {
        res.send(property_mapping);
      }
    } //substandard exist condition closed
  } else {
    res.send({});
  }

  };

exports.getSelfAssessmentSubstandardByUpdatorOrSurveyor = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  let internalsurveyor = true;

  if (req.params.assigned_role_id === 5) {
    let data = await db.sequelize.query(
      `select * from user_role_company where user_id=${req.userId} and role_id=5`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (data && data.length > 0) {
      if (data[0].surveyor_type === 2) {
        internalsurveyor = false;
      }
    }
  }

  let standardid = req.params.id;
  let session_class_id = req.headers["session_class_id"] || null;

  try {
    results = await db.property_mapping.findOne({
      where: {
        substandard_id: standardid,
        user_id: req.params.assigned_user_id,
      },
      attributes: ["substandard.*"],
      include: [
        {
          model: db.sub_standards,
          as: "substandard",
          attributes: {
            exclude: ["createdAt", "updatedAt", "status", "chapter_id"],
          },
        },
        {
          model: db.standards,
          as: "standard",
          exclude: ["createdAt", "updatedAt", "description", "status"],
        },

        {
          model: db.chapters,
          as: "chapter",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
        {
          model: db.libraries,
          as: "library",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
      ],
    });

    if (results.substandard.dataValues.id != null) {
      await db.sequelize
        .query(
          `select * from unit_focus_areas  where id='${results.substandard.dataValues.unit_focus_area}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((unitfocus) => {
          results.substandard.dataValues.unitfocus =
            unitfocus.length > 0 ? [...unitfocus] : null;
        });
    }

    substandard_id = results.substandard.dataValues.id;

    if (internalsurveyor && req.params.assigned_role_id == 5) {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and internal_surveyor_id =${req.params.assigned_user_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          //  console.log(data);
          if (data.length > 0) {
            results.substandard.dataValues.surveyorScore =
              data[0].internal_surveyor_score;
            results.substandard.dataValues.surveyorComment =
              data[0].internal_surveyor_comment;

            if (data[0].internal_surveyor_score == 2) surveyorScorePer = 100;
            else if (data[0].internal_surveyor_score == 1)
              surveyorScorePer = 50;
            else surveyorScorePer = null;
            results.substandard.dataValues.surveyorScorePer = surveyorScorePer;
          } else {
            results.substandard.dataValues.surveyorScore = null;
            results.substandard.dataValues.surveyorComment = null;
            results.substandard.dataValues.surveyorScorePer = null;
          }
        })
        .catch((error) => {
          console.log("error in scoremapping");
          console.log(error);
        });
    } else if (!internalsurveyor && assigned_role_id == 5) {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and external_surveyor_id =${req.params.assigned_user_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          // console.log(data);
          if (data.length > 0) {
            results.substandard.dataValues.surveyorScore =
              data[0].external_surveyor_score;
            results.substandard.dataValues.surveyorComment =
              data[0].external_surveyor_comment;
            if (data[0].external_surveyor_score == 2) surveyorScorePer = 100;
            else if (data[0].external_surveyor_score == 1)
              surveyorScorePer = 50;
            else surveyorScorePer = null;
            results.substandard.dataValues.surveyorScorePer = surveyorScorePer;
          } else {
            results.substandard.dataValues.surveyorScore = null;
            results.substandard.dataValues.surveyorComment = null;
            results.substandard.dataValues.surveyorScorePer = null;
          }
        });
    } else {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and updator_id =${req.params.assigned_user_id}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          if (data.length > 0) {
            results.substandard.dataValues.updatorScore = data[0].updator_score;
            results.substandard.dataValues.updatorComment =
              data[0].updator_comment;
          } else {
            results.substandard.dataValues.updatorScore = 0;
            results.substandard.dataValues.updatorComment = null;
          }
        });
    }

    results.substandard.dataValues.sessionClass = null;
    results.substandard.dataValues.surveyorCategory = null;

    if (
      results.substandard.dataValues.surveyor_category_id &&
      results.substandard.dataValues.surveyor_category_id.includes(",")
    ) {
      temp = results.substandard.dataValues.surveyor_category_id.split(",");
      var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
      let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
      // console.log(query);
      results.substandard.dataValues.surveyorCategory =
        await db.sequelize.query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        });
    } else if (results.substandard.dataValues.surveyor_category_id) {
      let query = `select * from surveyor_categories where id in ('${results.substandard.dataValues.surveyor_category_id}')`;
      // console.log(query);
      results.substandard.dataValues.surveyorCategory =
        await db.sequelize.query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        });
    }

    if (session_class_id) {
      let query = `select * from session_classes where id = '${session_class_id}'`;

      //console.log(query);
      results.substandard.dataValues.sessionClass = await db.sequelize.query(
        query,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      if (
        results.substandard.dataValues.session_class_id &&
        results.substandard.dataValues.session_class_id.includes(",")
      ) {
        sessiontemp =
          results.substandard.dataValues.session_class_id.split(",");
        var sessioninlist = "'" + sessiontemp.join("','") + "'";
        let query = `select * from session_classes where id in (${sessioninlist})`;
        //console.log(query);
        results.substandard.dataValues.sessionClass = await db.sequelize.query(
          query,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      } else if (results.substandard.dataValues.session_class_id) {
        let query = `select * from session_classes where id in ('${results.substandard.dataValues.session_class_id}')`;

        //console.log(query);
        results.substandard.dataValues.sessionClass = await db.sequelize.query(
          query,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      }
    }

    let sqlActivity = "";

    sqlActivity = `select A.* from activities_organization as A left join activity_mapping as B on A.admin_activity_id=B.admin_activity_id where B.substandard_id='${substandard_id}' and B.organization_id in (${org_id},0)
   UNION
   select A.id , null as admin_activity_id, A.id as client_admin_activity, A.type, A.code, A.description, A.type, A.name, A.response_frequency, A.submission_day, A.organization_id, A.organization_type, A.type_of_measure, A.aggregation_type, A.kpi,A.kpi_name,A.observation_name,A.observation_type, A.currency_type,A.document_name, A.document_link, A.expiry_days, A.status,A.createdAt, A.updatedAt, null as document_description from client_admin_activities as A left join activity_mapping as B on A.id=B.client_activity_id where B.substandard_id='${substandard_id}' and B.organization_id in (${org_id},0)`;

    if (
      req.params.assigned_role_id == 5 ||
      req.params.assigned_role_id == 4 ||
      req.params.assigned_role_id == 6
    ) {
      sqlActivity = `
    select C.id,C.id as admin_activity_id, null as client_admin_activity,C.type,C.code, C.description,C.name,C.response_frequency,C.submission_day, '' as organization_id,
    '' as organization_type,C.type_of_measure,C.aggregation_type,C.kpi,C.kpi_name,C.observation_name,C.observation_type, C.currency_type,
    C.document_name, C.document_link, C.expiry_days, C.status,C.createdAt,C.updatedAt, null as document_description  from property_mapping as A left join activity_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id 
    left join admin_activities as C on B.admin_activity_id=C.id
    where A.user_id=${req.params.assigned_user_id} && A.role_id='${req.params.assigned_role_id}' && A.substandard_id='${substandard_id}'  and B.organization_id in (${org_id},0) and C.id is not null
    union
    select C.id,null as admin_activity_id, C.id as client_admin_activity,C.type,C.code, C.description,C.name,C.response_frequency,C.submission_day, C.organization_id,
    C.organization_type,C.type_of_measure,C.aggregation_type,C.kpi,C.kpi_name,C.observation_name,C.observation_type, C.currency_type,
    C.document_name, C.document_link, C.expiry_days, C.status,C.createdAt,C.updatedAt, null as document_description  from property_mapping as A left join activity_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id 
    left join client_admin_activities as C on B.client_activity_id=C.id
    where A.user_id=${req.params.assigned_user_id} && A.role_id='${req.params.assigned_role_id}' && A.substandard_id='${substandard_id}'  and B.organization_id in (${org_id},0) and C.id is not null     
     `;
    }

    //console.log(sqlActivity);

    db.sequelize
      .query(sqlActivity, {
        type: db.sequelize.QueryTypes.SELECT,
        raw: true,
      })
      .then(async (data) => {
        var custom_activities = [];
        for (let index = 0; index < data.length; index++) {
          if (data[index].admin_activity_id) {
            custom_activities.push(data[index].id);
          }
        }

        if (custom_activities.length > 0) {
          var client_activity = await db.activities_organization.findAll({
            where: {
              admin_activity_id: { [Op.in]: [custom_activities] },
              organization_id: req.organization_id,
            },
          });

          data.map((x) => {
            zz = client_activity.find((y) => {
              return y.admin_activity_id === x.admin_activity_id;
            });
            if (zz) {
              delete zz.dataValues["id"];
              Object.assign(x, zz.dataValues);
            }
          });
        }

        results.substandard.dataValues.activities =
          data.length > 0 ? [...data] : null;

        if (data.length > 0) {
          index = 0;
          for (const activity of results.substandard.dataValues.activities) {
            let sqlFile = "";
            results.substandard.dataValues.activities[index].fileLink = null;
            if (activity.admin_activity_id) {
              if (activity.type == 1) {
                sql = `select avg(score) as score from storage_activity_checklist where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                sqlFile = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
                storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where admin_activity_id='${activity.id}'  && (attachment_link is not null || attachment_link !='')`;
              } else if (activity.type == 2) {
                if (activity.kpi == 1) {
                  sql = `select avg(score) as score from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                } else {
                  sql = `select avg(case when currency is not null then 100 else 0 end) as score from storage_observation where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                }
              } else {
                sql = `select avg(case when document_link is not null then 100 else 0 end ) as score from storage_activity_document where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                sqlFile = `select '' as file_no,document_link as attachment_link from storage_activity_document  where organization_id=${req.organization_id} && admin_activity_id='${activity.id}'  && (document_link is not null || document_link !='' )`;
              }
            } else {
              if (activity.type == 1) {
                sql = `select avg(score) as score from storage_activity_checklist where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                sqlFile = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
              storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where client_activity_id='${activity.id}'  && (attachment_link is not null || attachment_link !='' )`;
              } else if (activity.type == 2) {
                if (activity.kpi == 1) {
                  sql = `select avg(score) as score from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                } else {
                  sql = `select avg(case when currency is not null then 100 else 0 end) as score from storage_observation where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                  // console.log(sql);
                }
              } else {
                sql = `select avg(case when document_link is not null then 100 else 0 end ) as score from storage_activity_document where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                sqlFile = `select '' as file_no,document_link as attachment_link from storage_activity_document  where organization_id=${req.organization_id} && client_activity_id='${activity.id}'  && (document_link is not null || document_link !='' )`;
              }
            }

            scores = await db.sequelize.query(sql, {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            });

            if (activity.type == 1 || activity.type == 3) {
              fileLinks = await db.sequelize.query(sqlFile, {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              });

              results.substandard.dataValues.activities[index].fileLink =
                fileLinks;
            }

            if (scores) {
              results.substandard.dataValues.activities[index].updatorscore =
                scores[0].score;
            } else {
              results.substandard.dataValues.activities[index].updatorscore =
                null;
            }

            //results.substandard.dataValues.activities[index].fileLink = [];

            index++;
          }
        }

        res.send(results);
      });
  } catch (error) {
    //console.log(error);
    res.send([]);
  }
};

exports.getSelfAssessmentSubstandard = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  let internalsurveyor = true;

  if (req.role_id === 5) {
    let data = await db.sequelize.query(
      `select * from user_role_company where user_id=${req.userId} and role_id=5`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (data && data.length > 0) {
      if (data[0].surveyor_type === 2) {
        internalsurveyor = false;
      }
    }
  }

  let standardid = req.params.id;
  let session_class_id = req.headers["session_class_id"] || null;

  try {
    let results = await db.property_mapping.findOne({
      where: {
        substandard_id: standardid,
        user_id: req.userId,
      },
      attributes: ["substandard.*"],
      include: [
        {
          model: db.sub_standards,
          as: "substandard",
          attributes: {
            exclude: ["createdAt", "updatedAt", "status", "chapter_id"],
          },
        },
        {
          model: db.standards,
          as: "standard",
          exclude: ["createdAt", "updatedAt", "description", "status"],
        },

        {
          model: db.chapters,
          as: "chapter",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
        {
          model: db.libraries,
          as: "library",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
      ],
    });

    if (results.substandard.dataValues.id != null) {
      await db.sequelize
        .query(
          `select * from unit_focus_areas  where id='${results.substandard.dataValues.unit_focus_area}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((unitfocus) => {
          results.substandard.dataValues.unitfocus =
            unitfocus.length > 0 ? [...unitfocus] : null;
        });
    }

    let substandard_id = results.substandard.dataValues.id;

    if (internalsurveyor && req.role_id === 5) {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and internal_surveyor_id =${req.userId}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          //  console.log(data);
          if (data.length > 0) {
            results.substandard.dataValues.surveyorScore =
              data[0].internal_surveyor_score;
            results.substandard.dataValues.surveyorComment =
              data[0].internal_surveyor_comment;

            if (data[0].internal_surveyor_score == 2) surveyorScorePer = 100;
            else if (data[0].internal_surveyor_score == 1)
              surveyorScorePer = 50;
            else surveyorScorePer = null;
            results.substandard.dataValues.surveyorScorePer = surveyorScorePer;
          } else {
            results.substandard.dataValues.surveyorScore = null;
            results.substandard.dataValues.surveyorComment = null;
            results.substandard.dataValues.surveyorScorePer = null;
          }
        })
        .catch((error) => {
          //  console.log("error in scoremapping");
          console.log(error);
        });
    } else if (!internalsurveyor && req.role_id === 5) {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and external_surveyor_id =${req.userId}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          // console.log(data);
          if (data.length > 0) {
            results.substandard.dataValues.surveyorScore =
              data[0].external_surveyor_score;
            results.substandard.dataValues.surveyorComment =
              data[0].external_surveyor_comment;
            if (data[0].external_surveyor_score == 2) surveyorScorePer = 100;
            else if (data[0].external_surveyor_score == 1)
              surveyorScorePer = 50;
            else surveyorScorePer = null;
            results.substandard.dataValues.surveyorScorePer = surveyorScorePer;
          } else {
            results.substandard.dataValues.surveyorScore = null;
            results.substandard.dataValues.surveyorComment = null;
            results.substandard.dataValues.surveyorScorePer = null;
          }
        });
    } else {
      db.sequelize
        .query(
          `select * from score_mapping where substanard_id='${substandard_id}' and updator_id =${req.userId}`,
          {
            type: db.sequelize.QueryTypes.SELECT,
            raw: true,
          }
        )
        .then((data) => {
          results.substandard.dataValues.updatorScore = data[0].updator_score;
          results.substandard.dataValues.updatorComment =
            data[0].updator_comment;
        });
    }

    results.substandard.dataValues.sessionClass = null;
    results.substandard.dataValues.surveyorCategory = null;

    if (
      results.substandard.dataValues.surveyor_category_id &&
      results.substandard.dataValues.surveyor_category_id.includes(",")
    ) {
      temp = results.substandard.dataValues.surveyor_category_id.split(",");
      var quotedAndCommaSeparated = "'" + temp.join("','") + "'";
      let query = `select * from surveyor_categories where id in (${quotedAndCommaSeparated})`;
      //console.log(query);
      results.substandard.dataValues.surveyorCategory =
        await db.sequelize.query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        });
    } else if (results.substandard.dataValues.surveyor_category_id) {
      let query = `select * from surveyor_categories where id in ('${results.substandard.dataValues.surveyor_category_id}')`;
      //console.log(query);
      results.substandard.dataValues.surveyorCategory =
        await db.sequelize.query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        });
    }

    if (session_class_id) {
      let query = `select * from session_classes where id = '${session_class_id}'`;

      //console.log(query);
      results.substandard.dataValues.sessionClass = await db.sequelize.query(
        query,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      if (
        results.substandard.dataValues.session_class_id &&
        results.substandard.dataValues.session_class_id.includes(",")
      ) {
        sessiontemp =
          results.substandard.dataValues.session_class_id.split(",");
        var sessioninlist = "'" + sessiontemp.join("','") + "'";
        let query = `select * from session_classes where id in (${sessioninlist})`;
        //console.log(query);
        results.substandard.dataValues.sessionClass = await db.sequelize.query(
          query,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      } else if (results.substandard.dataValues.session_class_id) {
        let query = `select * from session_classes where id in ('${results.substandard.dataValues.session_class_id}')`;

        //console.log(query);
        results.substandard.dataValues.sessionClass = await db.sequelize.query(
          query,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      }
    }

    const activity_session_mapping_arr =
      await db.activity_session_mapping.findAll({
        where: {
          session_class_id: req.headers["session_class_id"],
          [Op.or]: [
            {
              organization_id: {
                [Op.eq]: null,
              },
            },
            {
              organization_id: {
                [Op.eq]: req.organization_id,
              },
            },
          ],
        },
        // logging: console.log,
      });

    let admin_ids = activity_session_mapping_arr
      .filter((el) => el.admin_activity_id !== null)
      .map((el) => el.admin_activity_id);

    if (admin_ids.length > 0) {
      admin_ids = "'" + admin_ids.join("','") + "'";
    } else admin_ids = null;

    //console.log(admin_ids);

    let client_ids = activity_session_mapping_arr
      .filter((el) => el.client_activity_id !== null)
      .map((el) => el.client_activity_id);

    if (client_ids.length > 0) {
      client_ids = "'" + client_ids.join("','") + "'";
    } else client_ids = null;

    let sqlActivity = "";
    console.log("-------------------------------------------");
    sqlActivity = `select A.* from activities_organization as A left join activity_mapping as B on A.admin_activity_id=B.admin_activity_id where B.substandard_id='${substandard_id}' and B.organization_id in (${org_id},0) and admin_activity_id in (${admin_ids})
   UNION
   select A.id , null as admin_activity_id, A.id as client_admin_activity, A.type, A.code, A.description, A.type, A.name, A.response_frequency, A.submission_day, A.organization_id, A.organization_type, A.type_of_measure, A.aggregation_type, A.kpi,A.kpi_name,A.observation_name,A.observation_type, A.currency_type,A.document_name, A.document_link, A.expiry_days, A.status,A.createdAt, A.updatedAt, null as document_description from client_admin_activities as A left join activity_mapping as B on A.id=B.client_activity_id where B.substandard_id='${substandard_id}' and B.organization_id in (${org_id},0)  and id in (${client_ids})`;

    if (req.role_id == 5 || req.role_id == 4 || req.role_id == 6) {
      sqlActivity = `
    select C.id,C.id as admin_activity_id, null as client_admin_activity,C.type,C.code, C.description,C.name,C.response_frequency,C.submission_day, '' as organization_id,
    '' as organization_type,C.type_of_measure,C.aggregation_type,C.kpi,C.kpi_name,C.observation_name,C.observation_type, C.currency_type,
    C.document_name, C.document_link, C.expiry_days, C.status,C.createdAt,C.updatedAt, null as document_description  from property_mapping as A left join activity_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id  and B.admin_activity_id in (${admin_ids})
    left join admin_activities as C on B.admin_activity_id=C.id
    where A.user_id=${req.userId} && A.role_id=5 && A.substandard_id='${substandard_id}'  and B.organization_id in (${org_id},0) and C.id is not null
    union
    select C.id,null as admin_activity_id, C.id as client_admin_activity,C.type,C.code, C.description,C.name,C.response_frequency,C.submission_day, C.organization_id,
    C.organization_type,C.type_of_measure,C.aggregation_type,C.kpi,C.kpi_name,C.observation_name,C.observation_type, C.currency_type,
    C.document_name, C.document_link, C.expiry_days, C.status,C.createdAt,C.updatedAt, null as document_description  from property_mapping as A left join activity_mapping as B on A.substandard_id=B.substandard_id && A.standard_id=B.standard_id   and B.client_activity_id in (${client_ids})
    left join client_admin_activities as C on B.client_activity_id=C.id
    where A.user_id=${req.userId} && A.role_id=5 && A.substandard_id='${substandard_id}'  and B.organization_id in (${org_id},0) and C.id is not null     
     `;
    }

    db.sequelize
      .query(sqlActivity, {
        type: db.sequelize.QueryTypes.SELECT,
        raw: true,
      })
      .then(async (data) => {
        let custom_activities = [];
        for (let index = 0; index < data.length; index++) {
          if (data[index].admin_activity_id) {
            custom_activities.push(data[index].id);
          }
        }

        if (custom_activities.length > 0) {
          let client_activity = await db.activities_organization.findAll({
            where: {
              admin_activity_id: { [Op.in]: [custom_activities] },
              organization_id: req.organization_id,
            },
          });

          data.map((x) => {
            zz = client_activity.find((y) => {
              return y.admin_activity_id === x.admin_activity_id;
            });
            if (zz) {
              delete zz.dataValues["id"];
              Object.assign(x, zz.dataValues);
            }
          });
        }

        results.substandard.dataValues.activities =
          data.length > 0 ? [...data] : null;

        if (data.length > 0) {
          let index = 0;
          for (const activity of results.substandard.dataValues.activities) {
            let sqlFile = "";
            let sql = "";
            results.substandard.dataValues.activities[index].fileLink = null;
            if (activity.admin_activity_id) {
              if (activity.type == 1) {
                sql = `select avg(score) as score from storage_activity_checklist where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                sqlFile = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
                storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where admin_activity_id='${activity.id}'  && (attachment_link is not null || attachment_link !='')`;
              } else if (activity.type == 2) {
                if (activity.kpi == 1) {
                  sql = `select avg(score) as score from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                } else {
                  sql = `select avg(case when currency is not null then 100 else null end) as score from storage_observation where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                }
              } else {
                sql = `select avg(case when document_link is not null then 100 else 0 end ) as score from storage_activity_document where admin_activity_id='${activity.admin_activity_id}' && organization_id=${req.organization_id}`;
                sqlFile = `select '' as file_no,document_link as attachment_link from storage_activity_document  where organization_id=${req.organization_id} && admin_activity_id='${activity.id}'  && (document_link is not null || document_link !='' )`;
              }
            } else {
              if (activity.type == 1) {
                sql = `select avg(score) as score from storage_activity_checklist where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                sqlFile = `select file_no,attachment_link from storage_activity_checklist_elements as A left join 
                storage_activity_checklist as B on A.storage_id=B.id && B.organization_id=${req.organization_id} where client_activity_id='${activity.id}'  && (attachment_link is not null || attachment_link !='' )`;
              } else if (activity.type == 2) {
                if (activity.kpi == 1) {
                  sql = `select avg(score) as score from storage_activity_kpi_elements as A left join storage_activity_kpi as B on A.storage_id=B.id where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                } else {
                  sql = `select avg(case when currency is not null then 100 else null end) as score from storage_observation where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                }
              } else {
                sql = `select avg(case when document_link is not null then 100 else 0 end ) as score from storage_activity_document where client_activity_id=${activity.client_admin_activity} && organization_id=${req.organization_id}`;
                sqlFile = `select '' as file_no,document_link as attachment_link from storage_activity_document  where organization_id=${req.organization_id} && client_activity_id='${activity.id}'  && (document_link is not null || document_link !='' )`;
              }
            }

            //console.log(sql);

            let scores = await db.sequelize.query(sql, {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            });

            if (activity.type == 1 || activity.type == 3) {
              fileLinks = await db.sequelize.query(sqlFile, {
                type: db.sequelize.QueryTypes.SELECT,
                raw: true,
              });

              results.substandard.dataValues.activities[index].fileLink =
                fileLinks;
            }

            if (scores) {
              results.substandard.dataValues.activities[index].updatorscore =
                scores[0].score;
            } else {
              results.substandard.dataValues.activities[index].updatorscore =
                null;
            }

            index++;
          }
        }

        res.send(results);
      });
  } catch (error) {
    //console.log(error);
    res.send([]);
  }
};

exports.getByAssignUpdatorId = (req, res) => {
   
 
  db.sequelize
    .query(
      `select lib.id as library_id, lib.code as library_code, lib.name as library_name,
    lib.description as library_desc,std.id as standard_id, std.code as standard_code, std.name as standard_name,
    std.description as standard_desc, sub.id as substandard_id, sub.code as substandard_code,
    sub.name as substandard_name, sub.description as substandard_desc, sub.esr as esr, sub.surveyor_category_id as 
    surveyor_category_id, sub.session_class_id as session_class_id, sub.unit_focus_area as unit_focus_area,
    chp.id as chapter_id, chp.name as chapter_name, chp.code as chapter_code, chp.description as chapter_desc,
    score.updator_score as updator_score,
    (case 
      when score.updator_score=2 then 100
      when score.updator_score=1 then 50
      when score.updator_score=0 then 0 
      end) as updator_score_per, 
    score.updator_assesment_date as updator_assesment_date,  
    score.updator_comment as updator_comment,pm.id as id
    from property_mapping pm INNER join sub_standards sub on pm.substandard_id = sub.id 
    INNER JOIN standards std on sub.standard_id = std.id 
    INNER JOIN chapters chp on std.chapter_id = chp.id
    INNER JOIN libraries lib on chp.library_id = lib.id
    LEFT JOIN score_mapping score on sub.id = score.substanard_id and 
    score.updator_id=${req.userId} and score.organization_id=${req.organization_id}
    where pm.user_id=${req.userId} and pm.organization_id=${req.organization_id} group by pm.substandard_id order by sub.name`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    )
    .then((data) => {
      data = data.map(el=>({...el,sortItem: el.substandard_name}));      
      data.sort(helper.compare);
      data = helper.sortAlphanumeric(data);
      // console.log(data.map(el=>({sortItem :el.sortItem})));
      res.send(data);
    })
    .catch((err) => res.status(500).send({ error: err }));

  /*

  db.property_mapping
    .findAll({
      where: {
        organization_id: req.organization_id,
        user_id: req.userId,
      },
      include: [
        {
          model: db.standards,
          as: "standard",
        },
        {
          model: db.sub_standards,
          as: "substandard",
          attributes: {
            exclude: ["createdAt", "updatedAt", "status", "chapter_id"],
          },
        },
        {
          model: db.chapters,
          as: "chapter",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
        {
          model: db.libraries,
          as: "library",
          attributes: {
            exclude: ["createdAt", "updatedAt", "description", "status"],
          },
        },
      ],
    })
    .then((results) => {
      //console.log(results);
      results.forEach((result, key) => {
        // console.log(result);
        //console.log(result.standard_id);

        //console.log(`select updator_score,updator_comment from score_mapping where organization_id='${result.organization_id}' and substanard_id='${result.substandard_id}' and standard_id='${result.standard_id}' and chapter_id='${result.chapter_id}' and library_id='${result.library_id}'`);

        db.sequelize
          .query(
            `select updator_score,updator_comment from score_mapping where organization_id='${result.organization_id}' and substanard_id='${result.substandard_id}' and standard_id='${result.standard_id}' and chapter_id='${result.chapter_id}' and library_id='${result.library_id}' and updator_id='${req.userId}'`,
            {
              type: db.sequelize.QueryTypes.SELECT,
              raw: true,
            }
          )
          .then((score) => {
            result.dataValues.score = score.length > 0 ? [...score] : null;
            if (key + 1 == results.length) {
              res.send(results);
            }
          })
          .catch((err) => res.status(500).send({ error: err }));
      });
    })
    .catch((err) => res.status(500).send({ error: err }));
    */
};
