
const express = require('express')
const master = require('../config/default.json');
const db = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");
const auditCreate=require('./audits.controller')

exports.create = async (req, res) => {

  var organization_id = req.organization_id;
  if(req.role_id === 1 )
  {
    organization_id=0;
  }
  try {
    
    db.activity_mapping.create({
      library_id: req.body.library_id, chapter_id: req.body.chapter_id, standard_id: req.body.standard_id, substandard_id: req.body.substandard_id, client_activity_id: req.body.client_activity_id, admin_activity_id: req.body.admin_activity_id,organization_id:organization_id,
    }).then((data) => {
    auditCreate.create({"user_id":req.userId,'table_name':"activity_mapping",'primary_id':data.id,'event':"create",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
    res.send(data)})
      .catch((error) => {
        logger.info("/error", error);
        res.send(error)
      })
  } catch (error) {
    logger.info("/error", error);
    res.send(error)
  }
}
exports.update = async (req, res) => {
  var organization_id = req.organization_id;
  if(req.role_id === 1 )
  {
    organization_id=0;
  }
  try {
    db.activity_mapping.update({
      library_id: req.body.library_id, chapter_id: req.body.chapter_id, standard_id: req.body.standard_id, substandard_id: req.body.substandard_id, client_activity_id: req.body.client_activity_id, admin_activity_id: req.body.admin_activity_id,organization_id:organization_id
    }, {
      where: { id: req.body.id }
    }).then((data) => {
    auditCreate.create({"user_id":req.userId,'table_name':"activity_mapping",'primary_id':req.body.id,'event':"update",'new_value':req.body,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
      res.send("success")})
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

  var organization_id=0
  if(req.role_id !== 1)
  {
    organization_id=req.organization_id
  }
  try {
    db.activity_mapping.findAll({
      where: {
        status: { [Op.notIn]: [master.status.delete] },
        organization_id:organization_id
      }, order: [
        ['id', 'DESC']
    ]
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
    db.activity_mapping.findAll({
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
  //db.activity_mapping.destroy({
  //      where:{
  //   id:req.params.id
  // }
  try {
    db.activity_mapping.update({
      status: master.status.delete
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "activity_mapping", 'primary_id': req.params.id, 'event': "delete", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send("success")
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
    db.activity_mapping.update({
      status: req.params.status
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({ "user_id": req.userId, 'table_name': "activity_mapping", 'primary_id': data.id, 'event': "status change", 'new_value': data.dataValues, 'url': req.url, user_agent: req.headers['user-agent'], ip_address: req.connection.remoteAddress })
      res.send("status changed")
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
