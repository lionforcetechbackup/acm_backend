'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('surveyor_session', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, code: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, name: {
        type: Sequelize.STRING(255),
        allowNull: true,

      },
      library_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      }, user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      }, client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      }, category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, class_id: {
        type: Sequelize.INTEGER,
        allowNull: true,

      }, date: {
        type: Sequelize.STRING(255),
        allowNull: true,

      },to_date: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, from_time: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, to_time: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, survey_status: {
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
    await queryInterface.dropTable('surveyor_session');
  }
}