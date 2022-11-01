"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_role_company", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      surveyor_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      from_date: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      to_date: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      surveyor_category: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      surveyor_session: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("user_role_company");
  },
};
