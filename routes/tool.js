const express = require('express')
const router = express.Router();
const fs = require("fs");
const path = require("path");
const app = express();
const phptable = require('../database/table');

router.get("/migrate", (req, res) => {


  phptable.table_create_migration((result, status) => {
    if (status == "error") {
      res.json({ result });
    } else {
      res.json({ result });
    }
  });
});

router.post("/migration-insert", (req, res) => {


  const temp = req.body;
  var temp_field = [];
  const f = temp.table_field;
  f.forEach(name => {
    if (name.Null == "YES") {
      var is_null = "";
    } else {
      var is_null = "NOT NULL";
    }
    const v = name.Field + " " + name.Type + " " + is_null;
    //   console.log(v);
    temp_field.push(v);
  });
  temp.temp_field = temp_field;
  phptable.table_create(temp, (result, status) => {
    //console.log(999, status);
    if (status == "success") {
      fs.writeFile("./database/migration/" + temp.table_name + ".json", `${JSON.stringify(temp)}`,
        function (file_err) {
          if (file_err) {
            res.json({ file_err, status: "file can`t generated" });
          }
        }
      );

      if (temp.modelreq) {
        fs.writeFile("./models/" + temp.table_name + ".js", `${model_create(temp.table_field, temp.table_name)}`,
          function (file_err) {
            if (file_err) {
              res.json({ file_err, status: "file can`t generated" });
            }
          }
        );
      }
      if (temp.migrationreq) {
        fs.writeFile("./migrations/" + temp.table_name + ".migration.js", `${migration_create(temp.table_field, temp.table_name)}`,
          function (file_err) {
            if (file_err) {
              res.json({ file_err, status: "file can`t generated" });
            }
          }
        );
      }
      if (temp.controllerreq) {
        fs.writeFile("./controller/" + temp.table_name + ".controller.js", `${controller_create(temp.table_field, temp.table_name)}`,
          function (file_err) {
            if (file_err) {
              res.json({ file_err, status: "file can`t generated" });
            }
          }
        );
      }


      var status = "Table Create Successfully";
    }
    res.json({ result, status });
  });
});



const model_create = (field, name) => {
  var fieldsSet = "";

  field.forEach(element => {
    var fieldType = (element.Type == 'varchar(255)') ? 'DataTypes.STRING(255)' : ((element.Type == 'int(11)') ? 'DataTypes.INTEGER' : ((element.Type == 'longtext') ? 'DataTypes.STRING(500)' : 'DataTypes.DATE'));
    var nullCheck = (element.Null) == 'YES' ? true : false;
    if (element.Null != 'YES') {
      var validateField = `validate: {
                          notEmpty:{
                              msg:'`+ element.Field + ` is empty'
                            }
                             },`
    } else {
      var validateField = ''
    }

    fieldsSet += element.Field + `:{
                type : `+ fieldType + `,
                allowNull : `+ nullCheck + `,
                `+ validateField + `
              },`;

  });
  fieldsSet += `status:{
    type: DataTypes.INTEGER,
      allowNull: true,
  },`;
  console.log(fieldsSet, 111)
  return `module.exports=(sequelize,DataTypes)=>{        
        const `+ name + ` = sequelize.define('` + name + `',{
          `+ fieldsSet + `
        });
          return `+ name + `;
             }`
}


const migration_create = (field, name) => {
  var fieldsSet = `id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },`;

  field.forEach(element => {
    var fieldType = (element.Type == 'varchar(255)') ? 'Sequelize.STRING(255)' : ((element.Type == 'int(11)') ? 'Sequelize.INTEGER' : ((element.Type == 'longtext') ? 'Sequelize.STRING(500)' : 'Sequelize.DATE'));
    var nullCheck = (element.Null) == 'YES' ? true : false;


    fieldsSet += element.Field + `:{
                type : `+ fieldType + `,
                allowNull : `+ nullCheck + `,
                
              },`;

  });
  fieldsSet += `status:{
    allowNull: true,
    type: Sequelize.INTEGER,
  },`;
  console.log(fieldsSet, 111)
  return `'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('`+ name + `', {
          `+ fieldsSet + `
          createdBy: {
            allowNull: true,
            type: Sequelize.INTEGER
          },
          updatedBy: {
            allowNull: true,
            type: Sequelize.INTEGER
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        });
      },
      down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('`+ name + `');
      }
    }`
}


const controller_create = (field, name) => {
  var fieldsSet = '';

  field.forEach(element => {

    fieldsSet += element.Field + `:req.body.` + element.Field + `,`

  });
  console.log(fieldsSet, 111)
  return `
  const express=require('express')
const master = require('../config/default.json');
const db=require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const logger = require("../lib/logger");
const auditCreate=require('./audits.controller')

exports.create=async(req,res)=>{ 
  try{
  db.`+ name + `.create({
  `+ fieldsSet + `
}).then((data) =>{
  auditCreate.create({"user_id":req.userId,'table_name':"`+ name + `",'primary_id':data.id,'event':"create",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
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
    db.`+ name + `.update({
      `+ fieldsSet + `
    },{
        where:{id:req.body.id}
    }).then((data)=>{
    auditCreate.create({"user_id":req.userId,'table_name':"`+ name + `",'primary_id':req.body.id,'event':"update",'new_value':req.body,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
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
  db.`+ name + `.findAll({
    where: {
      status: {[Op.notIn]:[ master.status.delete ]}
}
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
            db.`+ name + `.findAll({where:{
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
            //db.`+ name + `.destroy({
               //      where:{
               //   id:req.params.id
             // }
             try {
              db.`+ name + `.update({ 
                status: master.status.delete
                }, {
                      where: { id: req.params.id }
                }).then((data) => {
                  auditCreate.create({"user_id":req.userId,'table_name':"`+ name + `",'primary_id':data.id,'event':"delete",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
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
    db.`+ name + `.update({ 
      status: req.params.status
    }, {
      where: { id: req.params.id }
    }).then((data) => {
      auditCreate.create({"user_id":req.userId,'table_name':"`+ name + `",'primary_id':data.id,'event':"delete",'new_value':data.dataValues,'url':req.url,user_agent:req.headers['user-agent'],ip_address:req.connection.remoteAddress})
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
`
}

/* automation table create,drop,alter*/

router.post("/show-table-drop", (req, res) => {
  const temp = req.body;
  phptable.table_drop(temp, (result, status) => {
    res.json({ result, status });
  });
});

router.get("/show-table-list", (req, res) => {
  phptable.show_table((result, status) => {
    res.json({ result, status });
  });
});

router.post("/show-table-colums", (req, res) => {
  phptable.show_columns(req.body, (result, status) => {
    res.json({ result, status });
  });
});
router.get("/show-db-name", (req, res) => {
  phptable.show_db_name((result, status) => {
    res.json({ result, status });
  });
});


router.get("/table_json_file", (req, res) => {
  const directoryPath = path.join(__dirname, "../database/migration");
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.json("Unable to scan directory: " + err);
    }
    var filesPush = [];
    files.forEach(function (file) {
      filesPush.push({ fullpath: directoryPath + '/' + file, filepath: file, filename: path.basename(file, path.extname(file)) });
    });
    res.json(filesPush);
  });
}); 
router.post("/table_json_file", (req, res) => {
  if (req.body.table_name != null) {
    let rawdata = fs.readFileSync(req.body.table_name);
    let table = JSON.parse(rawdata);
    res.json(table);
  } else {
    res.json('Json file can`t find it');
  }
 
});

router.get('/run', (req, res) => {
  res.render('index')
})
module.exports = router;