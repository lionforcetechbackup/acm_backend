'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('activity_csv_name', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },name:{
                type : Sequelize.STRING(255),
                allowNull : true,
                
              },
              library_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
        
              },type:{
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
        await queryInterface.dropTable('activity_csv_name');
      }
    }