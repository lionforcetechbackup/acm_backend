"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("property_mapping", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      library_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      chapter_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      standard_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      substandard_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assignto: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      expirydate: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("property_mapping");
  },
};
