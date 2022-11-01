'use strict'
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('organization_type', {
          id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },type:{
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
        await queryInterface.dropTable('organization_type');
      }
    }