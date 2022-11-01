'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('storage_activity_checklist_elements', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },storage_id:{
                type : Sequelize.INTEGER,
                allowNull : true,
                
              },element_id:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },attachment_link:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },response:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },comments:{
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
        await queryInterface.dropTable('storage_activity_checklist_elements');
      }
    }