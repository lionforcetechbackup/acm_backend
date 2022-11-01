"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("storage_activity_kpi_elements", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      storage_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      frequency: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      target: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      totarget: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      actual_value: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      score: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ytdScore: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ytdValue: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      responsedate: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      status: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      createdBy: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("storage_activity_kpi_elements");
  },
};
