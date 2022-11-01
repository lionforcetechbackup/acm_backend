
  const express=require('express')
const master = require('../config/default.json');
const db=require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");
const auditCreate=require('./audits.controller')

exports.create=async(req,res)=>{ 
  try{
  db.organization_type.create({
  type:req.body.type,status:master.status.active
}).then((data) =>{
  auditCreate.create({"user_id":req.userId,'table_name':"organization_type",'primary_id':data.id,'event':"create",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
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
exports.update=async(req,res)=>{
  try {
    db.organization_type.update({
      type:req.body.type,
    },{
        where:{id:req.body.id}
    }).then((data)=>{
    auditCreate.create({"user_id":req.userId,'table_name':"organization_type",'primary_id':req.body.id,'event':"update",'new_value':req.body,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
      res.send("updated")})
    .catch((error)=>{
  logger.info("/error", error);
      res.send(error)
  })
  } catch (error) {
  logger.info("/error", error);
  res.send(error)
  }
  
}
exports.get=async(req,res)=>{
  
try {
  db.organization_type.findAll({
    where: {
      status: {[Op.notIn]:[ master.status.delete ]}
},order: [
  ['id', 'DESC']
]
  }).then(data=>res.send(data))
  .catch((error)=>{
  logger.info("/error", error);
  res.send(error)
})
} catch (error) {
  logger.info("/error", error);
  res.send(error)
}
 
}

exports.getById=async(req,res)=>{
 
          try {
            db.organization_type.findAll({where:{
              id:req.params.id
          }}).then(data=>res.send(data))
          .catch((error)=>{
  logger.info("/error", error);
  res.send(error)
        })
          } catch (error) {
  logger.info("/error", error);
  res.send(error)
          }
}
exports.delete=async(req,res)=>{
            //db.organization_type.destroy({
               //      where:{
               //   id:req.params.id
             // }
             try {
              db.organization_type.update({ 
                status: master.status.delete
                }, {
                      where: { id: req.params.id }
                }).then((data) => {
                  auditCreate.create({"user_id":req.userId,'table_name':"organization_type",'primary_id':data.id,'event':"delete",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
                   res.send("deleted")})
                .catch((error)=>{
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
    db.organization_type.update({ 
      status: req.params.status
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({"user_id":req.userId,'table_name':"organization_type",'primary_id':data.id,'event':"delete",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
      res.send("status changed")
    }).catch((error)=>{
      logger.info("/error", error);
  res.send(error)
    });
  
  }catch(error){
    logger.info("/error", error);
  res.send(error)
  }
}
