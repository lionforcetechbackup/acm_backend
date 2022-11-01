const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");
exports.create = async (req, res) => {
  try {
    var session_class_id = crypto
      .createHash("sha256")
      .update(
        req.body.class_name +
          "_" +
          req.body.surveyor_category_id +
          "_" +
          req.body.library_id
      )
      .digest("hex");

    db.session_classes
      .create({
        id: session_class_id,
        class_name: req.body.class_name,
        surveyor_category_id: req.body.surveyor_category_id,
        library_id: req.body.library_id,
        created_date: req.body.created_date,
        status: master.status.active,
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "session_classes",
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
};
exports.update = async (req, res) => {
  try {
    db.session_classes
      .update(
        {
          class_name: req.body.class_name,
          surveyor_category_id: req.body.surveyor_category_id,
          created_date: req.body.created_date,
          library_id: req.body.library_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "session_classes",
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
exports.get = async (req, res) => {
  try {
    db.session_classes
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
  db.session_classes
    .findAll({
      where: {
        library_id: req.params.id,
      },
      include: {
        model: db.surveyor_categories,
        as: "surveyorCategoriesDetails",
        attributes: ["category_name"],
      },
      order: [["createdAt", "desc"]],
    })
    .then((sessiondata) => {
      if (sessiondata.length > 0) {
        sessiondata.forEach((element, idx) => {
          sessiondata[idx].dataValues.category_name =
            element.surveyorCategoriesDetails
              ? element.surveyorCategoriesDetails.category_name
              : null;
        });
        //res.send(sessiondata);
      }

      //console.log(sessiondata);
      res.send(sessiondata);
    })
    .catch((error) => {
      console.log(error);
      // logger.info("/error", error);
      res.send(error);
    });
};
exports.delete = async (req, res) => {
  //db.session_classes.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.session_classes
      .destroy({
        where: { id: req.params.id },
      })
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "session_classes",
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
    db.session_classes
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
          table_name: "session_classes",
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
