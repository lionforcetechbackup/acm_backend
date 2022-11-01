const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");

exports.clientget = async (req, res) => {
  //console.log(req.query.organization_id);

  /*
  db.organization_libraries
    .findAll({
      where: {
        organization_id: req.organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      attributes: ["libraries.*"],
      group: "libraries.id",
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
      order: [["id", "DESC"]],
    })
    .then((librarydata) => {
      res.send(librarydata);
    })
    .catch((error) => {
      res.send(error);
    });*/

  if (req.role_id === 2 || req.role_id === 3) {
    db.sequelize
      .query(
        `select DISTINCT lib.* from libraries lib, organization_libraries orglib,organizations org where lib.id=orglib.library_id and  orglib.organization_id = org.id and (org.id=${req.organization_id} or org.parent_id=${req.organization_id})`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
      .then((finaldata) => {
        res.send(finaldata);
      })
      .catch((error) => {
        res.send(error);
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
      })
      .catch((error) => {
        res.send(error);
      });
  }
};

exports.clientcountall = async (req, res) => {
  //console.log(req.query.organization_id)
  var libraryCount = await db.organization_libraries.count({
    where: {
      organization_id: req.query.organization_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var libraryList = await db.organization_libraries
    .findAll({
      attributes: ["library_id"],
      where: {
        organization_id: req.query.organization_id,
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
      organization_id: req.query.organization_id,
      status: { [Op.notIn]: [master.status.delete] },
    },
  });
  var createdadminactivity = await db.admin_activities.count({
    status: { [Op.notIn]: [master.status.delete] },
  });
  var mappedactivity = await db.activity_mapping.count({
    where: {
      substandard_id: substandardList,
      organization_id: { [Op.or]: [req.query.organization_id, 0] },
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

exports.chapterget = async (req, res) => {
  try {
    //console.log(req.query.organization_id);
    var library = await db.organization_libraries
      .findAll({
        where: {
          organization_id: { [Op.in]: [req.query.organization_id] },
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
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    await db.chapters
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          library_id: { [Op.in]: library },
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
  } catch (error) {
    res.send(error);
  }
};
exports.standardget = async (req, res) => {
  try {
    //console.log(req.query.organization_id);
    var library = await db.organization_libraries
      .findAll({
        where: {
          organization_id: { [Op.in]: [req.query.organization_id] },
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
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    var chapterIds = await db.chapters
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          library_id: { [Op.in]: library },
        },
      })
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });

    await db.standards
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          chapter_id: { [Op.in]: chapterIds },
        },
        include: [
          {
            model: db.chapters,
            as: "chapterjoin",
          },
        ],
      })
      .then((data) => res.send(data));
  } catch (error) {
    res.send(error);
  }
};

exports.substandardget = async (req, res) => {
  try {
    //console.log(req.query.organization_id);
    var library = await db.organization_libraries
      .findAll({
        where: {
          organization_id: { [Op.in]: [req.query.organization_id] },
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
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    var chapterIds = await db.chapters
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          library_id: { [Op.in]: library },
        },
      })
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    var standardIds = await db.standards
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          chapter_id: { [Op.in]: chapterIds },
        },
      })
      .then(function (accounts) {
        return accounts.map((account) => account.id);
      });
    await db.sub_standards
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          standard_id: { [Op.in]: standardIds },
        },
        include: [
          {
            model: db.standards,
            as: "standardjoin",
          },
        ],
      })
      .then((data) => res.send(data));
  } catch (error) {
    res.send(error);
  }
};
exports.activityget = async (req, res) => {
  try {
    var createdclientactivity = await db.client_admin_activities.count({
      where: {
        organization_id: req.query.organization_id,
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
    var createdadminactivity = await db.admin_activities.count({
      status: { [Op.notIn]: [master.status.delete] },
    });
    var mappedactivity = await db.activity_mapping.count({
      where: {
        substandard_id: substandardList,
        organization_id: { [Op.or]: [req.query.organization_id, 0] },
        status: { [Op.notIn]: [master.status.delete] },
      },
    });
  } catch (error) {
    res.send(error);
  }
};
