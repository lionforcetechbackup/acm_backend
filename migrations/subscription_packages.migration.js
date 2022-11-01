'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('subscription_packages', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },name:{
                type : Sequelize.STRING(255),
                allowNull : false,
                
              },amount:{
                type : Sequelize.INTEGER,
                allowNull : false,
                
              },no_client_admin:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },no_updater:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },no_viewer:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },no_internel_surveyor:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },no_externel_surveyor:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },duration_count:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },duration:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },status:{
    allowNull: true,
    type: Sequelize.INTEGER,
  },
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
        await queryInterface.dropTable('subscription_packages');
      }
    }