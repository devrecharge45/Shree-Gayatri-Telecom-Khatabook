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

      const [party, ledgerData] = await Promise.all([
        PartyService.getPartyById(partyId, userId),
        TransactionService.getLedger({
          partyId,
          userId,
          page: 1,
          limit: 1000 // Get complete statement for export
        })
      ]);

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

      const [party, ledgerData] = await Promise.all([
        PartyService.getPartyById(partyId, userId),
        TransactionService.getLedger({
          partyId,
          userId,
          page: 1,
          limit: 1000
        })
      ]);

      await ExcelReportService.generateLedgerExcel(party, ledgerData.transactions, res);
    } catch (err) {
      next(err);
    }
  }
}
