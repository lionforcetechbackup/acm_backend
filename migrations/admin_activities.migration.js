'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, code: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, description: {
        type: Sequelize.STRING(255),
        allowNull: false,

      }, type: {
        type: Sequelize.STRING(255),
        allowNull: false,

      }, name: {
        type: Sequelize.STRING(255),
        allowNull: false,

      }, response_frequency: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, submission_day: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, kpi: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, kpi_name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, type_of_measure: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, aggregation_type: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, observation_name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, observation_type: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, currency_type: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, document_name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, document_link: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, expiry_days: {
        type: Sequelize.STRING(50),
        allowNull: true,

      }, status: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      assign_dummy: {
        type: Sequelize.STRING(5000),
        allowNull: true,

      },
      element_dummy: {
        type: Sequelize.STRING(5000),
        allowNull: true,

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
    await queryInterface.dropTable('admin_activities');
  }
}