'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sub_standards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, standard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      }, name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, 
      code: {
        type: Sequelize.STRING(255),
        allowNull: false,

      }, description: {
        type: Sequelize.STRING(1500),
        allowNull: false,

      }, esr: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, surveyor_category_id: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, session_class_id: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, unit_focus_area: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, file: {
        type: Sequelize.STRING(255),
        allowNull: true,

      },document_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
  
      },
      substandard_uid: {
        type: Sequelize.TEXT,
        allowNull: false,
  
      },
       status: {
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
    await queryInterface.dropTable('sub_standards');
  }
}