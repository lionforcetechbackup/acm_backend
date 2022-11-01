'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, table_name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, primary_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, event: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, old_value: {
        type: Sequelize.STRING(500),
        allowNull: true,

      }, new_value: {
        type: Sequelize.STRING(2500),
        allowNull: true,

      }, url: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, ip_address: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true,

      }, log_in: {
        type: Sequelize.DATE,
        allowNull: true,

      }, log_out: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('audits');
  }
}