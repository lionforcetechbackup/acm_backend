const express = require("express");
const db = require("../models");
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const master = require("../config/default.json");
const { where, NUMBER } = require("sequelize");

exports.libraryget = async (req, res) => {
  var library = req.body.libraryIds;

  let sql = `SELECT libraries.* FROM libraries 
                INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id 
                INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id 
                WHERE property_mapping.organization_id='${req.organization_id}'  
                AND property_mapping.user_id='${req.userId}' AND organization_libraries.status=${master.status.active} 
                AND organization_libraries.archive=0 AND libraries.status=${master.status.active}`;

  if (library.length > 0) {
    sql = sql + ` AND libraries.id IN (${library}) `;
  }
  sql = sql + ` group by libraries.id  ORDER BY libraries.id DESC`;

  console.log(sql);
  db.sequelize
    .query(sql, {
      type: db.sequelize.QueryTypes.SELECT,
    })
    .then((data) => {
      res.send(data);
    });
};
exports.chapterget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;

  let sql = `SELECT chapters.* 
                    FROM property_mapping 
                    left JOIN chapters ON property_mapping.chapter_id=chapters.id
                    left JOIN libraries ON chapters.library_id=libraries.id 
                    left JOIN organization_libraries ON libraries.id=organization_libraries.library_id 
                    WHERE property_mapping.organization_id=${req.organization_id} AND 
                    property_mapping.user_id=${req.userId} AND 
                    organization_libraries.status=${master.status.active} AND 
                    organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
                    chapters.status=${master.status.active}
                   `;
  // let sql1=`SELECT chapters.* FROM libraries INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id INNER JOIN chapters ON property_mapping.chapter_id=chapters.id  WHERE property_mapping.organization_id=${req.organization_id} AND property_mapping.user_id=${req.userId} AND organization_libraries.status=${master.status.active} AND organization_libraries.archive=0 AND libraries.status=${master.status.active} AND chapters.status=${master.status.active}`

  if (library.length > 0) {
    sql = sql + ` AND chapters.library_id IN (${library})`;
  }
  if (chapter.length > 0) {
    //console.log(chapter);
    sql = sql + ` AND chapters.id IN (${chapter})`;
  }
  sql =
    sql + `  GROUP BY property_mapping.chapter_id ORDER BY chapters.id DESC`;
  console.log(sql);
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};
exports.standardget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  let sql = `SELECT standards.*
                        FROM property_mapping
                        INNER JOIN standards ON property_mapping.standard_id=standards.id
                        INNER JOIN chapters ON standards.chapter_id=chapters.id 
                        INNER JOIN libraries ON chapters.library_id=libraries.id 
                        INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id
                        WHERE property_mapping.organization_id=${req.organization_id} AND 
                              property_mapping.user_id=${req.userId} AND 
                              organization_libraries.status=${master.status.active} AND 
                              organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
                              chapters.status=${master.status.active} AND
                              standards.status=${master.status.active}
                             `;

  // let sql=`SELECT standards.* FROM standards INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id WHERE property_mapping.organization_id=${req.organization_id} AND property_mapping.user_id=${req.userId} AND organization_libraries.status=${master.status.active} AND organization_libraries.archive=0 AND libraries.status=${master.status.active} AND chapters.status=${master.status.active}`
  // let sql1=`SELECT chapters.* FROM libraries INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id INNER JOIN property_mapping ON organization_libraries.library_id=property_mapping.library_id INNER JOIN chapters ON property_mapping.chapter_id=chapters.id  WHERE property_mapping.organization_id=${req.organization_id} AND property_mapping.user_id=${req.userId} AND organization_libraries.status=${master.status.active} AND organization_libraries.archive=0 AND libraries.status=${master.status.active} AND chapters.status=${master.status.active}`

  if (library && library[0] != "" && library.length > 0) {
    sql = sql + ` AND chapters.library_id IN (${library})`;
  }
  if (chapter && chapter[0] != "" && chapter.length > 0) {
    sql = sql + ` AND standards.chapter_id IN (${chapter})`;
  }
  if (standard && standard[0] != "" && standard.length > 0) {
    sql = sql + ` AND standards.id IN (${standard})`;
  }
  sql =
    sql + `  GROUP BY property_mapping.standard_id ORDER BY standards.id DESC`;
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};

exports.substandardget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  var sub_standard = req.body.substandardIds;

  let sql = `SELECT sub_standards.*,libraries.id as lib
                        FROM property_mapping
                        INNER JOIN sub_standards ON property_mapping.substandard_id=sub_standards.id
                        INNER JOIN standards ON sub_standards.standard_id=standards.id
                        INNER JOIN chapters ON standards.chapter_id=chapters.id 
                        INNER JOIN libraries ON chapters.library_id=libraries.id 
                        INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id
                        WHERE property_mapping.organization_id=${req.organization_id} AND 
                              property_mapping.user_id=${req.userId} AND 
                              organization_libraries.status=${master.status.active} AND 
                              organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
                              sub_standards.status=${master.status.active} AND 
                              chapters.status=${master.status.active} AND
                              standards.status=${master.status.active}
                              GROUP BY property_mapping.substandard_id`;
  if (library && library[0] != "" && library.length > 0) {
    sql = sql + ` AND chapters.library_id IN (${library})`;
  }
  if (chapter && chapter[0] != "" && chapter.length > 0) {
    sql = sql + ` AND standards.chapter_id IN (${chapter})`;
  }
  if (standard && standard[0] != "" && standard.length > 0) {
    sql = sql + ` AND standards.id IN (${standard})`;
  }
  if (sub_standard && sub_standard[0] != "" && sub_standard.length > 0) {
    sql = sql + ` AND sub_standards.id IN (${sub_standard})`;
  }
  sql = sql + ` ORDER BY sub_standards.id DESC`;
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};

