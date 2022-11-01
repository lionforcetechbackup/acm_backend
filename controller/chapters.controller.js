const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const property_mapping = require("../models/property_mapping");
const crypto = require("crypto");

abbrevation = (str) => {
  var matches = str.match(/\b(\w)/g); // ['J','S','O','N']
  var acronym = matches.join(""); // JSON
  return acronym;
};
exports.create = async (req, res) => {
  if (req.body.name != "") {
    var codeCreate = abbrevation(req.body.name).toUpperCase();
  } else {
    var codeCreate = "";
  }

  var chapter = await db.chapters.findAll({
    where: {
      library_id: req.body.library_id,
      name: req.body.name,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  //console.log(chapter);

  var codeCount = await db.chapters.count({
    where: {
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var code = await db.libraries.findOne({
    where: {
      id: req.body.library_id,
    },
  });
  //console.log(chapter.length);
  if (chapter.length == 0) {
    var chapter_id = crypto
      .createHash("sha256")
      .update(req.body.name + "_" + req.body.library_id)
      .digest("hex");

    db.chapters
      .create({
        id: chapter_id,
        library_id: req.body.library_id,
        code: code.dataValues.code + "." + codeCreate,
        name: req.body.name,
        description: req.body.description,
        status: master.status.active,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "chapters",
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
  } else {
    res.send({ error: "Chapter Name already used!" });
  }
};
exports.update = async (req, res) => {
  var chapter = await db.chapters.findAll({
    where: {
      library_id: req.body.library_id,
      name: req.body.name,
      id: { [Op.notIn]: [req.body.id] },
      status: { [Op.notIn]: [master.status.delete] },
    },
  });

  var code = await db.libraries.findOne({
    where: {
      id: req.body.library_id,
    },
  });

  if (req.body.name != "") {
    //var codeCreate = abbrevation(req.body.name).toUpperCase();
    var codeCreate = req.body.name;
  } else {
    var codeCreate = "";
  }

  //console.log(chapter.length);
  if (chapter.length == 0) {
    db.chapters
      .update(
        {
          library_id: req.body.library_id,
          name: req.body.name,
          code: code.dataValues.code + "." + codeCreate,
          description: req.body.description,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        chapter_code = code.dataValues.code + "." + codeCreate;

        // Standard
        db.standards
          .findAll({
            where: {
              chapter_id: req.body.id,
            },
          })
          .then((data2) => {
            if (data2.length > 0) {
              data2.forEach((standards, key) => {
                var standards_code = chapter_code + "." + standards.name;
                db.standards.update(
                  {
                    code: standards_code,
                  },
                  {
                    where: { id: standards.id },
                  }
                );

                // Sub Standard
                db.sub_standards
                  .findAll({
                    where: {
                      standard_id: standards.id,
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
              });
            }
          });
        // Standard

        auditCreate.create({
          user_id: req.userId,
          table_name: "chapters",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("success");
      });
  } else {
    res.send({ error: "Chapter Name Already Use!" });
  }
};
exports.get = async (req, res) => {
  db.chapters
    .findAll({
      attributes: ["id", "library_id", "name", "code"],
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
      include: [
        {
          model: db.libraries,
          as: "libraryjoin",
        },
      ],
      order: [["id", "DESC"]],
    })
    .then((data) => {
      res.send(data);
    });
};

exports.getById = async (req, res) => {
  db.chapters
    .findAll({
      where: {
        id: req.params.id,
      },
    })
    .then((data) => {
      res.send(data);
    });
};

exports.getByLibraryId = async (req, res) => {
  //console.log(req.query.id);
  where = {
    library_id: req.query.id,
    status: { [Op.notIn]: [master.status.delete] },
  };

  var whereclause = ` chp.library_id=${req.query.id}`;

  if (req.query.chapter_id) {
    where.id = req.query.chapter_id;
    whereclause = whereclause + ` and chp.id='${req.query.chapter_id}'`;
  }
  if (req.query.status) {
    where.status = req.query.status;
  }
  if (req.query.limit) {
    var limit = parseInt(req.query.limit);
    db.chapters
      .findAll({ where, limit: limit, order: [["id", "DESC"]] })
      .then((data) => {
        res.send(data);
      });
  } else {
    if (req.role_id == 1) {
      db.sequelize
        .query(
          `SELECT  chp.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM  chapters chp  LEFT JOIN property_mapping prop  ON chp.id = prop.chapter_id  LEFT JOIN users usr ON prop.user_id = usr.id  Where chp.status!=${master.status.delete} and ${whereclause}  GROUP BY id order by chp.name `,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          res.send(data);
          //}
        })
        .catch((error) => {
          var data_out = [];
          res.send(data_out);
        });
    } else if (req.role_id !== 4 && req.role_id !== 5 && req.role_id !== 6) {
      // console.log(
      //   `SELECT  chp.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM  chapters chp  LEFT JOIN property_mapping prop  ON chp.id = prop.chapter_id and prop.organization_id=${req.organization_id}  LEFT JOIN users usr ON prop.user_id = usr.id  Where chp.library_id=${req.query.id} and chp.status!=${master.status.delete}  GROUP BY id order by id desc`
      // );

      db.sequelize
        .query(
          `SELECT  chp.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM  chapters chp  LEFT JOIN property_mapping prop  ON chp.id = prop.chapter_id and prop.organization_id=${req.organization_id}  LEFT JOIN users usr ON prop.user_id = usr.id  Where chp.status!=${master.status.delete} and ${whereclause}   GROUP BY id order by chp.name`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          res.send(data);
          //}
        })
        .catch((error) => {
          var data_out = [];
          res.send(data_out);
        });
    } else {
      db.sequelize
        .query(
          `SELECT  chp.*, GROUP_CONCAT(DISTINCT usr.name separator ',') as assigned_users FROM  chapters chp  LEFT JOIN property_mapping prop  ON chp.id = prop.chapter_id and prop.organization_id=${req.organization_id}  LEFT JOIN users usr ON prop.user_id = usr.id  Where prop.user_id=${req.userId} and chp.status!=${master.status.delete} and ${whereclause}   GROUP BY id order by chp.name`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        )
        .then((data) => {
          res.send(data);
          //}
        })
        .catch((error) => {
          var data_out = [];
          res.send(data_out);
        });
    }
    //db.chapters.findAll({ where }).then(data => { res.send(data) })
  }
};
exports.delete = async (req, res) => {
  var chapter = await db.chapters.destroy(
 
    { where: { id: req.params.id } }
  );
  var standardList = await db.standards
    .findAll({
      attributes: ["id"],
      where: {
        chapter_id: "'" + req.params.id + "'",
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  await db.standards.destroy(
    // { status: master.status.delete },
    { where: { chapter_id: standardList } }
  );
  var substandardList = await db.sub_standards
    .findAll({
      attributes: ["id"],
      where: {
        standard_id: standardList,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  await db.sub_standards.destroy(
    // { status: master.status.delete },
    { where: { standard_id: standardList } }
  );
  await auditCreate.create({
    user_id: req.userId,
    table_name: "libraries",
    primary_id: chapter[0],
    event: "delete",
    new_value: chapter,
    url: req.url,
    user_agent: req.headers["user-agent"],
    ip_address: req.connection.remoteAddress,
  });
  res.send("deleted");

  //  db.chapters.destroy({
  //   where: { id: req.params.id }
  // }).then((data) => {
  //   auditCreate.create({ "user_id": req.userId, 'table_name': "chapters", 'primary_id': req.params.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
  //   res.send("success")
  // }).catch((error) => {
  //   console.log(error.name)
  //   logger.info("/error", error);
  //   if(error.name == 'SequelizeForeignKeyConstraintError'){
  //     error={error:'Cannot delete or update a Chapter,It belongs to Standard'}
  //   }
  //   res.send(error)
  // });
};
exports.statusChange = async (req, res) => {
  db.chapters
    .update(
      {
        status: req.params.status,
      },
      {
        where: { id: "'" + req.params.id + "'" },
      }
    )
    .then((data) => {
      auditCreate.create({
        user_id: req.userId,
        table_name: "chapters",
        primary_id: data.id,
        event: "status change",
        new_value: data.dataValues,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      res.send("status changed");
    });  
};
