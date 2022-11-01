const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");
const crypto = require("crypto");

exports.create = async (req, res) => {
  if (req.body.elements && req.body.elements.length > 0) {
    for (let index = 0; index < req.body.elements.length; index++) {
      let countDetail = await db.activity_elements.count();
      var admin_activity_element = "";
      let id = "";
      if (req.body.elements[index].admin_activity_id) {
        id = req.body.elements[index].admin_activity_id;
      } else if (req.body.elements[index].client_activity_id) {
        id = req.body.elements[index].client_activity_id;
      }

      if (req.role_id === 1) {
        admin_activity_element = crypto
          .createHash("sha256")
          .update(id + "_" + req.body.elements[index].element_name)
          .digest("hex");
      } else {
        admin_activity_element = crypto
          .createHash("sha256")
          .update(
            id +
              "_" +
              req.body.elements[index].element_name +
              "_" +
              req.organization_id
          )
          .digest("hex");
      }
      var element_code = "E" + countDetail;
      //console.log(req.body.elements[index].admin_activity_id)
      //console.log(req.body.elements[index].substandard_id)

      try {
        var activity_elements_check = await db.sequelize.query(
          `select count(1) as count from activity_elements where organization_id is null and (admin_activity_id='${id}' OR client_activity_id = '${id}') AND element_name='${element.element_name}'`,
          {
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (activity_elements_check && activity_elements_check[0].count !== 0) {
          return res.send("Element Exist");
        } else {
          db.activity_elements
            .upsert(
              {
                id: admin_activity_element,
                admin_activity_id: req.body.elements[index].admin_activity_id,
                client_activity_id: req.body.elements[index].client_activity_id,
                substandard_id: req.body.elements[index].substandard_id,
                element_code: element_code,
                parent_id: req.body.elements[index].parent_id,
                element_name: req.body.elements[index].element_name,
                organization_id: req.organization_id,
              }
              // { logging: console.log }
            )
            .then((data) => {
              //console.log(data);
              auditCreate.create({
                user_id: req.userId,
                table_name: "activity_elements",
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
        }
      } catch (error) {
        logger.info("/error", error);
        res.send(error);
      }
    }
  }
};
exports.update = async (req, res) => {
  try {
    db.activity_elements
      .update(
        {
          admin_activity_id: req.body.admin_activity_id,
          client_activity_id: req.body.client_activity_id,
          substandard_id: req.body.substandard_id,
          element_code: req.body.element_code,
          parent_id: req.body.parent_id,
          element_name: req.body.element_name,
          element_response: req.body.element_response,
          organization_id: req.body.organization_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "activity_elements",
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
    db.activity_elements
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
    db.activity_elements
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
exports.delete = async (req, res) => {
  //db.activity_elements.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.activity_elements
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
          table_name: "activity_elements",
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
    db.activity_elements
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
          table_name: "activity_elements",
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
