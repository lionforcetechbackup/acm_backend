"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("activity_session_mapping", {
      id: {
        allowNull: false,
        // autoIncrement: true,
        primaryKey: true,
        type: Sequelize.STRING(500),
      },
      substandard_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      session_class_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      client_activity_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      admin_activity_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isUpdate: {
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
    await queryInterface.dropTable("activity_session_mapping");
  },
};
