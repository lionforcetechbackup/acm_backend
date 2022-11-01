'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     queryInterface.bulkDelete('users', null, {});

    return queryInterface.bulkInsert('users', 
    [
      {id : '1',name : 'giri',role_id : '1',organization_id :null ,parent_organization_id : null,email : 'giriram@gmail.com',mobile_number : null,password : '$2b$10$a/7YWZiodolSO5tbHh/fTeC40vfFZkEcD2q/OMDfD3pMNh9wf0pQa',temporary_password : 'ro;h(Sz4M8',surveyor_type : null,surveyor_category : null,surveyor_session : null,jwt : null,avatar : null,otp : null,status : '1',createdAt : '2021-05-03 15:44:42',updatedAt : '2021-05-03 15:44:42'}

  ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('users', null, {});
  }
};
