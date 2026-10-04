'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Demo User
    const passwordHash = await bcrypt.hash('Password@123', 10);
    const userId = '11111111-1111-4111-8111-111111111111';

    // Check if user already exists
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@shreegayatritelecom.com'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingUsers.length === 0) {
      await queryInterface.bulkInsert('users', [
        {
          id: userId,
          name: 'Shree Gayatri Admin',
          email: 'admin@shreegayatritelecom.com',
          password_hash: passwordHash,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    const party1Id = '22222222-2222-4222-8222-222222222222';
    const party2Id = '33333333-3333-4333-8333-333333333333';
    const party3Id = '44444444-4444-4444-8444-444444444444';

    // Check if parties exist
    const existingParties = await queryInterface.sequelize.query(
      `SELECT id FROM parties WHERE user_id = '${userId}'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingParties.length === 0) {
      await queryInterface.bulkInsert('parties', [
        {
          id: party1Id,
          user_id: userId,
          name: 'Rahul Electronics',
          mobile_no: '9876543210',
          notes: 'Wholesale smartphone screens and tempered glasses',
          current_balance: 3500.00, // You will get 3,500
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: party2Id,
          user_id: userId,
          name: 'Mahaveer Telecom Accessories',
          mobile_no: '9825123456',
          notes: 'Supplier for fast charging cables & adapters',
          current_balance: -1200.00, // You will give 1,200 (Advance)
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: party3Id,
          user_id: userId,
          name: 'Kiran General Store',
          mobile_no: '9898123456',
          notes: 'Nearby retailer account',
          current_balance: 0.00, // Settled
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      // Seed transactions
      await queryInterface.bulkInsert('transactions', [
        // Rahul Electronics (Party 1)
        {
          id: '55555555-5555-4555-8555-555555555551',
          party_id: party1Id,
          user_id: userId,
          type: 'DEBIT', // You gave
          amount: 5000.00,
          transaction_date: '2026-10-01',
          notes: '10x Fast Type-C Chargers',
          bill_reference: 'INV-001',
          balance_after: 5000.00,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '55555555-5555-4555-8555-555555555552',
          party_id: party1Id,
          user_id: userId,
          type: 'CREDIT', // You got
          amount: 1500.00,
          transaction_date: '2026-10-03',
          notes: 'Received partial UPI payment',
          bill_reference: 'UPI-987612',
          balance_after: 3500.00,
          created_at: new Date(),
          updated_at: new Date()
        },

        // Mahaveer Telecom (Party 2)
        {
          id: '55555555-5555-4555-8555-555555555553',
          party_id: party2Id,
          user_id: userId,
          type: 'CREDIT', // You got / advance
          amount: 1200.00,
          transaction_date: '2026-10-02',
          notes: 'Advance deposit received for next order',
          bill_reference: 'REC-089',
          balance_after: -1200.00,
          created_at: new Date(),
          updated_at: new Date()
        },

        // Kiran General Store (Party 3) - Settled
        {
          id: '55555555-5555-4555-8555-555555555554',
          party_id: party3Id,
          user_id: userId,
          type: 'DEBIT',
          amount: 800.00,
          transaction_date: '2026-09-28',
          notes: 'Screen protector and phone cover',
          bill_reference: 'INV-098',
          balance_after: 800.00,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '55555555-5555-4555-8555-555555555555',
          party_id: party3Id,
          user_id: userId,
          type: 'CREDIT',
          amount: 800.00,
          transaction_date: '2026-09-30',
          notes: 'Full payment received in cash',
          bill_reference: 'CASH',
          balance_after: 0.00,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('parties', null, {});
    await queryInterface.bulkDelete('users', { email: 'admin@shreegayatritelecom.com' }, {});
  }
};
