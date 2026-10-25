'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add password_hash column for Party portal login
    await queryInterface.addColumn('parties', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // 2. Add portal_access_enabled flag (default false)
    await queryInterface.addColumn('parties', 'portal_access_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // 3. Add composite unique index: mobile_no must be unique per user_id (for non-null mobile numbers)
    await queryInterface.addIndex('parties', ['user_id', 'mobile_no'], {
      name: 'parties_user_id_mobile_no_unique',
      unique: true,
      where: {
        mobile_no: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('parties', 'parties_user_id_mobile_no_unique');
    await queryInterface.removeColumn('parties', 'portal_access_enabled');
    await queryInterface.removeColumn('parties', 'password_hash');
  }
};
