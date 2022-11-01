'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      }, role_name: {
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
    }).then(()=>{
      queryInterface.alterTable('users', {
        role_id: {
          type: Sequelize.INTEGER,
          references: { model: 'roles', key: 'id' }
        }
      })
    });;
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('roles');
  }
}