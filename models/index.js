'use strict';

const fs = require('fs');
const path = require('path');
const { Association } = require('sequelize');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
} 

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.sequelize = sequelize;

//Association
// db.roles.hasMany(db.users)
// db.users.belongsTo(db.roles)
// db.company=require('../models/companies')(sequelize, Sequelize);
// db.company_library=require('../models/company_libraries')(sequelize, Sequelize);
// db.library=require('../models/libraries')(sequelize, Sequelize);
// // db.companies.belongsTo(db.subscription_packages, {foreignKey: 'package', as: 'subscriptionPackage'});
// db.company_library.belongsTo(db.company,{foreignKey: 'package', as: 'companylibrary'});
// db.company.hasMany(db.company_library);
module.exports = db; 
