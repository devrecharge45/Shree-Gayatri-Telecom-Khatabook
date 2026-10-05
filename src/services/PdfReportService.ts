import PDFDocument from 'pdfkit-table';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { Party } from '../models/Party.model';
import { Transaction } from '../models/Transaction.model';
import { env } from '../config/environment';
import { Formatters } from '../utils/formatters';
import { TransactionType } from '../constants/transaction-types';

type PdfKitTableDoc = Omit<PDFKit.PDFDocument, 'table'> & {
  table(
    table: {
      headers: Array<{
        label: string;
        width?: number;
        align?: string;
        headerColor?: string;
        headerOpacity?: number;
      }>;
      rows: Array<Array<string>>;
    },
    options?: {
      x?: number;
      y?: number;
      width?: number;
      prepareHeader?: () => void;
      prepareRow?: (row: unknown, indexColumn: number, indexRow: number, rectRow: unknown) => void;
      divider?: {
        header?: { disabled?: boolean; width?: number; opacity?: number };
        horizontal?: { disabled?: boolean; width?: number; opacity?: number };
      };
    }
  ): Promise<void>;
  addBackground(rect: unknown, color: string, opacity?: number): void;
};

// Safe currency formatter using universal 'Rs.' to guarantee compatibility with all PDF viewers
function formatRs(amount: number | string | null | undefined): string {
  const num = Math.abs(Number(amount) || 0);
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export class PdfReportService {
  /**
   * Generate beautifully branded Ledger PDF report and stream to Express response
   */
  public static async generateLedgerPdf(
    party: Party,
    transactions: Transaction[],
    res: Response
  ): Promise<void> {
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `${party.name} - Ledger Statement`,
        Author: env.company.name,
        Subject: 'Customer Khata Ledger Account Statement'
      }
    }) as unknown as PdfKitTableDoc;

    const sanitizedPartyName = party.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Ledger_${sanitizedPartyName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // 1. Top Royal Blue Accent Stripe
    doc.rect(0, 0, 595.28, 5).fill('#1D4ED8');

    // 2. Header: Logo & Company Branding
    const logoPath = path.join(__dirname, '../../public/images/logo.png');
    let headerTextX = 30;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 30, 16, { fit: [48, 48] });
        headerTextX = 86;
      } catch {
        headerTextX = 30;
      }
    }

    const companyInfoWidth = 270;

    doc
      .fontSize(14)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text(env.company.name, headerTextX, 16, { width: companyInfoWidth });

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');

    if (env.company.phone) {
      doc.text(`Phone: ${env.company.phone}`, headerTextX, doc.y + 2, { width: companyInfoWidth });
    }

    if (env.company.address) {
      doc
        .fontSize(8)
        .fillColor('#64748B')
        .text(env.company.address, headerTextX, doc.y + 2, {
          width: companyInfoWidth,
          lineGap: 1.5
        });
    }

    // Right-aligned Document Title Block
    doc
      .fontSize(13)
      .fillColor('#1D4ED8')
      .font('Helvetica-Bold')
      .text('ACCOUNT STATEMENT', 365, 16, { align: 'right', width: 200 })
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748B')
      .text(`Date: ${Formatters.date(new Date())}`, 365, 34, { align: 'right', width: 200 })
      .text(`Statement: Customer Khata`, 365, 46, { align: 'right', width: 200 })
      .text(`Total Records: ${transactions.length}`, 365, 58, { align: 'right', width: 200 });

    // Header Divider
    doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(30, 82).lineTo(565, 82).stroke();

    // 3. Compute Totals
    let totalDebit = 0;
    let totalCredit = 0;
    transactions.forEach((t) => {
      if (t.type === TransactionType.DEBIT) totalDebit += Number(t.amount);
      if (t.type === TransactionType.CREDIT) totalCredit += Number(t.amount);
    });

    const netBalance = Number(party.current_balance) || 0;
    const balanceStatus =
      netBalance > 0
        ? 'You Will Get (Receivable)'
        : netBalance < 0
          ? 'You Will Give (Payable)'
          : 'All Clear (Settled)';
    const balanceColor = netBalance > 0 ? '#059669' : netBalance < 0 ? '#DC2626' : '#64748B';

    // 4. Two Structured Summary Cards Side-by-Side
    // Left Card: Customer Details
    doc.roundedRect(30, 92, 245, 68, 4).fillAndStroke('#F8FAFC', '#E2E8F0');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1D4ED8')
      .text('CUSTOMER / PARTY DETAILS', 40, 100)
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(party.name, 40, 114)
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#475569')
      .text(`Mobile: ${party.mobile_no || 'Not Available'}`, 40, 130)
      .text(
        party.notes ? `Note: ${party.notes.substring(0, 38)}` : 'Active Customer Account',
        40,
        142
      );

    // Right Card: Financial Statement Summary
    doc.roundedRect(290, 92, 275, 68, 4).fillAndStroke('#F8FAFC', '#E2E8F0');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1D4ED8')
      .text('LEDGER BALANCE SUMMARY', 300, 100)
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#475569')
      .text(`Total You Gave (Debit / Goods):`, 300, 114)
      .font('Helvetica-Bold')
      .fillColor('#DC2626')
      .text(formatRs(totalDebit), 450, 114, { align: 'right', width: 105 })
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Total You Got (Credit / Paid):`, 300, 126)
      .font('Helvetica-Bold')
      .fillColor('#059669')
      .text(formatRs(totalCredit), 450, 126, { align: 'right', width: 105 })
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(`Net Balance:`, 300, 142)
      .font('Helvetica-Bold')
      .fillColor(balanceColor)
      .text(`${formatRs(netBalance)} [${balanceStatus}]`, 365, 142, { align: 'right', width: 190 });

    // Explicitly reset doc.x and doc.y before rendering table
    doc.x = 30;
    doc.y = 175;

    // 5. Transactions Table
    const tableRows = transactions.map((tx) => {
      const isDebit = tx.type === TransactionType.DEBIT;
      const refText = tx.bill_reference ? ` (Ref: ${tx.bill_reference})` : '';
      const notes = (tx.notes || 'Transaction Entry') + refText;
      return [
        Formatters.date(tx.transaction_date),
        notes,
        isDebit ? formatRs(tx.amount) : '-',
        !isDebit ? formatRs(tx.amount) : '-',
        formatRs(tx.balance_after)
      ];
    });

    if (tableRows.length === 0) {
      tableRows.push(['-', 'No transactions recorded yet in this ledger', '-', '-', formatRs(0)]);
    }

    // Append Summary Total Row
    tableRows.push([
      'TOTAL',
      `${transactions.length} Transactions Recorded`,
      formatRs(totalDebit),
      formatRs(totalCredit),
      formatRs(netBalance)
    ]);

    // Printable width is 535 points (595.28 page width - 60 margins)
    const table = {
      headers: [
        { label: 'Date', width: 70, align: 'left', headerColor: '#1D4ED8', headerOpacity: 1 },
        {
          label: 'Transaction Details & Ref',
          width: 185,
          align: 'left',
          headerColor: '#1D4ED8',
          headerOpacity: 1
        },
        {
          label: 'You Gave (Debit)',
          width: 90,
          align: 'right',
          headerColor: '#1D4ED8',
          headerOpacity: 1
        },
        {
          label: 'You Got (Credit)',
          width: 90,
          align: 'right',
          headerColor: '#1D4ED8',
          headerOpacity: 1
        },
        { label: 'Balance', width: 100, align: 'right', headerColor: '#1D4ED8', headerOpacity: 1 }
      ],
      rows: tableRows
    };

    await doc.table(table, {
      x: 30,
      y: 175,
      width: 535,
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF'),
      prepareRow: (row: unknown, indexColumn: number, indexRow: number, rectRow: unknown) => {
        const isTotalRow = indexRow === tableRows.length - 1;
        doc.font(isTotalRow ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
        doc.fillColor(isTotalRow ? '#0F172A' : '#334155');
        if (indexColumn === 0) {
          if (isTotalRow) {
            doc.addBackground(rectRow, '#E2E8F0', 1);
          } else if (indexRow % 2 === 1) {
            doc.addBackground(rectRow, '#F8FAFC', 1);
          }
        }
      },
      divider: {
        header: { disabled: false, width: 1, opacity: 1 },
        horizontal: { disabled: false, width: 0.5, opacity: 0.25 }
      }
    });

    // 6. Signatures Section (Cleanly anchored near bottom above footer)
    let sigY = Math.min(Math.max(doc.y + 35, 620), 690);
    if (doc.y + 70 > 740) {
      doc.addPage();
      sigY = 60;
    }

    doc
      .strokeColor('#CBD5E1')
      .lineWidth(1)
      .dash(4, { space: 2 })
      .moveTo(40, sigY + 30)
      .lineTo(190, sigY + 30)
      .stroke()
      .undash();

    doc
      .fontSize(8.5)
      .fillColor('#64748B')
      .font('Helvetica')
      .text('Customer Signature', 40, sigY + 36, { width: 150, align: 'center' });

    doc
      .strokeColor('#CBD5E1')
      .lineWidth(1)
      .dash(4, { space: 2 })
      .moveTo(375, sigY + 30)
      .lineTo(550, sigY + 30)
      .stroke()
      .undash();

    doc
      .fontSize(8.5)
      .fillColor('#64748B')
      .font('Helvetica')
      .text(`Authorized Signatory (${env.company.name})`, 365, sigY + 36, {
        width: 195,
        align: 'center'
      });

    // 7. Footer (Safely rendered on all buffered pages inside the printable area)
    const pageRange = doc.bufferedPageRange();
    for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor('#94A3B8')
        .font('Helvetica')
        .text(
          `This is a computer-generated ledger statement issued by ${env.company.name} via ${env.server.appName} • Page ${i + 1} of ${pageRange.count} • Confidential`,
          30,
          780,
          { align: 'center', width: 535, lineBreak: false }
        );
    }

    doc.end();
  }
}
