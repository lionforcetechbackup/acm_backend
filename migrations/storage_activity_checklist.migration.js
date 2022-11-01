'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storage_activity_checklist', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, mapping_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      },
      admin_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, client_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, updator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, file_no: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, response_frequency: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, response_date: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, file_status: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, score: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, status: {
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
    await queryInterface.dropTable('storage_activity_checklist');
  }
}