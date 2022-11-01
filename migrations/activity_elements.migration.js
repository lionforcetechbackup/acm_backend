"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("activity_elements", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      admin_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      client_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      substandard_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      element_code: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      element_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      element_response: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.dropTable("activity_elements");
  },
};
