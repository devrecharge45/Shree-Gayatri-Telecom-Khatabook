'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add deleted_at to users table for soft deletes
    await queryInterface.addColumn('users', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 2. Add deleted_at to parties table for soft deletes
    await queryInterface.addColumn('parties', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 3. Add deleted_at to transactions table for soft deletes
    await queryInterface.addColumn('transactions', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 4. Update parties_user_id_mobile_no_unique partial index to only enforce uniqueness among active (non-deleted) parties
    try {
      await queryInterface.removeIndex('parties', 'parties_user_id_mobile_no_unique');
    } catch {
      // index might not exist under that exact name in all environments
    }

    await queryInterface.addIndex('parties', ['user_id', 'mobile_no'], {
      name: 'parties_user_id_mobile_no_unique',
      unique: true,
      where: {
        mobile_no: {
          [Sequelize.Op.ne]: null
        },
        deleted_at: null
      }
    });

    // 5. Add index on deleted_at for fast query performance
    await queryInterface.addIndex('parties', ['deleted_at'], {
      name: 'parties_deleted_at_idx'
    });
    await queryInterface.addIndex('transactions', ['deleted_at'], {
      name: 'transactions_deleted_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('transactions', 'transactions_deleted_at_idx');
    await queryInterface.removeIndex('parties', 'parties_deleted_at_idx');

    await queryInterface.removeIndex('parties', 'parties_user_id_mobile_no_unique');
    await queryInterface.addIndex('parties', ['user_id', 'mobile_no'], {
      name: 'parties_user_id_mobile_no_unique',
      unique: true,
      where: {
        mobile_no: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.removeColumn('transactions', 'deleted_at');
    await queryInterface.removeColumn('parties', 'deleted_at');
    await queryInterface.removeColumn('users', 'deleted_at');
  }
};
