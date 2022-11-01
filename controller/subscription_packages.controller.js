
  const express=require('express')
const master = require('../config/default.json');
const db=require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");
const auditCreate=require('./audits.controller')

exports.create=async(req,res)=>{
  db.subscription_packages.create({
  name:req.body.name,amount:req.body.amount,no_client_admin:req.body.no_client_admin,no_updater:req.body.no_updater,no_viewer:req.body.no_viewer,no_internel_surveyor:req.body.no_internel_surveyor,no_externel_surveyor:req.body.no_externel_surveyor,duration_count:req.body.duration_count,duration:req.body.duration,status: master.status.active
}).then(data=>res.send(data)
.catch((error)=>{
  logger.info("/error", error);
 
    return error;
})).catch((error)=>{
  logger.info("/error", error);

res.send(error) 
})
}
exports.update=async(req,res)=>{
  db.subscription_packages.update({
    name:req.body.name,amount:req.body.amount,no_client_admin:req.body.no_client_admin,no_updater:req.body.no_updater,no_viewer:req.body.no_viewer,no_internel_surveyor:req.body.no_internel_surveyor,no_externel_surveyor:req.body.no_externel_surveyor,duration_count:req.body.duration_count,duration:req.body.duration,status: master.status.active
  },{
      where:{id:req.body.id}
  }).then(()=>res.send("success"))
}
exports.get=async(req,res)=>{
  db.subscription_packages.findAll({
    where: {
      status: {[Op.notIn]:[ master.status.delete ]}
},order: [
  ['id', 'DESC']
]
  }).then(data=>res.send(data))
}

exports.getById=async(req,res)=>{
  db.subscription_packages.findAll({where:{
              id:req.params.id
          }}).then(data=>res.send(data))
}
exports.delete=async(req,res)=>{
            //db.subscription_packages.destroy({
               //      where:{
               //   id:req.params.id
             // }
              db.subscription_packages.update({ 
          status: master.status.delete
          
              }, {
                where: { id: req.params.id }
          }).then(data=>res.send("success"));
}
