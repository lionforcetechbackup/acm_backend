const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
const helper = require("../util/helper");

exports.create = async (req, res) => {
  var code = await db.chapters.findOne({
    where: {
      id: req.body.chapter_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var standard = await db.standards.findAll({
    where: {
      chapter_id: req.body.chapter_id,
      name: req.body.name,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  if (standard.length == 0) {
    try {
      var standard_id = crypto
        .createHash("sha256")
        .update(
          req.body.name +
            "_" +
            req.body.chapter_id +
            "_" +
            code.dataValues.library_id
        )
        .digest("hex");

      await db.standards
        .create({
          id: standard_id,
          chapter_id: req.body.chapter_id,
          name: req.body.name,
          code: code.dataValues.code + "." + req.body.name,
          description: req.body.description,
          status: master.status.active,
        })
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "standards",
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
      res.send(error);
    }
  } else {
    res.send({ error: "Standard Name already used!" });
  }
};
exports.update = async (req, res) => {
  var standard = await db.standards.findAll({
    where: {
      chapter_id: req.body.chapter_id,
      name: req.body.name,
      id: { [Op.notIn]: [req.body.id] },
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  var code = await db.chapters.findOne({
    where: {
      id: req.body.chapter_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  if (standard.length == 0) {
    db.standards
      .update(
        {
          chapter_id: req.body.chapter_id,
          name: req.body.name,
          code: code.dataValues.code + "." + req.body.name,
          description: req.body.description,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        standards_code = code.dataValues.code + "." + req.body.name;
        // Sub Standard
        db.sub_standards
          .findAll({
            where: {
              standard_id: req.body.id,
            },
          })
          .then((data3) => {
            if (data3.length > 0) {
              data3.forEach((sub_standards, key) => {
                var sub_standards_code =
                  standards_code + "." + sub_standards.name;
                db.sub_standards.update(
                  {
                    code: sub_standards_code,
                  },
                  {
                    where: { id: sub_standards.id },
                  }
                );
              });
            }
          });
        // sub standard

        auditCreate.create({
          user_id: req.userId,
          table_name: "standards",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
      });
  } else {
    res.send({ error: "Standard Name Already Used!" });
  }
};
exports.get = async (req, res) => {
  // console.log("hi");
  db.standards
    .findAll({
      attributes: ["id", "chapter_id", "name", "code"],
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },

      order: [["id", "DESC"]],
    })
    .then((data) => res.send(data));
};

exports.getById = async (req, res) => {
  db.standards
    .findAll({
      where: {
        id: req.params.id,
      },
    })
    .then((data) => res.send(data));
};

exports.delete = async (req, res) => {
  //db.standards.destroy({
  //      where:{
  //   id:req.params.id
  // }
  // db.standards.update({
  //   status: master.status.delete
  // }, {
  //   where: { id: req.params.id }
  // }).then((data) =>{
  //   auditCreate.create({"user_id":req.userId,'table_name':"standards",'primary_id':req.params.id,'event':"delete",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
  //    res.send("deleted")});
  var standards = await db.standards.destroy(
    { status: master.status.delete },
    { where: { id: req.params.id } }
  );
  await db.sub_standards.destroy( 
    { where: { standard_id: req.params.id } }
  );
  await auditCreate.create({
    user_id: req.userId,
    table_name: "libraries",
    primary_id: standards[0],
    event: "delete",
    new_value: standards,
    url: req.url,
    user_agent: req.headers["user-agent"],
    ip_address: req.connection.remoteAddress,
  });
  res.send("deleted");
};
exports.statusChange = async (req, res) => {
  db.standards
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

exports.getChapterById = async (req, res) => {
    
  db.standards
    .findAll({
      where: {
        chapter_id: req.params.id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      order: [["name"]],
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
exports.getBylibraryId = async (req, res) => {
  //standard search
  var whereCondition = "";
  if (req.query.chapter_id) {
    whereCondition = " AND standards.chapter_id='" + req.query.chapter_id + "'";
  }

  if (req.query.standard_id) {
    whereCondition = " AND standards.id='" + req.query.standard_id + "'";
  }
  if (req.query.status) {
    whereCondition =
      whereCondition + " AND standards.status=" + req.query.status;
  }
  whereCondition =
    whereCondition + " AND standards.status !=" + master.status.delete;

  if (req.query.limit) {
    var limit = parseInt(req.query.limit);
    db.sequelize
      .query(
        `SELECT standards.* FROM standards INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${
          req.query.id + whereCondition
        } ORDER BY standards.name  LIMIT ${limit}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((data) => {
        /* if (data.length > 0) {
          data.forEach((standard, key) => {
            db.sequelize
              .query(
                `select A.id,A.name from users as A left join property_mapping as B on A.id=B.user_id 
          where B.user_id is not null && B.standard_id=${standard.id}`,
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  raw: true,
                }
              )
              .then((updater) => {
                standard.updater = [...updater];
                if (key + 1 == data.length) {
                  res.send(data);
                }
              });
          });
        } else {
          res.send(data);
        }*/

        data = data.map((el) => ({
          ...el,
          sortItem: el.name,
        }));
        data = helper.sortAlphanumeric(data);
        res.send(data);
      });
  } else {
    if (req.role_id !== 4 && req.role_id !== 5 && req.role_id !== 6) {
      if (req.role_id == 1) {
        //for superadmin no need organization filter
        query = `SELECT standards.* ,GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM standards standards 
        LEFT JOIN property_mapping prop  ON standards.id = prop.standard_id 
        LEFT JOIN users usr ON prop.user_id = usr.id INNER JOIN chapters ON standards.chapter_id=chapters.id 
        WHERE  chapters.library_id='${req.query.id}'  ${whereCondition}  group by standards.id order by standards.name`;
      } else {
        query = `SELECT standards.* , GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM standards standards LEFT JOIN property_mapping prop  ON standards.id = prop.standard_id and prop.organization_id=${
          req.organization_id
        }  LEFT JOIN users usr ON prop.user_id = usr.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE  chapters.library_id=
      ${
        req.query.id + whereCondition
      } group by standards.id order by standards.name`;
      }
      db.sequelize
        .query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        })
        .then((data) => {
          data = data.map((el) => ({
            ...el,
            sortItem: el.name,
          }));
          data = helper.sortAlphanumeric(data);
          res.send(data);
        })
        .catch((error) => res.send(error));
    } else {
      db.sequelize
        .query(
          `SELECT standards.* , GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM standards standards LEFT JOIN property_mapping prop  ON standards.id = prop.standard_id and prop.organization_id=${
            req.organization_id
          }  LEFT JOIN users usr ON prop.user_id = usr.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE (prop.user_id = ${
            req.userId
          }  or (prop.assignto=${
            req.userId
          } && prop.expirydate >= CURDATE()) ) and chapters.library_id=
        ${
          req.query.id + whereCondition
        } group by standards.id order by standards.name`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
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

  // var standardData=await db.sequelize.query(`SELECT standards.* FROM standards INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${req.params.id}`, {
  //   type: db.sequelize.QueryTypes.SELECT
  // })
  // var subStandardData=await db.sequelize.query(`SELECT sub_standards.* FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id WHERE chapters.library_id=${req.params.id}`, {
  //   type: db.sequelize.QueryTypes.SELECT
  // })
  // res.send({standardData:standardData,subStandardData:subStandardData})
};
