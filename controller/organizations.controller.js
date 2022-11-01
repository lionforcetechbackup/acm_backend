
  const express=require('express')
const master = require('../config/default.json');
const db=require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");

exports.create=async(req,res)=>{
  try{
  db.organizations.create({
  name:req.body.name,company_type:req.body.company_type,organization_type:req.body.organization_type,parent_id:req.body.parent_id,email:req.body.email,country:req.body.country,state:req.body.state,city:req.body.city,address:req.body.address,zipcode:req.body.zipcode,mobile_no:req.body.mobile_no,contact_person:req.body.contact_person,package:req.body.package,no_client_admin:req.body.no_client_admin,no_viewer:req.body.no_viewer,no_surveyor:req.body.no_surveyor,no_updator:req.body.no_updator,valid_from:req.body.valid_from,valid_to:req.body.valid_to,
}).then(data=>res.send(data))
.catch((error)=>{
  logger.info("/error", error);

  res.send(error)
})
} catch (error) {
  res.send(error)
}
}
exports.update=async(req,res)=>{
  try {
    db.organizations.update({
      name:req.body.name,company_type:req.body.company_type,organization_type:req.body.organization_type,parent_id:req.body.parent_id,email:req.body.email,country:req.body.country,state:req.body.state,city:req.body.city,address:req.body.address,zipcode:req.body.zipcode,mobile_no:req.body.mobile_no,contact_person:req.body.contact_person,package:req.body.package,no_client_admin:req.body.no_client_admin,no_viewer:req.body.no_viewer,no_surveyor:req.body.no_surveyor,no_updator:req.body.no_updator,valid_from:req.body.valid_from,valid_to:req.body.valid_to,
    },{
        where:{id:req.body.id}
    }).then(()=>res.send("success"))
    .catch((error)=>{
  logger.info("/error", error);

      res.send(error)
  })
  } catch (error) {
      res.send(error)
  }
  
}
exports.get=async(req,res)=>{
  
try {
  db.organizations.findAll({
    where: {
      status: {[Op.notIn]:[ master.status.delete ]}
},
order: [
  ['id', 'DESC']
]
  }).then((data)=>{res.send(data)})
  .catch((error)=>{
  logger.info("/error", error);

    res.send(error)
})
} catch (error) {
    res.send(error)
}
 
}

exports.getById=async(req,res)=>{
 
          try {
            db.organizations.findAll({where:{
              id:req.params.id
          }}).then(data=>res.send(data))
          .catch((error)=>{
  logger.info("/error", error);

            res.send(error)
        })
          } catch (error) {
              res.send(error)
          }
}
exports.delete=async(req,res)=>{
            //db.organizations.destroy({
               //      where:{
               //   id:req.params.id
             // }
             try {
              db.organizations.update({ 
                status: master.status.delete
                
                    }, {
                      where: { id: req.params.id }
                }).then(data=>res.send("success"))
                .catch((error)=>{
  logger.info("/error", error);

                  res.send(error)
              });
            } catch (error) {
                res.send(error)
            }
             
}
exports.statusChange = async (req, res) => {
  try {
    db.organizations.update({ 
      status: req.params.status
    }, {
      where: { id: req.params.id }
    }).then(data => res.send("status changed"))
    .catch((error)=>{
  logger.info("/error", error);

      res.send(error)
  });
  } catch (error) {
      res.send(error)
  }
  
}
