'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('client_admin_datacollections', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },admin_activity_id:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },client_activity_id:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },type_of_number:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },target:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },client_id:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },organization_id:{
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
        await queryInterface.dropTable('client_admin_datacollections');
      }
    }