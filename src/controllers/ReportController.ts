import { Request, Response, NextFunction } from 'express';
import { PartyService } from '../services/PartyService';
import { TransactionService } from '../services/TransactionService';
import { PdfReportService } from '../services/PdfReportService';
import { ExcelReportService } from '../services/ExcelReportService';

export class ReportController {
  /**
   * Export Ledger as Branded PDF
   */
  public static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';
      const type = (req.query.type as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId,
        userId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type || undefined
        // No limit passed -> exports complete statement
      });

      const party = await PartyService.getPartyById(partyId, userId);

      await PdfReportService.generateLedgerPdf(party, ledgerData.transactions, res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export Ledger as Branded Excel (.xlsx)
   */
  public static async downloadExcel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const partyId = req.params.partyId as string;
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';
      const type = (req.query.type as string) || '';

      const ledgerData = await TransactionService.getLedger({
        partyId,
        userId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type || undefined
        // No limit passed -> exports complete statement
      });

      const party = await PartyService.getPartyById(partyId, userId);

      await ExcelReportService.generateLedgerExcel(party, ledgerData.transactions, res);
    } catch (err) {
      next(err);
    }
  }
}
