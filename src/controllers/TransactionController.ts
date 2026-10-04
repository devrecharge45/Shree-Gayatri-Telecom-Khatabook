import { Request, Response, NextFunction } from 'express';
import { PartyService } from '../services/PartyService';
import { TransactionService } from '../services/TransactionService';
import { TransactionType } from '../constants/transaction-types';
import { env } from '../config/environment';

export class TransactionController {
  /**
   * Show Party Ledger Page
   */
  public static async showLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const type = (req.query.type as string) || '';
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';

      const [party, ledgerData] = await Promise.all([
        PartyService.getPartyById(partyId, userId),
        TransactionService.getLedger({
          partyId,
          userId,
          page,
          limit,
          search,
          type,
          startDate,
          endDate
        })
      ]);

      res.render('pages/ledger/show', {
        title: `${party.name} Ledger - ${env.server.appShortName}`,
        party,
        transactions: ledgerData.transactions,
        totalCount: ledgerData.totalCount,
        currentPage: ledgerData.currentPage,
        totalPages: ledgerData.totalPages,
        limit: ledgerData.limit,
        search,
        type,
        startDate,
        endDate,
        TransactionType
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add Credit (You Got) or Debit (You Gave) Transaction
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;
      const { type, amount, transaction_date, notes, bill_reference } = req.body;

      await TransactionService.createTransaction({
        partyId,
        userId,
        type,
        amount: parseFloat(amount),
        transaction_date,
        notes,
        bill_reference
      });

      const label = type === TransactionType.CREDIT ? 'Payment (You Got)' : 'Credit (You Gave)';
      if (req.flash) req.flash('success', [`${label} of ₹${amount} recorded successfully.`]);
      res.redirect(`/parties/${partyId}/ledger`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Transaction
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;
      const id = req.params.id as string;
      const { type, amount, transaction_date, notes, bill_reference } = req.body;

      await TransactionService.updateTransaction({
        transactionId: id,
        partyId,
        userId,
        type,
        amount: parseFloat(amount),
        transaction_date,
        notes,
        bill_reference
      });

      if (req.flash) req.flash('success', ['Transaction updated successfully.']);
      res.redirect(`/parties/${partyId}/ledger`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete Transaction
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;
      const id = req.params.id as string;

      await TransactionService.deleteTransaction(id, userId);

      if (req.flash)
        req.flash('success', ['Transaction deleted and balance adjusted successfully.']);
      res.redirect(`/parties/${partyId}/ledger`);
    } catch (err) {
      next(err);
    }
  }
}
