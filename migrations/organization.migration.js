var DataTypes = require("sequelize/lib/data-types");
("use strict");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("organizations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      company_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      organization_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      country: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      zipcode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mobile_no: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      package: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      no_client_admin: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      no_viewer: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      no_surveyor: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      no_updator: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      package_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valid_from: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      valid_to: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      library: {
        type: Sequelize.STRING(500),
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
      user_added: {
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
    await queryInterface.dropTable("organizations");
  },
};
