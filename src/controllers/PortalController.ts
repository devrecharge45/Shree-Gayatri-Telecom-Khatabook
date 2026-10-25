import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { Party } from '../models/Party.model';
import { User } from '../models/User.model';
import { TransactionService } from '../services/TransactionService';
import { PdfReportService } from '../services/PdfReportService';
import { ExcelReportService } from '../services/ExcelReportService';
import { AppError } from '../utils/AppError';

export class PortalController {
  /**
   * Show Customer Portal Login Page
   */
  public static showLogin(req: Request, res: Response): void {
    res.render('pages/portal/login', {
      title: `Customer Passbook Login - ${env.server.appShortName}`
    });
  }

  /**
   * Process Customer Portal Login
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mobile_no, password } = req.body;

      if (!mobile_no || !password) {
        if (req.flash) req.flash('errors', ['Please enter your mobile number and password.']);
        res.redirect('/portal/login');
        return;
      }

      const cleanMobile = mobile_no
        .toString()
        .trim()
        .replace(/[^0-9]/g, '');

      // Look up parties by registered mobile with portal access enabled
      const parties = await Party.findAll({
        where: {
          mobile_no: cleanMobile,
          portal_access_enabled: true
        }
      });

      if (!parties || parties.length === 0) {
        if (req.flash) {
          req.flash('errors', [
            'No active passbook found for this mobile number. Please contact the shop owner to enable your digital passbook.'
          ]);
        }
        res.redirect('/portal/login');
        return;
      }

      // Verify password
      let authenticatedParty: Party | null = null;
      for (const p of parties) {
        const isMatch = await p.verifyPassword(password);
        if (isMatch) {
          authenticatedParty = p;
          break;
        }
      }

      if (!authenticatedParty) {
        if (req.flash) {
          req.flash('errors', [
            'Incorrect password. Please verify the password provided by the shop.'
          ]);
        }
        res.redirect('/portal/login');
        return;
      }

      // Create JWT token for party session
      const token = jwt.sign(
        {
          id: authenticatedParty.id,
          mobile_no: authenticatedParty.mobile_no,
          role: 'party'
        },
        env.security.jwtSecret,
        { expiresIn: '15d' }
      );

      res.cookie('party_auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.server.nodeEnv === 'production',
        maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
      });

      if (req.flash) {
        req.flash('success', [
          `Welcome ${authenticatedParty.name}! Here is your digital passbook.`
        ]);
      }
      res.redirect('/portal/passbook');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out from Customer Portal
   */
  public static logout(req: Request, res: Response): void {
    res.clearCookie('party_auth_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.server.nodeEnv === 'production'
    });

    if (req.flash) req.flash('success', ['You have successfully logged out of your passbook.']);
    res.redirect('/portal/login');
  }

  /**
   * Customer Passbook Dashboard (Read-Only)
   */
  public static async passbook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const party = req.party!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const type = (req.query.type as string) || '';
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId: party.id,
        userId: party.user_id,
        page,
        limit,
        search,
        type,
        startDate,
        endDate
      });

      // Fetch shop owner details for business header
      const shopOwner = await User.findByPk(party.user_id, {
        attributes: ['id', 'name', 'email']
      });

      res.render('pages/portal/passbook', {
        title: `${party.name} - Digital Passbook | ${env.server.appShortName}`,
        party,
        shopOwner,
        transactions: ledgerData.transactions,
        totalCount: ledgerData.totalCount,
        currentPage: ledgerData.currentPage,
        totalPages: ledgerData.totalPages,
        limit: ledgerData.limit,
        search,
        type,
        startDate,
        endDate,
        isPreview: false
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 1-Click Admin Passbook Preview (Admin impersonation to view party passbook)
   */
  public static async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const partyId = req.params.partyId as string;

      const party = await Party.findOne({
        where: { id: partyId, user_id: adminId }
      });

      if (!party) {
        throw AppError.notFound('Party not found in your Khatabook.');
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const type = (req.query.type as string) || '';
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId: party.id,
        userId: party.user_id,
        page,
        limit,
        search,
        type,
        startDate,
        endDate
      });

      res.render('pages/portal/passbook', {
        title: `[Preview] ${party.name} - Digital Passbook`,
        party,
        shopOwner: req.user,
        transactions: ledgerData.transactions,
        totalCount: ledgerData.totalCount,
        currentPage: ledgerData.currentPage,
        totalPages: ledgerData.totalPages,
        limit: ledgerData.limit,
        search,
        type,
        startDate,
        endDate,
        isPreview: true
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download PDF Statement from Customer Portal
   */
  public static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const party = req.party!;
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';
      const type = (req.query.type as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId: party.id,
        userId: party.user_id,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type || undefined
      });

      await PdfReportService.generateLedgerPdf(party, ledgerData.transactions, res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download Excel Statement from Customer Portal
   */
  public static async downloadXlsx(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const party = req.party!;
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';
      const type = (req.query.type as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId: party.id,
        userId: party.user_id,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type || undefined
      });

      await ExcelReportService.generateLedgerExcel(party, ledgerData.transactions, res);
    } catch (err) {
      next(err);
    }
  }
}
