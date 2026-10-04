import { Request, Response, NextFunction } from 'express';
import { PartyService } from '../services/PartyService';
import { env } from '../config/environment';

export class PartyController {
  /**
   * Main Home Dashboard: Parties List, Filters, Search & Summary Cards
   */
  public static async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const search = (req.query.search as string) || '';
      const filter = (req.query.filter as string) || 'all';

      const [stats, result] = await Promise.all([
        PartyService.getStats(userId),
        PartyService.getParties({ userId, page, limit, search, filter })
      ]);

      res.render('pages/parties/index', {
        title: `Parties - ${env.server.appShortName}`,
        stats,
        parties: result.parties,
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        limit: result.limit,
        search,
        filter
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create New Party
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, mobile_no, notes } = req.body;

      const party = await PartyService.createParty(userId, { name, mobile_no, notes });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(201).json({ success: true, message: 'Party created successfully', party });
        return;
      }

      if (req.flash) req.flash('success', [`Party "${party.name}" added successfully.`]);
      res.redirect('/parties');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Show Edit Party Form
   */
  public static async showEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.id as string;
      const party = await PartyService.getPartyById(partyId, userId);

      res.render('pages/parties/edit', {
        title: `Edit ${party.name} - ${env.server.appShortName}`,
        party
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Party
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.id as string;
      const { name, mobile_no, notes } = req.body;

      const party = await PartyService.updateParty(partyId, userId, { name, mobile_no, notes });

      if (req.flash) req.flash('success', [`Party "${party.name}" updated successfully.`]);
      res.redirect(`/parties/${party.id}/ledger`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete Party
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.id as string;
      await PartyService.deleteParty(partyId, userId);

      if (req.flash)
        req.flash('success', ['Party and all ledger transactions deleted successfully.']);
      res.redirect('/parties');
    } catch (err) {
      next(err);
    }
  }
}
