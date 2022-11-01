
const express = require('express')
const db = require('../models');
const logger = require("../lib/logger");
const auditCreate=require('./audits.controller')


exports.create = async (req, res) => {
  db.roles.create({
    role_name: req.body.role_name,
    status: req.body.status,
  }).then((data) => {
    auditCreate.create({ "user_id": req.userId, 'table_name': "roles", 'primary_id': data.id, 'event': "create", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
    res.send(data)
  })
    .catch((error) => {
      logger.info("/error", error);
      res.send(error)

    })
}
exports.update = async (req, res) => {

  db.roles.update({
    role_name: req.body.role_name,
  }, {
    where: { id: req.body.id }
  }).then((data) => {
    auditCreate.create({ "user_id": req.userId, 'table_name': "roles", 'primary_id': req.params.id, 'event': "update", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
    res.send("update success")
  })
}


exports.get = async (req, res) => {
  db.roles.findAll().then(data => res.send(data))
}

exports.getById = async (req, res) => {
  //console.log(req.params.id)

  db.roles.findAll({
    where: {
      id: req.params.id
    }
  }).then(data => res.send(data))
}
exports.delete = async (req, res) => {
   db.roles.update({
    id: req.params.id
  }, {
    where: { status: 2 }
  }).then((data) => {
    auditCreate.create({ "user_id": req.userId, 'table_name': "roles", 'primary_id': req.params.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
    res.send("Delete success")
  })
}
