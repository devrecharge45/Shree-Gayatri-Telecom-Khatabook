'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      party_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'parties',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('CREDIT', 'DEBIT'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      transaction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      bill_reference: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      balance_after: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    await queryInterface.addIndex('transactions', ['party_id']);
    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['transaction_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  }
};
