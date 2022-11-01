"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: Sequelize.TEXT,
      role_id: Sequelize.INTEGER,
      // user_id:Sequelize.STRING,
      company_id: Sequelize.INTEGER,
      parent_organization_id: Sequelize.INTEGER,
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      mobile_number: Sequelize.BIGINT(11),
      password: Sequelize.STRING(500),
      temporary_password: Sequelize.STRING(500),
      surveyor_type: Sequelize.STRING(255),
      surveyor_category: Sequelize.TEXT,
      surveyor_session: Sequelize.TEXT,
      jwt: Sequelize.STRING(500),
      avatar: Sequelize.STRING(500),
      otp: Sequelize.STRING,
      status: {
        type: Sequelize.STRING,
      },
      from_date: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      to_date: {
        type: Sequelize.STRING(255),
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
    // queryInterface.addColumn(
    //   'Users',
    //   'url',
    //   Sequelize.STRING
    // );

    //
    /**
     *
     *
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};

// [
//   chapter_id:1
//   standard_id:[
//     {
//       id:1,
//       substandsrd_id:[1,2,3,4,5,6,7,8,9]
//     },
//     {
//       id:2,
//       substandsrd_id:[1,2,3,4,5,6,7,8,9]
//     }
//   ]
// ]
