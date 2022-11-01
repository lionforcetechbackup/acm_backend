'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('activity_mapping', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },library_id:{
                type : Sequelize.INTEGER,
                allowNull : false,
                
              },chapter_id:{
                type : Sequelize.INTEGER,
                allowNull : false,
                
              },standard_id:{
                type : Sequelize.INTEGER,
                allowNull : false,
                
              },substandard_id:{
                type : Sequelize.INTEGER,
                allowNull : false,
                
              },client_activity_id:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },admin_activity_id:{
                type : Sequelize.INTEGER,
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
        await queryInterface.dropTable('activity_mapping');
      }
    }