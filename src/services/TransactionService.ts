import { Op, WhereOptions, InferAttributes } from 'sequelize';
import { sequelize } from '../config/database';
import { Transaction } from '../models/Transaction.model';
import { Party } from '../models/Party.model';
import { TransactionType } from '../constants/transaction-types';
import { AppError } from '../utils/AppError';

export interface LedgerQueryParams {
  partyId: string;
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export class TransactionService {
  /**
   * Fetch ledger transactions for a party with filters and pagination
   */
  public static async getLedger(params: LedgerQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: WhereOptions<InferAttributes<Transaction>>[] = [
      { party_id: params.partyId },
      { user_id: params.userId }
    ];

    if (
      params.type &&
      (params.type === TransactionType.CREDIT || params.type === TransactionType.DEBIT)
    ) {
      conditions.push({ type: params.type });
    }

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push({
        [Op.or]: [{ notes: { [Op.iLike]: term } }, { bill_reference: { [Op.iLike]: term } }]
      });
    }

    if (params.startDate && params.endDate) {
      conditions.push({
        transaction_date: {
          [Op.between]: [params.startDate, params.endDate]
        }
      });
    } else if (params.startDate) {
      conditions.push({ transaction_date: { [Op.gte]: params.startDate } });
    } else if (params.endDate) {
      conditions.push({ transaction_date: { [Op.lte]: params.endDate } });
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: { [Op.and]: conditions },
      limit,
      offset,
      order: [
        ['transaction_date', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    return {
      transactions: rows,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit
    };
  }

  /**
   * Create a Credit or Debit entry with atomic balance calculation
   */
  public static async createTransaction(data: {
    partyId: string;
    userId: string;
    type: TransactionType;
    amount: number;
    transaction_date: string;
    notes?: string;
    bill_reference?: string;
  }): Promise<Transaction> {
    const t = await sequelize.transaction();

    try {
      const party = await Party.findOne({
        where: { id: data.partyId, user_id: data.userId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!party) {
        throw AppError.notFound('Party not found or access denied');
      }

      // Ledger Formula:
      // Current Balance = You Gave (Debit) - You Got (Credit)
      // Positive Balance (+) = Customer Owes You
      // Negative Balance (-) = You Owe Customer
      let updatedBalance: number;
      const currentBal = Number(party.current_balance) || 0;
      const txAmount = Number(data.amount);

      if (data.type === TransactionType.DEBIT) {
        updatedBalance = currentBal + txAmount; // You Gave: customer debt increases
      } else {
        updatedBalance = currentBal - txAmount; // You Got: customer debt decreases
      }

      const transaction = await Transaction.create(
        {
          party_id: party.id,
          user_id: data.userId,
          type: data.type,
          amount: txAmount,
          transaction_date: data.transaction_date,
          notes: data.notes ? data.notes.trim() : null,
          bill_reference: data.bill_reference ? data.bill_reference.trim() : null,
          balance_after: updatedBalance
        },
        { transaction: t }
      );

      party.current_balance = updatedBalance;
      await party.save({ transaction: t });

      await t.commit();
      return transaction;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Delete a transaction and reverse balance
   */
  public static async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.findOne({
        where: { id: transactionId, user_id: userId },
        transaction: t
      });

      if (!transaction) {
        throw AppError.notFound('Transaction not found or access denied');
      }

      const party = await Party.findOne({
        where: { id: transaction.party_id, user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!party) {
        throw AppError.notFound('Associated party not found');
      }

      // Reverse balance calculation
      const currentBal = Number(party.current_balance) || 0;
      const txAmount = Number(transaction.amount);

      if (transaction.type === TransactionType.DEBIT) {
        party.current_balance = currentBal - txAmount;
      } else {
        party.current_balance = currentBal + txAmount;
      }

      await party.save({ transaction: t });
      await transaction.destroy({ transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Update an existing transaction and recalculate party balance atomically
   */
  public static async updateTransaction(data: {
    transactionId: string;
    partyId: string;
    userId: string;
    type: TransactionType;
    amount: number;
    transaction_date: string;
    notes?: string;
    bill_reference?: string;
  }): Promise<Transaction> {
    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.findOne({
        where: { id: data.transactionId, user_id: data.userId, party_id: data.partyId },
        transaction: t
      });

      if (!transaction) {
        throw AppError.notFound('Transaction not found or access denied');
      }

      const party = await Party.findOne({
        where: { id: data.partyId, user_id: data.userId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!party) {
        throw AppError.notFound('Associated party not found');
      }

      const currentBal = Number(party.current_balance) || 0;
      const oldAmount = Number(transaction.amount);
      const newAmount = Number(data.amount);

      // 1. Reverse the old transaction impact on party current_balance
      let baseBal = currentBal;
      if (transaction.type === TransactionType.DEBIT) {
        baseBal -= oldAmount;
      } else {
        baseBal += oldAmount;
      }

      // 2. Apply the new transaction impact on party current_balance
      let newBal = baseBal;
      if (data.type === TransactionType.DEBIT) {
        newBal += newAmount;
      } else {
        newBal -= newAmount;
      }

      // 3. Update the transaction record
      transaction.type = data.type;
      transaction.amount = newAmount;
      transaction.transaction_date = data.transaction_date;
      transaction.notes = data.notes ? data.notes.trim() : null;
      transaction.bill_reference = data.bill_reference ? data.bill_reference.trim() : null;
      transaction.balance_after = newBal;

      party.current_balance = newBal;

      await transaction.save({ transaction: t });
      await party.save({ transaction: t });

      await t.commit();
      return transaction;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
