'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('libraries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, code: {
        type: Sequelize.STRING(255),
        allowNull: true,

      }, name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: {
          args: true,
          msg: 'Library already used!'
      }
      }, description: {
        type: Sequelize.STRING(500),
        allowNull: true,

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
    await queryInterface.dropTable('libraries');
  }
}