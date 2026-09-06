import * as XLSX from 'xlsx';

// Download an array of plain objects as a single-sheet .xlsx.
export function exportRowsToExcel(rows, filename = 'export', sheet = 'Sheet1') {
  const data = rows && rows.length ? rows : [{}];
  const ws = XLSX.utils.json_to_sheet(data);
  // Auto-ish column widths from the header + first rows.
  const keys = Object.keys(data[0] || {});
  ws['!cols'] = keys.map((k) => {
    const max = Math.max(k.length, ...data.slice(0, 200).map((r) => String(r[k] ?? '').length));
    return { wch: Math.min(60, Math.max(10, max + 2)) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

const btnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', border: '1px solid #D7E4E1', borderRadius: 8,
  background: '#FFFFFF', color: '#52685F', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};

// `rows` may be an array or a function returning one (evaluated on click, so
// exports always reflect the current view).
export default function ExportButton({ rows, filename = 'export', sheet = 'Sheet1', label = 'Export to Excel' }) {
  const resolve = () => (typeof rows === 'function' ? rows() : rows) || [];
  const count = Array.isArray(rows) ? rows.length : undefined;
  const disabled = count === 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { const r = resolve(); if (r.length) exportRowsToExcel(r, filename, sheet); }}
      style={{ ...btnStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}
      title={disabled ? 'Nothing to export' : `Export ${count ?? ''} rows to Excel`.trim()}
    >
      <span aria-hidden>⤓</span> {label}
    </button>
  );
}
