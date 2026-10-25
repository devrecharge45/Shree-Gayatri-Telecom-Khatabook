'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add portal_password column for Admin to view and share with Party
    await queryInterface.addColumn('parties', 'portal_password', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('parties', 'portal_password');
  }
};
