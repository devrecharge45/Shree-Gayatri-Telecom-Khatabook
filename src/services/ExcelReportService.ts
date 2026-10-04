import ExcelJS from 'exceljs';
import { Response } from 'express';
import { Party } from '../models/Party.model';
import { Transaction } from '../models/Transaction.model';
import { env } from '../config/environment';
import { TransactionType } from '../constants/transaction-types';

export class ExcelReportService {
  /**
   * Generate branded Ledger Excel (.xlsx) spreadsheet and stream to Express response
   */
  public static async generateLedgerExcel(
    party: Party,
    transactions: Transaction[],
    res: Response
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = env.company.name;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ledger Statement');

    // Set column definitions
    sheet.columns = [
      { key: 'date', width: 14 },
      { key: 'details', width: 35 },
      { key: 'bill_ref', width: 18 },
      { key: 'debit', width: 20 },
      { key: 'credit', width: 20 },
      { key: 'balance', width: 22 }
    ];

    // 1. Company Header Rows
    sheet.addRow([env.company.name]);
    sheet.addRow([`GSTIN: ${env.company.gst || 'N/A'} | Phone: ${env.company.phone || 'N/A'}`]);
    sheet.addRow([env.company.address || '']);
    sheet.addRow([]);

    // 2. Party Details
    sheet.addRow([
      `Party Name: ${party.name}`,
      '',
      '',
      `Statement Date: ${new Date().toLocaleDateString('en-IN')}`
    ]);
    sheet.addRow([
      `Mobile: ${party.mobile_no || 'N/A'}`,
      '',
      '',
      `Current Balance: ₹${party.current_balance}`
    ]);
    sheet.addRow([]);

    // Style top title
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
    sheet.getRow(2).font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    sheet.getRow(3).font = { size: 10, color: { argb: 'FF64748B' } };
    sheet.getRow(5).font = { bold: true };
    sheet.getRow(6).font = { bold: true };

    // 3. Table Header Row
    const headerRow = sheet.addRow([
      'Date',
      'Description / Note',
      'Bill Reference',
      'You Gave (Debit)',
      'You Got (Credit)',
      'Balance After'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' } // Deep Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 4. Data Rows
    transactions.forEach((tx) => {
      const isDebit = tx.type === TransactionType.DEBIT;
      const row = sheet.addRow([
        tx.transaction_date,
        tx.notes || '-',
        tx.bill_reference || '-',
        isDebit ? Number(tx.amount) : null,
        !isDebit ? Number(tx.amount) : null,
        Number(tx.balance_after)
      ]);

      row.getCell(4).numFmt = '₹#,##0.00';
      row.getCell(5).numFmt = '₹#,##0.00';
      row.getCell(6).numFmt = '₹#,##0.00';

      row.getCell(4).font = { color: { argb: 'FFDC2626' } }; // Red for debit
      row.getCell(5).font = { color: { argb: 'FF059669' } }; // Green for credit

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // 5. Total Row
    sheet.addRow([]);
    const startRow = 8;
    const endRow = 7 + transactions.length;

    const totalRow = sheet.addRow([
      'TOTAL',
      '',
      '',
      transactions.length > 0 ? { formula: `SUM(D${startRow}:D${endRow})` } : 0,
      transactions.length > 0 ? { formula: `SUM(E${startRow}:E${endRow})` } : 0,
      Number(party.current_balance)
    ]);

    totalRow.font = { bold: true };
    totalRow.getCell(4).numFmt = '₹#,##0.00';
    totalRow.getCell(5).numFmt = '₹#,##0.00';
    totalRow.getCell(6).numFmt = '₹#,##0.00';

    // Set Response Headers
    const sanitizedPartyName = party.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Ledger_${sanitizedPartyName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
