"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("lookups", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      library_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      chaptername: {
        type: Sequelize.STRING(455),
        allowNull: true,
      },
      standardname: {
        type: Sequelize.STRING(455),
        allowNull: true,
      },
      substandardname: {
        type: Sequelize.STRING(455),
        allowNull: true,
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
    await queryInterface.dropTable("lookups");
  },
};
