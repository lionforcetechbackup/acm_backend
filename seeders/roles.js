'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.bulkDelete('roles', null, {});

    return queryInterface.bulkInsert('roles', 
    [
      
        {
          id : 1,
          role_name : "Super Admin",
          status : 1,
          createdAt : "2021-05-03 15:44:42",
          updatedAt : "2021-05-03 15:44:42"
        },
        {
          id : 2,
          role_name : "SuperClient Admin",
          status : 1,
          createdAt : "2021-04-16 08:10:39",
          updatedAt : "2021-04-16 08:10:39"
        },
        {
          id : 3,
          role_name : "Client Admin",
          status : 1,
          createdAt : "2021-04-16 08:11:49",
          updatedAt : "2021-04-16 08:11:49"
        },
        {
          id : 4,
          role_name : "Updator",
          status : 1,
          createdAt : "2021-04-16 08:12:20",
          updatedAt : "2021-04-16 08:12:20"
        },
        {
          id : 5,
          role_name : "Surveyor",
          status : 1,
          createdAt : "2021-04-16 08:12:38",
          updatedAt : "2021-04-16 08:12:38"
        },
        {
          id : 6,
          role_name : "Viewer",
          status : 1,
          createdAt : "2021-04-16 08:13:08",
          updatedAt : "2021-04-16 08:13:08"
        }
      
       
    
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
    return queryInterface.bulkDelete('roles', null, {});

    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
