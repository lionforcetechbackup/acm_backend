'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     queryInterface.bulkDelete('activity_csv_name', null, {});

    return queryInterface.bulkInsert('activity_csv_name', 
    [
      {id:"1",name:"Observation",type:"1",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"},
      {id:"2",name:"Staff Interview",type:"1",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"},
      {id:"3",name:"Document Evidence",type:"3",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"},
      {id:"4",name:"Close Record Review",type:"1",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"},
      {id:"5",name:"Open Record Review",type:"1",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"},
      {id:"6",name:"Personnel Staff File",type:"1",status:"1",createdAt:"2021-05-03 15:44:42",updatedAt:"2021-05-03 15:44:42"} ])
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
    return queryInterface.bulkDelete('activity_csv_name', null, {});

    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
