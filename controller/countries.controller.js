
const express = require('express')
const master = require('../config/default.json');
const db = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");
const auditCreate = require('./audits.controller')

exports.create = async (req, res) => {
  try {
    db.countries.create({
      country: req.body.country, country_code: req.body.country_code, international_dialing: req.body.international_dialing,
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "countries", 'primary_id': data.id, 'event': "create", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send(data)
    }).catch((error) => {
      logger.info("/error", error);
      res.send(error)
    })
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }
}
exports.update = async (req, res) => {
  try {
    db.countries.update({
      country: req.body.country, country_code: req.body.country_code, international_dialing: req.body.international_dialing,
    }, {
      where: { id: req.body.id }
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "countries", 'primary_id': req.body.id, 'event': "update", 'new_value': req.body, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send("updated")
    })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error)
      })
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }

}
exports.get = async (req, res) => {

  try {
    db.countries.findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] }
      }
    }).then(data => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error)
      })
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }

}

exports.getById = async (req, res) => {

  try {
    db.countries.findAll({
      where: {
        id: req.params.id
      }
    }).then(data => res.send(data))
      .catch((error) => {
        logger.info("/error", error);
        res.send(error)
      })
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }
}
exports.delete = async (req, res) => {
  //db.countries.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.countries.update({
      status: master.status.delete
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "countries", 'primary_id': data.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send("deleted")
    })
      .catch((error) => {
        logger.info("/error", error);
        res.send(error)
      });
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }

}
exports.statusChange = async (req, res) => {
  try {
    db.countries.update({
      status: req.params.status
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "countries", 'primary_id': data.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send("status changed")
    }).catch((error) => {
      logger.info("/error", error);
      res.send(error)
    });

  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }
}
