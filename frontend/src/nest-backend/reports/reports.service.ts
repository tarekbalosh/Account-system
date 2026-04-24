// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PdfPrinter from 'pdfmake';
import * as ExcelJS from 'exceljs';
import * as express from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitLoss(from: Date, to: Date) {
    const consumptionCategory = await this.prisma.expenseCategory.findUnique({
      where: { name: 'Consumption Materials' }
    });

    const sales = await this.prisma.sale.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const totalRevenue = Number(sales._sum.amount) || 0;

    // General Expenses (excluding Consumption Materials)
    const generalExpensesAgg = await this.prisma.expense.aggregate({
      where: { 
        date: { gte: from, lte: to },
        categoryId: { not: consumptionCategory?.id || -1 }
      },
      _sum: { amount: true },
    });

    // Consumption Materials
    const consumptionMaterialsAgg = await this.prisma.expense.aggregate({
      where: { 
        date: { gte: from, lte: to },
        categoryId: consumptionCategory?.id || -1
      },
      _sum: { amount: true },
    });

    const generalExpenses = Number(generalExpensesAgg._sum.amount) || 0;
    const consumptionMaterials = Number(consumptionMaterialsAgg._sum.amount) || 0;
    const totalExpenses = generalExpenses + consumptionMaterials;
    const netProfit = totalRevenue - totalExpenses;

    return {
      period: { from, to },
      totalRevenue,
      generalExpenses,
      consumptionMaterials,
      totalExpenses,
      netProfit,
    };
  }

  async exportToExcel(res: express.Response, from: Date, to: Date) {
    const data = await this.getProfitLoss(from, to);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Profit & Loss');

    worksheet.columns = [
      { header: 'Description', key: 'desc', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];

    worksheet.addRow({ desc: 'Total Revenue', amount: data.totalRevenue });
    worksheet.addRow({ desc: 'General Expenses', amount: data.generalExpenses });
    worksheet.addRow({ desc: 'Consumption Materials', amount: data.consumptionMaterials });
    worksheet.addRow({ desc: 'Total Expenses', amount: data.totalExpenses });
    worksheet.addRow({ desc: 'Net Profit', amount: data.netProfit });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // PDF generation would usually use a separate utility or library like pdfmake
  // For simplicity here, I'll provide a placeholder or basic structure
  async generatePDF(res: express.Response, from: Date, to: Date) {
    const data = await this.getProfitLoss(from, to);
    
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      content: [
        { text: 'Profit & Loss Report', style: 'header' },
        { text: `Period: ${from.toDateString()} - ${to.toDateString()}`, margin: [0, 10] },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              ['Description', 'Amount'],
              ['Total Revenue', data.totalRevenue.toFixed(2)],
              ['General Expenses', data.generalExpenses.toFixed(2)],
              ['Consumption Materials', data.consumptionMaterials.toFixed(2)],
              ['Total Expenses', data.totalExpenses.toFixed(2)],
              ['Net Profit', data.netProfit.toFixed(2)],
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  }
}
