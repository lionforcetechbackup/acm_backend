"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("storage_observation", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      mapping_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      admin_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      client_activity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      observation_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      currency_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      comments: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      expiry_date: {
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
    await queryInterface.dropTable("storage_observation");
  },
};
