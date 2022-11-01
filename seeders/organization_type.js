'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     queryInterface.bulkDelete('organization_type', null, {});

    return queryInterface.bulkInsert('organization_type', 
    [
      {
        id : 1,
        type : "Hospital",
        status : 1,
        createdAt : "2021-04-21 05:29:45",
        updatedAt : "2021-04-21 05:29:45"
      },
      {
        id : 2,
        type : "Polyclinic",
        status : 1,
        createdAt : "2021-04-21 05:29:56",
        updatedAt : "2021-04-21 05:29:56"
      },
      {
        id : 3,
        type : "clinic",
        status : 1,
        createdAt : "2021-04-21 05:30:05",
        updatedAt : "2021-04-21 05:30:05"
      },
      {
        id : 4,
        type : "Primary Care",
        status : 1,
        createdAt : "2021-04-21 05:30:25",
        updatedAt : "2021-04-21 05:30:25"
      },
      {
        id : 5,
        type : "Specialized Clinics",
        status : 1,
        createdAt : "2021-04-21 05:30:25",
        updatedAt : "2021-04-21 05:30:25"
      },
      {
        id : 6,
        type : "Laboratory",
        status : 1,
        createdAt : "2021-04-21 05:30:25",
        updatedAt : "2021-04-21 05:30:25"
      },
     
  ]);

    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('organization_type', null, {});

    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
