'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unit_focus_areas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      library_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      }, name: {
        type: Sequelize.STRING(255),
        allowNull: false,

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
    await queryInterface.dropTable('unit_focus_areas');
  }
}