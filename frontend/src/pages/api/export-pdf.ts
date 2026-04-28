import type { NextApiRequest, NextApiResponse } from 'next';

function buildPDF(expenses: any[], categories: any[]): Buffer {
  const dateStr = new Date().toLocaleDateString();
  const total = expenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);

  const lines: string[] = [];
  const esc = (s: string) => String(s ?? '').replace(/[()\\]/g, '\\$&').substring(0, 40);

  const addText = (x: number, y: number, text: string, size = 12, bold = false) => {
    lines.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`);
  };

  const addRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    lines.push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f 0 0 0 rg`);
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    lines.push(`0.88 0.88 0.88 RG ${x1} ${y1} m ${x2} ${y2} l S 0 0 0 RG`);
  };

  const pageH = 841;
  let y = pageH - 60;

  addText(40, y, 'Financial Report: Expenses', 20, true);
  y -= 24;
  addText(40, y, `Report Period: Last 30 Days     Generated: ${dateStr}`, 10);
  y -= 18;
  addText(40, y, `Total Expenses: $${total.toFixed(2)}`, 13, true);
  y -= 28;

  const tableTop = y;
  addRect(40, tableTop, 515, 22, 0.06, 0.09, 0.16);
  lines.push(`1 1 1 rg`);
  lines.push(`BT /F2 9 Tf 44 ${tableTop + 6} Td (Date) Tj ET`);
  lines.push(`BT /F2 9 Tf 130 ${tableTop + 6} Td (Description) Tj ET`);
  lines.push(`BT /F2 9 Tf 340 ${tableTop + 6} Td (Category) Tj ET`);
  lines.push(`BT /F2 9 Tf 460 ${tableTop + 6} Td (Amount) Tj ET`);
  lines.push(`0 0 0 rg`);
  y -= 22;

  expenses.forEach((exp: any, idx: number) => {
    if (idx % 2 === 0) addRect(40, y, 515, 18, 0.97, 0.98, 0.99);
    const date = exp.date ? new Date(exp.date).toLocaleDateString() : '-';
    const desc = (exp.description || '-').substring(0, 28);
    const cat = (categories?.find((c: any) => c.id === exp.categoryId)?.name || 'General').substring(0, 16);
    const amount = `$${Number(exp.amount).toFixed(2)}`;
    addText(44, y + 4, date, 8);
    addText(130, y + 4, desc, 8);
    addText(340, y + 4, cat, 8);
    addText(460, y + 4, amount, 8);
    addLine(40, y, 555, y);
    y -= 18;
  });

  if (expenses.length === 0) {
    addText(40, y + 4, 'No expense records found.', 11);
  }

  const contentStream = lines.join('\n');
  const streamLen = Buffer.byteLength(contentStream, 'latin1');

  const objects: string[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const header = '%PDF-1.4\n';
  offset = Buffer.byteLength(header, 'latin1');

  const addObj = (n: number, content: string) => {
    offsets[n] = offset;
    const obj = `${n} 0 obj\n${content}\nendobj\n`;
    objects.push(obj);
    offset += Buffer.byteLength(obj, 'latin1');
  };

  addObj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
  addObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);
  addObj(4, `<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream`);
  addObj(5, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  addObj(6, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  const xrefOffset = offset;
  const xref = [
    `xref`,
    `0 ${objects.length + 1}`,
    `0000000000 65535 f `,
    ...offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n `),
  ].join('\n');

  const trailer = `\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(header + objects.join('') + xref + trailer, 'latin1');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let expenses: any[] = [];
  let categories: any[] = [];

  try {
    if (req.method === 'POST') {
      // Data passed directly in body
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      expenses = data.expenses || [];
      categories = data.categories || [];
    } else if (req.method === 'GET') {
      const token = req.query.token as string;
      if (!token) {
        return res.status(401).json({ error: 'Missing auth token' });
      }

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

      const [expRes, catRes] = await Promise.all([
        fetch(`${backendUrl}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/expenses/categories`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      expenses = expRes.ok ? await expRes.json() : [];
      categories = catRes.ok ? await catRes.json() : [];
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const pdfBuffer = buildPDF(Array.isArray(expenses) ? expenses : [], Array.isArray(categories) ? categories : []);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="expenses_report_${dateStr}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('[PDF Pages API Error]', error?.message || error);
    res.status(500).json({ error: 'PDF generation failed', detail: error?.message });
  }
}

