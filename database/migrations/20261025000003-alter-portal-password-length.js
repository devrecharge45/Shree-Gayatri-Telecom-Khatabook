'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase portal_password length to 255 for AES-256-GCM encrypted tokens
    await queryInterface.changeColumn('parties', 'portal_password', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('parties', 'portal_password', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  }
};
