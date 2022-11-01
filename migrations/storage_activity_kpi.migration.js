'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storage_activity_kpi', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, mapping_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },updator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, client_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      admin_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, aggregation_type: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, type_of_measure: {
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
    await queryInterface.dropTable('storage_activity_kpi');
  }
}