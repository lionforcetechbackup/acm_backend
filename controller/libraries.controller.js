const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const e = require("express");
exports.create = async (req, res) => {
  //console.log(req.body);

  // var code = await db.libraries.count({
  //   where: {
  //     status: { [Op.notIn]: [master.status.delete] }
  //   }
  // })

  var unique = await db.libraries.count({
    where: {
      name: req.body.name,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  if (!unique) {
    db.libraries
      .create({
        code: req.body.name,
        name: req.body.name,
        description: req.body.description,
        status: master.status.active,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "libraries",
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
    res.send({ error: "Library Name Already Taken" });
  }

  // .catch((error) => {
  //   logger.info("/error", error);
  //   console.log(error.name != 'SequelizeValidationError');
  //   // if(error.name != 'SequelizeValidationError'){
  //   //   logger.info("/error", error);
  //   // }
  //   logger.info("/error", error);
  //   res.send(error)
  // })
};
exports.update = async (req, res) => {
  if (req.body.name != "") {
    //var codeCreate = abbrevation(req.body.name).toUpperCase();
    var codeCreate = req.body.name;
  } else {
    var codeCreate = "";
  }

  var unique = await db.libraries.count({
    where: {
      name: req.body.name,
      id: { [Op.notIn]: [req.body.id] },
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  //console.log(unique, req.body);
  if (unique > 0) {
    res.send({ error: "Library Name Already Taken" });
  } else {
    //libraries
    db.libraries
      .update(
        {
          code: codeCreate,
          name: req.body.name,
          description: req.body.description,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        //chapter
        db.chapters
          .findAll({
            where: {
              library_id: req.body.id,
            },
          })
          .then((data1) => {
            if (data1.length > 0) {
              data1.forEach((chapter, key) => {
                var chapter_code = codeCreate + "." + chapter.name;
                db.chapters.update(
                  {
                    code: chapter_code,
                  },
                  {
                    where: { id: chapter.id },
                  }
                );

                // Standard
                db.standards
                  .findAll({
                    where: {
                      chapter_id: chapter.id,
                    },
                  })
                  .then((data2) => {
                    if (data2.length > 0) {
                      data2.forEach((standards, key) => {
                        var standards_code =
                          chapter_code + "." + standards.name;
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
              });
            }
          });
        //chapter

        auditCreate.create({
          user_id: req.userId,
          table_name: "libraries",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("Updated");
      })
      .catch((error) => {
        if (error.name == "SequelizeUniqueConstraintError") {
          error = { error: "Library Name Already Taken,Duplicate Entry" };
        }
        logger.info("/error", error);
        res.send(error);
      });
  }
};
exports.get = async (req, res) => {
  if (req.role_id === 1) {
    if(req.query.organization_type)
    {
      db.sequelize
      .query(
        `select DISTINCT lib.* from libraries lib, organization_libraries orglib,organizations org where lib.id=orglib.library_id and  orglib.organization_id = org.id and org.organization_type=${req.query.organization_type}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        res.send(finaldata);
      });
    }else
    {
    db.libraries
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        order: [["id", "DESC"]],
      })
      .then((data) => res.send(data));
    }
  } else if (req.role_id === 2 || req.role_id === 3) {
    db.sequelize
      .query(
        `select DISTINCT lib.* from libraries lib, organization_libraries orglib,organizations org where lib.id=orglib.library_id and  orglib.organization_id = org.id and (org.id=${req.organization_id} or org.parent_id=${req.organization_id})`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        res.send(finaldata);
      });
  } else {
    db.sequelize
      .query(
        `select DISTINCT lib.* from libraries lib, property_mapping pm where lib.id=pm.library_id and pm.user_id=${req.userId}`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        res.send(finaldata);
      });
  }
};

exports.count = async (req, res) => {
  var org_id = 0;
  if (req.role_id !== 1) {
    org_id = req.organization_id;
  }
  if (req.params.id) {
    db.sequelize
      .query(
        `SELECT
                  COUNT(DISTINCT ch.id) AS chapter_count,
                  COUNT(DISTINCT std.id) AS standard_count,
                  COUNT(DISTINCT sub.id) AS substanadrd_count,
                  COUNT(DISTINCT act.admin_activity_id) AS activities_count
              FROM chapters ch
              LEFT JOIN standards std ON ch.id = std.chapter_id
              LEFT JOIN sub_standards sub ON std.id = sub.standard_id
              LEFT JOIN activity_mapping act ON sub.id = act.substandard_id
              WHERE ch.library_id = ${req.params.id} and ch.status = 1 and std.status=1 and sub.status=1
              and act.status=1 and act.organization_id in (${req.organization_id},0)`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        console.log(finaldata);
        res.send(finaldata);
      });
  }
};

exports.getById = async (req, res) => {
  db.libraries
    .findAll({
      where: {
        id: req.params.id,
      },
    })
    .then((data) => res.send(data));
};

exports.delete = async (req, res) => {
  var orgdetail = await db.organization_libraries.findAll({
    where: {
      library_id: req.params.id,
      archive: master.status.inactive,
      status: master.status.active,
    },
    attributes: ["organizationJoin.*", "organization_libraries.*"],
    include: [
      {
        model: db.organizations,
        as: "organizationJoin",
        attributes: [],
        nested: false,
        required: true,
      },
    ],
    raw: true,
  });
  if (orgdetail) {
    if (orgdetail.length > 0) {
      res.send(orgdetail);
    } else {
      var chapterList = await db.chapters
        .findAll({
          attributes: ["id"],
          where: {
            library_id: req.params.id,
            status: { [Op.notIn]: [master.status.delete] },
          },
          raw: true,
        })
        .then(function (accounts) {
          return accounts.map((account) => account.id);
        });
      var standardList = await db.standards
        .findAll({
          attributes: ["id"],
          where: {
            chapter_id: chapterList,
            status: { [Op.notIn]: [master.status.delete] },
          },
          raw: true,
        })
        .then(function (accounts) {
          return accounts.map((account) => account.id);
        });
      await db.sub_standards.update(
        { status: master.status.delete },
        { where: { standard_id: standardList } }
      );
      await db.standards.update(
        { status: master.status.delete },
        { where: { chapter_id: standardList } }
      );
      //var substandardList = await db.sub_standards.findAll({ attributes: ['id'], where: { standard_id: standardList, status: { [Op.notIn]: [master.status.delete] } }, raw: true }).then(function (accounts) { return (accounts.map(account => account.id)) })
      await db.chapters.update(
        { status: master.status.delete },
        { where: { library_id: req.params.id } }
      );
      var library = await db.libraries.update(
        { status: master.status.delete },
        { where: { id: req.params.id } }
      );
      await auditCreate.create({
        user_id: req.userId,
        table_name: "libraries",
        primary_id: library[0],
        event: "delete",
        new_value: library,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      res.send("deleted successfully");
    }
  } else {
    res.send("Library Error");
  }

  //  await db.libraries.update({status:master.status.delete},{where: { id: req.params.id}})
  //  await db.organization_libraries.update({status:master.status.delete},{where:{library_id: req.params.id}})
  //   auditCreate.create({ "user_id": req.userId, 'table_name': "libraries", 'primary_id': req.params.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
};

exports.archive = async (req, res) => {
  var orgdetail = await db.organization_libraries.findAll({
    where: {
      library_id: req.params.id,
      archive: master.status.inactive,
      status: master.status.active,
    },
    attributes: ["organizationJoin.*", "organization_libraries.*"],
    include: [
      {
        model: db.organizations,
        as: "organizationJoin",
        attributes: [],
        nested: false,
        required: true,
      },
    ],
    raw: true,
  });
  if (orgdetail) {
    if (orgdetail.length > 0) {
      res.send(orgdetail);
    } else {
      var chapterList = await db.chapters
        .findAll({
          attributes: ["id"],
          where: {
            library_id: req.params.id,
            status: {
              [Op.notIn]: [master.status.delete, master.status.archive],
            },
          },
          raw: true,
        })
        .then(function (accounts) {
          return accounts.map((account) => account.id);
        });
      var standardList = await db.standards
        .findAll({
          attributes: ["id"],
          where: {
            chapter_id: chapterList,
            status: {
              [Op.notIn]: [master.status.delete, master.status.archive],
            },
          },
          raw: true,
        })
        .then(function (accounts) {
          return accounts.map((account) => account.id);
        });
      await db.sub_standards.update(
        { status: master.status.archive },
        { where: { standard_id: standardList } }
      );
      await db.standards.update(
        { status: master.status.archive },
        { where: { chapter_id: standardList } }
      );
      //var substandardList = await db.sub_standards.findAll({ attributes: ['id'], where: { standard_id: standardList, status: { [Op.notIn]: [master.status.delete] } }, raw: true }).then(function (accounts) { return (accounts.map(account => account.id)) })
      await db.chapters.update(
        { status: master.status.archive },
        { where: { library_id: req.params.id } }
      );
      var library = await db.libraries.update(
        { status: master.status.archive },
        { where: { id: req.params.id } }
      );
      await auditCreate.create({
        user_id: req.userId,
        table_name: "libraries",
        primary_id: library[0],
        event: "archive",
        new_value: library,
        url: req.url,
        user_agent: req.headers["user-agent"],
        ip_address: req.connection.remoteAddress,
      });
      res.send("archived successfully");
    }
  } else {
    res.send("Library Error");
  }

  //  await db.libraries.update({status:master.status.delete},{where: { id: req.params.id}})
  //  await db.organization_libraries.update({status:master.status.delete},{where:{library_id: req.params.id}})
  //   auditCreate.create({ "user_id": req.userId, 'table_name': "libraries", 'primary_id': req.params.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
};
exports.deleteCheck = async (req, res) => {
  //console.log(req.params.id)
  var organizationDetail = await db.organization_libraries.findAll({
    where: { library_id: req.params.id, archive: 1 },
    attributes: ["organizationJoin.*", "organization_libraries.*"],
    include: [
      {
        model: db.organizations,
        as: "organizationJoin",
        attributes: [],
        nested: false,
        required: true,
      },
    ],
    raw: true,
  });
  var organizationDetailArchive = await db.organization_libraries.count({
    where: { library_id: req.params.id, archive: 1 },
  });

  res.send({
    organizationDetail: organizationDetail,
    organizationCount: organizationDetail.length,
    archive: organizationDetailArchive,
  });
};
exports.statusChange = async (req, res) => {
  db.libraries
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
        table_name: "libraries",
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
};
exports.statusChange = async (req, res) => {
  db.libraries
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
        table_name: "libraries",
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
};
exports.clientget = async (req, res) => {
  try {
    //console.log(req.userId, req.organization_id);
    db.organization_libraries
      .findAll({
        where: {
          organization_id: req.organization_id,
          status: { [Op.notIn]: [master.status.delete] },
        },
        attributes: ["libraries.*"],
        include: [
          {
            model: db.libraries,
            as: "libraries",
            attributes: [],
            nested: false,
            required: true,
          },
        ],
        raw: true,
      })
      .then((librarydata) => {
        res.send(librarydata);
      });
  } catch (error) {}
};

exports.clientcountall = async (req, res) => {
  var libraryCount = await db.organization_libraries.count({
    where: {
      organization_id: req.organization_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var libraryList = await db.organization_libraries
    .findAll({
      attributes: ["library_id"],
      where: {
        organization_id: req.organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var chapterCount = await db.chapters.count({
    where: {
      library_id: libraryList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var chapterList = await db.chapters
    .findAll({
      attributes: ["id"],
      where: {
        library_id: libraryList,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var standardCount = await db.standards.count({
    where: {
      chapter_id: chapterList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var standardList = await db.standards
    .findAll({
      attributes: ["id"],
      where: {
        chapter_id: chapterList,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var substandardCount = await db.sub_standards.count({
    where: {
      standard_id: chapterList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
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

  //activity
  var createdclientactivity = await db.client_admin_activities.count({
    where: {
      organization_id: req.organization_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var createdadminactivity = await db.admin_activities.count({
    status: { [Op.notIn]: [master.status.delete] },
  });
  var mappedactivity = await db.activity_mapping.count({
    where: {
      substandard_id: substandardList,
      organization_id: { [Op.in]: [req.organization_id, 0] },
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  res.send({
    libraryCount: libraryCount,
    chapterCount: chapterCount,
    standardCount: standardCount,
    substandardCount: substandardCount,
    mappedactivity: mappedactivity,
    createdclientactivity: createdclientactivity,
    createdadminactivity: createdadminactivity,
  });
};
exports.admincountall = async (req, res) => {
  var libraryCount = await db.libraries.count({
    where: { status: { [Op.notIn]: [master.status.delete] } },
  });
  var libraryList = await db.libraries
    .findAll({
      attributes: ["id"],
      where: { status: { [Op.notIn]: [master.status.delete] } },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var chapterCount = await db.chapters.count({
    where: {
      library_id: libraryList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var chapterList = await db.chapters
    .findAll({
      attributes: ["id"],
      where: {
        library_id: libraryList,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var standardCount = await db.standards.count({
    where: {
      chapter_id: chapterList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var standardList = await db.standards
    .findAll({
      attributes: ["id"],
      where: {
        chapter_id: chapterList,
        status: { [Op.notIn]: [master.status.delete] },
      },
      raw: true,
    })
    .then(function (accounts) {
      return accounts.map((account) => account.id);
    });
  var substandardCount = await db.sub_standards.count({
    where: {
      standard_id: chapterList,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
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
  //activity
  var adminactivity = await db.admin_activities.count({
    status: { [Op.notIn]: [master.status.delete] },
  });
  res.send({
    libraryCount: libraryCount,
    chapterCount: chapterCount,
    standardCount: standardCount,
    substandardCount: substandardCount,
    adminactivity: adminactivity,
  });
};
