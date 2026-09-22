import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Workbook } from 'exceljs';
import PDFDocument = require('pdfkit');
import { Session, requireChurch } from '../common/session';
import { PledgesService } from '../pledges/pledges.service';
import { ReportFilterDto } from './report-filter.dto';
import { Roles, RolesGuard } from '../common/roles.guard';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly pledges: PledgesService) {}
  @Roles('ADMIN', 'STAFF')
  @Get() async report(
    @Req() req: { user: Session },
    @Query() filter: ReportFilterDto,
  ) {
    const rows = (await this.pledges.list(requireChurch(req.user))).filter(
      (row) =>
        (!filter.campaignId || row.campaignId === filter.campaignId) &&
        (!filter.group || row.member.group.name === filter.group) &&
        (!filter.status || row.status === filter.status) &&
        (!filter.from || row.dueDate >= new Date(filter.from)) &&
        (!filter.to || row.dueDate <= new Date(filter.to)),
    );
    return {
      rows,
      totals: {
        pledged: rows.reduce((s, p) => s + p.amount, 0),
        paid: rows.reduce((s, p) => s + p.paid, 0),
        outstanding: rows.reduce((s, p) => s + p.balance, 0),
      },
    };
  }
  @Roles('ADMIN', 'STAFF')
  @Get('export.xlsx') async excel(
    @Req() req: { user: Session },
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    const { rows, totals } = await this.report(req, filter);
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Pledges');
    sheet.addRow(['Church pledge report']);
    sheet.addRow([
      'Member',
      'Phone',
      'Group',
      'Campaign',
      'Pledged (UGX)',
      'Paid (UGX)',
      'Balance (UGX)',
      'Due date',
      'Status',
    ]);
    rows.forEach((row) =>
      sheet.addRow([
        row.member.fullName,
        row.member.phone,
        row.member.group.name,
        row.campaign.name,
        row.amount,
        row.paid,
        row.balance,
        row.dueDate.toISOString().slice(0, 10),
        row.status,
      ]),
    );
    sheet.addRow([
      'Totals',
      '',
      '',
      '',
      totals.pledged,
      totals.paid,
      totals.outstanding,
    ]);
    sheet.columns.forEach((column) => (column.width = 24));
    sheet.getRow(2).font = { bold: true };
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pledge-report.xlsx"',
    );
    await workbook.xlsx.write(res);
    res.end();
  }
  @Roles('ADMIN', 'STAFF')
  @Get('export.pdf') async pdf(
    @Req() req: { user: Session },
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    const { rows, totals } = await this.report(req, filter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pledge-report.pdf"',
    );
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(20).text('Church pledge report').moveDown();
    rows.forEach((row) => {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(11).text(`${row.member.fullName} | ${row.campaign.name}`);
      doc
        .fontSize(9)
        .text(`${row.member.phone} | ${row.member.group.name} | ${row.status}`);
      doc.text(
        `UGX pledged: ${row.amount.toLocaleString()} | paid: ${row.paid.toLocaleString()} | balance: ${row.balance.toLocaleString()}`,
      );
      doc.text(`Due: ${row.dueDate.toISOString().slice(0, 10)}`).moveDown();
    });
    doc
      .fontSize(11)
      .text(
        `Totals (UGX): pledged ${totals.pledged.toLocaleString()}, paid ${totals.paid.toLocaleString()}, outstanding ${totals.outstanding.toLocaleString()}`,
      );
    doc.end();
  }
}
