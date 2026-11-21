const ExcelJS = require('exceljs');

const INR_FORMAT = '₹#,##,##0';

async function buildWeddingWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wedding Budget Tracker';
  workbook.created = new Date();

  const { settings, categories, expenses } = data;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totalActual = expenses.reduce((s, e) => s + Number(e.actual || 0), 0);
  const totalPaid = expenses.reduce((s, e) => s + Number(e.paid || 0), 0);
  const totalBalance = Math.max(0, totalActual - totalPaid);

  // --- Sheet 1: Summary ---
  const summarySheet = workbook.addWorksheet('Wedding Summary', {
    views: [{ showGridLines: true }],
  });
  summarySheet.columns = [
    { key: 'metric', width: 32 },
    { key: 'value', width: 26 },
    { key: 'note', width: 36 },
  ];

  summarySheet.mergeCells('A1:C1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `${settings.coupleNames} — ${settings.subtitle}`;
  titleCell.font = { name: 'Georgia', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B1786' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 34;

  summarySheet.mergeCells('A2:C2');
  const subCell = summarySheet.getCell('A2');
  subCell.value = `Location: ${settings.location}   |   Wedding Date: ${settings.weddingDate || 'TBD'}`;
  subCell.font = { size: 10, italic: true, color: { argb: 'FF3B1786' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE7FC' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(2).height = 22;

  summarySheet.addRow([]);
  const headerRow = summarySheet.addRow(['Budget Metric', 'Amount (INR)', 'Notes']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B1786' } };
    cell.alignment = { vertical: 'middle' };
  });
  headerRow.height = 24;

  const summaryRows = [
    ['Total Spend', totalActual, `${expenses.length} wedding entries across ${categories.length} categories`],
    ['Total Paid So Far', totalPaid, `${totalActual > 0 ? Math.round((totalPaid / totalActual) * 100) : 0}% of total cost settled`],
    ['Total Balance Due', totalBalance, 'Remaining payable to vendors'],
  ];

  summaryRows.forEach(([metric, value, note], idx) => {
    const row = summarySheet.addRow([metric, value, note]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = INR_FORMAT;
    row.getCell(2).font = { bold: true, color: { argb: 'FF270E5C' } };
    if (idx % 2 === 1) {
      row.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F3FE' } };
      });
    }
    row.height = 22;
  });

  // Contribution split table
  summarySheet.addRow([]);
  const splitHeader = summarySheet.addRow(['Contribution Split (Paid By)', 'Total Cost (INR)', 'Paid So Far (INR)']);
  splitHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5D2EC2' } };
  });
  splitHeader.height = 22;

  ['Harsha', 'Divya', 'Shared'].forEach((payer) => {
    const payerExpenses = expenses.filter((e) => (e.paidBy || 'Shared') === payer);
    const actual = payerExpenses.reduce((s, e) => s + Number(e.actual || 0), 0);
    const paid = payerExpenses.reduce((s, e) => s + Number(e.paid || 0), 0);
    const row = summarySheet.addRow([payer, actual, paid]);
    row.getCell(2).numFmt = INR_FORMAT;
    row.getCell(3).numFmt = INR_FORMAT;
    row.height = 20;
  });

  if (settings.notes) {
    summarySheet.addRow([]);
    const noteHeader = summarySheet.addRow(['Overall Wedding Notes / Comments', '', '']);
    summarySheet.mergeCells(`A${noteHeader.number}:C${noteHeader.number}`);
    noteHeader.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    noteHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5D2EC2' } };
    const noteRow = summarySheet.addRow([settings.notes, '', '']);
    summarySheet.mergeCells(`A${noteRow.number}:C${noteRow.number}`);
    noteRow.getCell(1).alignment = { wrapText: true };
  }

  // --- Sheet 2: Category Breakdown ---
  const catSheet = workbook.addWorksheet('Category Breakdown', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  catSheet.columns = [
    { header: 'Category', key: 'name', width: 28 },
    { header: 'Items', key: 'count', width: 10 },
    { header: 'Budget Cap (INR)', key: 'cap', width: 18 },
    { header: 'Total Cost (INR)', key: 'actual', width: 18 },
    { header: 'Paid (INR)', key: 'paid', width: 16 },
    { header: 'Harsha Paid (INR)', key: 'harshaPaid', width: 18 },
    { header: 'Divya Paid (INR)', key: 'divyaPaid', width: 18 },
    { header: 'Shared Paid (INR)', key: 'sharedPaid', width: 18 },
    { header: 'Balance Due (INR)', key: 'balance', width: 18 },
    { header: 'Share (%)', key: 'share', width: 12 },
    { header: 'Comments / Notes', key: 'notes', width: 34 },
  ];

  catSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B1786' } };
    cell.alignment = { vertical: 'middle' };
  });
  catSheet.getRow(1).height = 24;

  let totalCaps = 0;
  let totalHarshaPaid = 0;
  let totalDivyaPaid = 0;
  let totalSharedPaid = 0;
  categories.forEach((cat, idx) => {
    const items = expenses.filter((e) => e.categoryId === cat.id);
    const cap = Number(cat.budgetCap || 0);
    const actual = items.reduce((s, e) => s + Number(e.actual || 0), 0);
    const paid = items.reduce((s, e) => s + Number(e.paid || 0), 0);
    const harshaPaid = items
      .filter((e) => e.paidBy === 'Harsha')
      .reduce((s, e) => s + Number(e.paid || 0), 0);
    const divyaPaid = items
      .filter((e) => e.paidBy === 'Divya')
      .reduce((s, e) => s + Number(e.paid || 0), 0);
    const sharedPaid = items
      .filter((e) => (e.paidBy || 'Shared') === 'Shared')
      .reduce((s, e) => s + Number(e.paid || 0), 0);
    const balance = Math.max(0, actual - paid);
    const share = totalActual > 0 ? actual / totalActual : 0;
    totalCaps += cap;
    totalHarshaPaid += harshaPaid;
    totalDivyaPaid += divyaPaid;
    totalSharedPaid += sharedPaid;

    const row = catSheet.addRow({
      name: cat.name,
      count: items.length,
      cap,
      actual,
      paid,
      harshaPaid,
      divyaPaid,
      sharedPaid,
      balance,
      share,
      notes: cat.notes || '',
    });
    ['C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
      row.getCell(col).numFmt = INR_FORMAT;
    });
    row.getCell('J').numFmt = '0.0%';
    if (idx % 2 === 1) {
      row.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F3FE' } };
      });
    }
    row.height = 20;
  });

  const catTotalRow = catSheet.addRow({
    name: 'TOTAL',
    count: expenses.length,
    cap: totalCaps,
    actual: totalActual,
    paid: totalPaid,
    harshaPaid: totalHarshaPaid,
    divyaPaid: totalDivyaPaid,
    sharedPaid: totalSharedPaid,
    balance: totalBalance,
    share: totalActual > 0 ? 1 : 0,
    notes: '',
  });
  catTotalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF270E5C' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE7FC' } };
  });
  ['C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
    catTotalRow.getCell(col).numFmt = INR_FORMAT;
  });
  catTotalRow.getCell('J').numFmt = '0.0%';
  catTotalRow.height = 22;

  // --- Sheet 3: Detailed Expenses ---
  const expSheet = workbook.addWorksheet('All Expenses', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  expSheet.columns = [
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Expense / Item', key: 'title', width: 34 },
    { header: 'Vendor', key: 'vendor', width: 24 },
    { header: 'Total Cost (INR)', key: 'actual', width: 18 },
    { header: 'Paid (INR)', key: 'paid', width: 16 },
    { header: 'Balance Due (INR)', key: 'balance', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Paid By', key: 'paidBy', width: 12 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
    { header: 'Comments / Notes', key: 'notes', width: 36 },
  ];

  expSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B1786' } };
    cell.alignment = { vertical: 'middle' };
  });
  expSheet.getRow(1).height = 24;

  expenses.forEach((exp, idx) => {
    const cat = categoryMap.get(exp.categoryId);
    const actual = Number(exp.actual || 0);
    const paid = Number(exp.paid || 0);
    const row = expSheet.addRow({
      category: cat ? cat.name : exp.categoryId,
      title: exp.title,
      vendor: exp.vendor || '',
      actual,
      paid,
      balance: Math.max(0, actual - paid),
      status: exp.status || 'Pending',
      paidBy: exp.paidBy || 'Shared',
      dueDate: exp.dueDate || '',
      notes: exp.notes || '',
    });
    ['D', 'E', 'F'].forEach((col) => {
      row.getCell(col).numFmt = INR_FORMAT;
    });
    if (idx % 2 === 1) {
      row.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F3FE' } };
      });
    }
    row.height = 20;
  });

  const expTotalRow = expSheet.addRow({
    category: 'TOTAL',
    title: `${expenses.length} ${expenses.length === 1 ? 'item' : 'items'}`,
    vendor: '',
    actual: totalActual,
    paid: totalPaid,
    balance: totalBalance,
    status: '',
    paidBy: '',
    dueDate: '',
    notes: '',
  });
  expTotalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF270E5C' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE7FC' } };
  });
  ['D', 'E', 'F'].forEach((col) => {
    expTotalRow.getCell(col).numFmt = INR_FORMAT;
  });
  expTotalRow.height = 22;

  return workbook;
}

module.exports = { buildWeddingWorkbook };
