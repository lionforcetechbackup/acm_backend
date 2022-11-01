"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("score_mapping", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      library_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      chapter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      standard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      substanard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      updator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      internal_surveyor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      external_surveyor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updator_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updator_assesment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      internal_surveyor_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      internal_surveyor_assesment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      external_surveyor_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      external_surveyor_assesment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updator_comment: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      internal_surveyor_comment: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      external_surveyor_comment: {
        type: Sequelize.STRING(255),
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
    await queryInterface.dropTable("score_mapping");
  },
};
