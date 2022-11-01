const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");

exports.get = async (req, res) => {
  try {
    db.unit_focus_areas
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        order: [["id", "DESC"]],
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);

        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);

    res.send(error);
  }
};

exports.getByLibraryId = async (req, res) => {
  try {
    db.unit_focus_areas
      .findAll({
        where: {
          status: { [Op.notIn]: [master.status.delete] },
          library_id: req.params.id,
        },
        order: [["createdAt", "DESC"]],
      })
      .then((data) => res.send(data))
      .catch((error) => {
        logger.info("/error", error);

        res.send(error);
      });
  } catch (error) {
    logger.info("/error", error);

    res.send(error);
  }
};

exports.create = async (req, res) => {
  var uof_id = crypto
    .createHash("sha256")
    .update(req.body.name + "_" + req.body.library_id)
    .digest("hex");

  db.unit_focus_areas
    .create({
      id: uof_id,
      name: req.body.name,
      library_id: req.body.library_id,
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
  try {
    db.unit_focus_areas
      .update(
        {
          name: req.body.name,
          library_id: req.body.library_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "unit_focus_areas",
          primary_id: req.body.id,
          event: "update",
          new_value: req.body,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("updated");
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
  try {
    db.unit_focus_areas
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
          table_name: "unit_focus_areas",
          primary_id: data.id,
          event: "status change",
          new_value: data.dataValues,
          url: req.url,
          user_agent: req.headers["user-agent"],
          ip_address: req.connection.remoteAddress,
        });
        res.send("success");
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
