const express = require("express");
const master = require("../config/default.json");
const db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../lib/logger");
const auditCreate = require("./audits.controller");

exports.create = async (req, res) => {
  var clientUserRoleExist = await db.client_roles.findAll({
    where: {
      organization_id: req.body.organization_id,
      role_id: req.body.role_id,
      user_id: req.body.user_id,
    },
  });

  if (clientUserRoleExist.length > 0) {
    res.send({
      message: "Already role exist for this user",
    });
  } else {
    var organizations = await db.organizations.findOne({
      where: {
        id: req.body.organization_id,
      },
    });

    var clientUser = await db.users.findAll({
      where: {
        organization_id: req.body.organization_id,
        role_id: req.body.role_id,
      },
    });

    if (clientUser.length > 0) {
      var clientUserAdded = clientUser.length;
    } else {
      var clientUserAdded = 0;
    }

    var clientUserRole = await db.client_roles.findAll({
      where: {
        organization_id: req.body.organization_id,
        role_id: req.body.role_id,
        //user_id: req.body.user_id,
      },
    });

    if (clientUserRole.length > 0) {
      var roleUserAdded = clientUserRole.length;
    } else {
      var roleUserAdded = 0;
    }

    var totalUserAdded = clientUserAdded + roleUserAdded;

    if (req.body.role_id == 3) {
      var newRolename = "Client Admin";
      var no_client_admin = organizations.dataValues.no_client_admin;
      if (no_client_admin == totalUserAdded) {
        res.send({
          message: "Reached the limit of client admin",
        });
      }
    } else if (req.body.role_id == 4) {
      var newRolename = "Updator";
      var no_updator = organizations.dataValues.no_updator;
      if (no_updator == totalUserAdded) {
        res.send({
          message: "Reached the limit of updator",
        });
      }
    } else if (req.body.role_id == 5) {
      var newRolename = "Surveyor";
      var no_surveyor = organizations.dataValues.no_surveyor;
      if (no_surveyor == totalUserAdded) {
        res.send({
          message: "Reached the limit of surveyor",
        });
      }
    } else if (req.body.role_id == 6) {
      var newRolename = "Viewer";
      var no_viewer = organizations.dataValues.no_viewer;
      if (no_viewer == totalUserAdded) {
        res.send({
          message: "Reached the limit of viewer",
        });
      }
    }

    db.client_roles
      .create({
        role_id: req.body.role_id,
        user_id: req.body.user_id,
        organization_id: req.body.organization_id,
      })
      .then(async (data) => {
        // auditCreate.create({
        //   user_id: req.userId,
        //   table_name: "client_roles",
        //   primary_id: data.id,
        //   event: "create",
        //   new_value: data.dataValues,
        //   url: req.url,
        //   user_agent: req.headers["user-agent"],
        //   ip_address: req.connection.remoteAddress,
        // });

        messageTmp = await db.msgtemplate.findOne({
          where: {
            msgtype: "AssignRole",
          },
        });

        let message = messageTmp.dataValues.message;
        message = message.replace("<newRolename>", newRolename);

        await db.notifications.create({
          message: message,
          user_id: data.id,
          createdBy: req.userId,
        });

        if (req.body.role_id == 4) {
          if (req.body.substandard_ids.length > 0) {
            //console.log("assign property");
            let updatorAssignedProps = [];
            req.body.substandard_ids.forEach((sub_id, key) => {
              db.sequelize
                .query(
                  `SELECT standards.chapter_id,sub_standards.id,sub_standards.standard_id,chapters.library_id FROM sub_standards INNER JOIN standards ON sub_standards.standard_id=standards.id INNER JOIN chapters ON standards.chapter_id=chapters.id INNER JOIN libraries ON chapters.library_id=libraries.id WHERE sub_standards.id='${sub_id}'`,
                  {
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                )
                .then((finaldata) => {
                  //console.log(finaldata);

                  updatorAssignedProps.push({
                    organization_id: req.body.organization_id,
                    library_id: finaldata[0].library_id,
                    chapter_id: finaldata[0].chapter_id,
                    standard_id: finaldata[0].standard_id,
                    substandard_id: finaldata[0].id,
                    client_id: req.body.user_id,
                    user_id: req.body.user_id,
                    status: master.status.active,
                  });

                  if (req.body.substandard_ids.length == key + 1) {
                    db.property_mapping
                      .bulkCreate(updatorAssignedProps)
                      .then((result) => res.send("created"));
                  }
                });
            });
          }
        } else {
          res.send(data);
        }
      })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error);
      });
  }
};

exports.update = async (req, res) => {
  var clientUserRoleExist = await db.client_roles.findAll({
    where: {
      organization_id: req.body.organization_id,
      role_id: req.body.role_id,
      user_id: req.body.user_id,
    },
  });

  if (clientUserRoleExist.length > 0) {
    res.send({
      message: "Already role exist for this user",
    });
  }

  try {
    db.client_roles
      .update(
        {
          role_id: req.body.role_id,
          user_id: req.body.user_id,
          organization_id: req.body.organization_id,
        },
        {
          where: { id: req.body.id },
        }
      )
      .then((data) => {
        auditCreate.create({
          user_id: req.userId,
          table_name: "client_roles",
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
    db.client_roles
      .findAll({
        attributes: [
          "user_id",
          "role_id",
          ["id", "client_roles_id"],
          "roles.id",
          "roles.role_name",
        ],
        include: [
          {
            model: db.roles,
            as: "roles",
            attributes: [],
            nested: false,
            required: true,
          },
        ],
        where: {
          status: { [Op.notIn]: [master.status.delete] },
        },
        raw: true,
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
    db.client_roles
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
  //db.client_roles.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.client_roles
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
          table_name: "client_roles",
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
    db.client_roles
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
          table_name: "client_roles",
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

exports.getUserByMasterId = async (req, res) => {
  //console.log("req.params")
  try {
    db.users
      .findAll({
        attributes: [
          "id",
          "name",
          "role_id",
          "organization_id",
          "parent_organization_id",
        ],
        where: {
          parent_organization_id: req.params.id,
          // organization_id:req.params.id
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
exports.userAssignedRoles = async (req, res) => {
  try {
    db.client_roles
      .findAll({
        where: {
          user_id: req.params.id,
          status: { [Op.notIn]: [master.status.delete] },
        },
        attributes: [
          "user_id",
          "role_id",
          ["id", "client_roles_id"],
          "roles.id",
          "roles.role_name",
        ],

        include: [
          {
            model: db.roles,
            as: "roles",
            attributes: [],
            nested: false,
            required: true,
          },
        ],

        raw: true,
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
