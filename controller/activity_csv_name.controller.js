const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");

exports.create = async (req, res) => {
  var unique = await db.activity_csv_name.count({
    where: { name: req.body.name, library_id: req.body.library_id },
  });
  //console.log(unique, req.body);
  if (unique > 0) {
    res.send({ error: "Name Already Taken" });
  } else {
    try {
      var activity_csv_id = crypto
        .createHash("sha256")
        .update(req.body.name + "_" + req.body.library_id)
        .digest("hex");

      db.activity_csv_name
        .create({
          id: activity_csv_id,
          name: req.body.name,
          type: req.body.type,
          library_id: req.body.library_id,
          status: master.status.active,
        })
        .then((data) => {
          auditCreate.create({
            user_id: req.userId,
            table_name: "activity_csv_name",
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
      logger.info("/error", error);
      res.send(error);
    }
  }
};
exports.update = async (req, res) => {
  var unique = await db.activity_csv_name.count({
    where: { name: req.body.name, library_id: req.body.library_id },
  });
  //console.log(unique, req.body);
  if (unique > 0) {
    res.send({ error: "Name Already Taken" });
  } else {
    try {
      db.activity_csv_name
        .update(
          {
            name: req.body.name,
            type: req.body.type,
            library_id: req.body.library_id,
          },
          {
            where: { id: req.body.id },
          }
        )
        .then((data) => {
          // console.log(data)
          auditCreate.create({
            user_id: req.userId,
            table_name: "activity_csv_name",
            primary_id: data.id,
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
  }
};

exports.get = async (req, res) => {
  try {
    db.activity_csv_name
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

exports.getById = async (req, res) => {
  try {
    db.activity_csv_name
      .findAll({
        where: {
          id: req.params.id,
        },
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
    db.activity_csv_name
      .findAll({
        where: {
          library_id: req.params.id,
          status: { [Op.notIn]: [master.status.delete] },
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

exports.delete = async (req, res) => {
  //db.activity_csv_name.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.activity_csv_name
      .destroy(
       
        {
          where: { id: req.params.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "activity_csv_name",
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
    db.activity_csv_name
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
          table_name: "activity_csv_name",
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
