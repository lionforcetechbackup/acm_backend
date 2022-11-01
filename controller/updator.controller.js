
const express = require('express')
const db = require('../models');
const logger = require("../lib/logger");
const auditCreate = require('./audits.controller')
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const master = require('../config/default.json');
const { where, NUMBER } = require('sequelize');

exports.updatorget=async(req,res)=>{
   var where={organization_id:req.organization_id,role_id:master.role.updator,id:{ [Op.notIn]: [req.userId] }}

   await db.users.findAll({where:where,  attributes: {
    exclude: ['password', 'temporary_password', 'jwt', 'otp']
},}).then((data)=>{
    res.send(data);
   })


}