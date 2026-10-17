import { Op, WhereOptions, InferAttributes, Transaction as SequelizeTransaction } from 'sequelize';
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
   * Recalculates running balances for all transactions of a party in chronological order,
   * updates transaction.balance_after where needed, and sets party.current_balance.
   */
  public static async recalculatePartyBalances(
    partyId: string,
    userId: string,
    t?: SequelizeTransaction
  ): Promise<number> {
    const transactions = await Transaction.findAll({
      where: { party_id: partyId, user_id: userId },
      order: [
        ['transaction_date', 'ASC'],
        ['created_at', 'ASC'],
        ['id', 'ASC']
      ],
      transaction: t,
      lock: t ? t.LOCK.UPDATE : undefined
    });

    let runningBalance = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === TransactionType.DEBIT) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }
      runningBalance = Math.round(runningBalance * 100) / 100;

      if (Math.abs(Number(tx.balance_after) - runningBalance) > 0.0001) {
        tx.balance_after = runningBalance;
        await tx.save({ transaction: t });
      }
    }

    runningBalance = Math.round(runningBalance * 100) / 100;

    await Party.update(
      { current_balance: runningBalance },
      { where: { id: partyId, user_id: userId }, transaction: t }
    );

    return runningBalance;
  }

  /**
   * Fetch ledger transactions for a party with filters and optional pagination
   */
  public static async getLedger(params: LedgerQueryParams) {
    // Reconcile and heal running balance for this party if out-of-sync
    await TransactionService.recalculatePartyBalances(params.partyId, params.userId);

    const hasLimit = typeof params.limit === 'number' && params.limit > 0;
    const page = hasLimit ? Math.max(1, params.page || 1) : 1;
    const limit = hasLimit ? Math.max(1, params.limit!) : undefined;
    const offset = hasLimit ? (page - 1) * limit! : undefined;

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
        ['created_at', 'DESC'],
        ['id', 'DESC']
      ]
    });

    return {
      transactions: rows,
      totalCount: count,
      currentPage: page,
      totalPages: limit ? Math.ceil(count / limit) : 1,
      limit: limit || count
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

      const txAmount = Number(data.amount);

      const transaction = await Transaction.create(
        {
          party_id: party.id,
          user_id: data.userId,
          type: data.type,
          amount: txAmount,
          transaction_date: data.transaction_date,
          notes: data.notes ? data.notes.trim() : null,
          bill_reference: data.bill_reference ? data.bill_reference.trim() : null,
          balance_after: 0
        },
        { transaction: t }
      );

      await TransactionService.recalculatePartyBalances(party.id, data.userId, t);

      await t.commit();
      await transaction.reload();
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

      const partyId = transaction.party_id;

      await transaction.destroy({ transaction: t });

      await TransactionService.recalculatePartyBalances(partyId, userId, t);

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

      transaction.type = data.type;
      transaction.amount = Number(data.amount);
      transaction.transaction_date = data.transaction_date;
      transaction.notes = data.notes ? data.notes.trim() : null;
      transaction.bill_reference = data.bill_reference ? data.bill_reference.trim() : null;

      await transaction.save({ transaction: t });

      await TransactionService.recalculatePartyBalances(data.partyId, data.userId, t);

      await t.commit();
      await transaction.reload();
      return transaction;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
