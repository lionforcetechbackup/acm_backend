const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");

exports.create = async (req, res) => {
  var survey_category_id = crypto
    .createHash("sha256")
    .update(req.body.category_name + "_" + req.body.library_id)
    .digest("hex");
  db.surveyor_categories
    .create({
      id: survey_category_id,
      category_name: req.body.category_name,
      library_id: req.body.library_id,
      created_date: req.body.created_date == "" ? null : req.body.created_date,
      status: master.status.active,
    })
    .then((data) =>
      res.send(data).catch((error) => {
        logger.info("/error", error);
        return error;
      })
    )
    .catch((error) => {
      logger.info("/error", error);
      res.send(error);
    });
};
exports.update = async (req, res) => {
  db.surveyor_categories
    .update(
      {
        category_name: req.body.category_name,
        library_id: req.body.library_id,
        created_date:
          req.body.created_date == "" ? null : req.body.created_date,
        status: master.status.active,
      },
      {
        where: { id: req.body.id },
      }
    )
    .then(() => res.send("success"));
};
exports.get = async (req, res) => {
  db.surveyor_categories
    .findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
      },
      order: [["id", "DESC"]],
    })
    .then((data) => res.send(data));
};

exports.getById = async (req, res) => {
  db.surveyor_categories
    .findAll({
      where: {
        library_id: req.params.id,
        status: { [Op.notIn]: [master.status.delete] },
      },
      order: [["createdAt", "desc"]],
    })
    .then((data) => res.send(data));
};
exports.delete = async (req, res) => {
  //db.surveyor_categories.destroy({
  //      where:{
  //   id:req.params.id
  // }
  db.surveyor_categories
    .update(
      {
        status: master.status.delete,
      },
      {
        where: { id: req.params.id },
      }
    )
    .then((data) => res.send("success"));
};
exports.statusChange = async (req, res) => {
  db.surveyor_categories
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