exports.activityget = async (req, res) => {
  var library = req.body.libraryIds;
  var chapter = req.body.chapterIds;
  var standard = req.body.standardIds;
  var sub_standard = req.body.substandardIds;
  // var sub_standard =req.body.substandardIds;

  let sql = `SELECT sub_standards.*,libraries.id as lib
                        FROM property_mapping
                        INNER JOIN sub_standards ON property_mapping.substandard_id=sub_standards.id
                        INNER JOIN standards ON sub_standards.standard_id=standards.id
                        INNER JOIN chapters ON standards.chapter_id=chapters.id 
                        INNER JOIN libraries ON chapters.library_id=libraries.id 
                        INNER JOIN organization_libraries ON libraries.id=organization_libraries.library_id
                        WHERE property_mapping.organization_id=${req.organization_id} AND 
                              property_mapping.user_id=${req.userId} AND 
                              organization_libraries.status=${master.status.active} AND 
                              organization_libraries.archive=0 AND libraries.status=${master.status.active} AND 
                              sub_standards.status=${master.status.active} AND 
                              chapters.status=${master.status.active} AND
                              standards.status=${master.status.active}
                              GROUP BY property_mapping.substandard_id`;
  if (library && library[0] != "" && library.length > 0) {
    sql = sql + ` AND chapters.library_id IN (${library})`;
  }
  if (chapter && chapter[0] != "" && chapter.length > 0) {
    sql = sql + ` AND standards.chapter_id IN (${chapter})`;
  }
  if (standard && standard[0] != "" && standard.length > 0) {
    sql = sql + ` AND standards.id IN (${standard})`;
  }
  if (sub_standard && sub_standard[0] != "" && sub_standard.length > 0) {
    sql = sql + ` AND sub_standards.id IN (${sub_standard})`;
  }
  sql = sql + ` ORDER BY sub_standards.id DESC`;
  try {
    db.sequelize
      .query(sql, {
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        res.send(data);
      });
  } catch (error) {
    res.send(error);
  }
};

exports.activity = async (req, res) => {

  var org_id=0;
  if(req.role_id !== 1)
  {
    org_id=req.organization_id
  }
  var where = {};
  if (req.query.type == "library") {
    where = { library_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  } else if (req.query.type == "standard") {
    where = { standard_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  } else if (req.query.type == "substandard") {
    where = {
      substandard_id: req.query.id,
      admin_activity_id: { [Op.ne]: null },
    };
  } else if (req.query.type == "chapter") {
    where = { chapter_id: req.query.id, admin_activity_id: { [Op.ne]: null } };
  }

  var substandardIds = await db.property_mapping
    .findAll({
      where: { organization_id: req.organization_id, user_id: req.userId },
      group: ["substandard_id"],
    })
    .then((data) => {
      return data.map((data) => data.substandard_id);
    });
  if (substandardIds.length > 0) {
    if (req.query.type == "substandard") {
      substandardIds.push(parseInt(req.query.id));
    }
    where.substandard_id = { [Op.in]: substandardIds };
    where.organization_id ={[Op.in]:[org_id,0]} ;
    var admin = await db.activity_mapping.findAll({
      where: where,
      attributes: ["admin_activities.*", "activity_mapping.admin_activity_id"],
      include: [
        {
          model: db.admin_activities,
          as: "admin_activities",
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      group: ["admin_activities.id"],
      raw: true,
    });

    if (req.query.type == "library") {
      clientwhere = {
        library_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else if (req.query.type == "standard") {
      clientwhere = {
        standard_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else if (req.query.type == "substandard") {
      clientwhere = {
        substandard_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else if (req.query.type == "chapter") {
      clientwhere = {
        chapter_id: req.query.id,
        client_activity_id: { [Op.ne]: null },
      };
    } else {
      clientwhere = {};
    }
    clientwhere.substandard_id = { [Op.in]: substandardIds };
    clientwhere.organization_id ={[Op.in]:[org_id,0]} ;

    var clientadmin = await db.activity_mapping.findAll({
      where: clientwhere,
      attributes: [
        "client_activities.*",
        "activity_mapping.client_activity_id",
      ],
      include: [
        {
          model: db.client_admin_activities,
          as: "client_activities",
          where: { organization_id: req.organization_id },
          attributes: [],
          nested: false,
          required: true,
        },
      ],
      group: ["client_activities.id"],
      raw: true,
    });
    let final = clientadmin.concat(admin);
    res.send(final);
  } else {
    res.send({ data: "No records found" });
  }
};
