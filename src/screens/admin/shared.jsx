import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const selectStyle = {
  padding: '5px 8px',
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
  background: '#FFFFFF',
  cursor: 'pointer',
};

export const inputStyle = {
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 12.5,
  fontFamily: 'inherit',
};

export const primaryBtnStyle = {
  padding: '7px 14px',
  background: '#2563EB',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
};

export const secondaryBtnStyle = {
  padding: '7px 14px',
  background: '#FFFFFF',
  color: '#334155',
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
};

export const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563EB',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
};

export const dangerBtnStyle = { ...linkBtnStyle, color: '#B42318' };

export const cardStyle = { background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12 };

export const sectionHeaderStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' };

export const toolbarStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 };

export const bannerStyle = { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#EAF0FE', border: '1px solid #D3E3FF', color: '#1D3F8F', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 16 };

export const errorBannerStyle = { padding: '9px 11px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 };

export const thStyle = { textAlign: 'left', color: '#9AA0A6', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4, padding: '10px 12px', borderBottom: '1px solid #E4E8EB' };

export const tdStyle = { padding: '12px', borderBottom: '1px solid #F0F2F4', verticalAlign: 'middle', fontSize: 13 };

/* ---------- Modal ---------- */

export function Modal({ title, onClose, children, footer, width = 460 }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,23,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#FFFFFF', borderRadius: 12, width, maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E4E8EB' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#9AA0A6' }}>✕</button>
        </div>
        <div style={{ padding: '16px 18px' }}>{children}</div>
        {footer && <div style={{ padding: '12px 18px', borderTop: '1px solid #E4E8EB', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function ModalField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{children}</div>
    </div>
  );
}

/* ---------- Kebab menu ---------- */

export function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D2D8DC', background: '#FFFFFF', cursor: 'pointer', fontSize: 15, color: '#6A7178', lineHeight: 1 }}
      >
        ⋮
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 32, background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, zIndex: 50, overflow: 'hidden' }}>
          {items.map((it, i) =>
            it.divider ? (
              <div key={i} style={{ borderTop: '1px solid #E4E8EB', margin: '4px 0' }} />
            ) : (
              <button
                key={i}
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  fontSize: 12.5,
                  cursor: it.disabled ? 'default' : 'pointer',
                  color: it.disabled ? '#C3C8CD' : it.danger ? '#B42318' : '#141719',
                }}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Pagination ---------- */

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [6, 10, 25] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const pageBtnStyle = { width: 28, height: 28, border: '1px solid #D2D8DC', background: '#FFFFFF', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 2px', fontSize: 12.5, color: '#9AA0A6', flexWrap: 'wrap', gap: 10 }}>
      <div>Showing {start}-{end} of {total}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" disabled={current === 1} onClick={() => onPageChange(current - 1)} style={{ ...pageBtnStyle, opacity: current === 1 ? 0.4 : 1, cursor: current === 1 ? 'not-allowed' : 'pointer' }}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={p === current ? { ...pageBtnStyle, background: '#141719', color: '#fff', borderColor: '#141719' } : pageBtnStyle}
          >
            {p}
          </button>
        ))}
        <button type="button" disabled={current === totalPages} onClick={() => onPageChange(current + 1)} style={{ ...pageBtnStyle, opacity: current === totalPages ? 0.4 : 1, cursor: current === totalPages ? 'not-allowed' : 'pointer' }}>›</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Rows per page
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} style={selectStyle}>
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ---------- Tab strip (used for the top-level Admin tabs and the Integrations sub-tabs) ---------- */

export function TabStrip({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E4E8EB' }}>
      {tabs.map(([key, label]) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: isActive ? '#141719' : '#9AA0A6',
              borderBottom: `2px solid ${isActive ? '#2563EB' : 'transparent'}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Export helpers ---------- */

export function exportToExcel(rows, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export function exportToPdf(title, rows, fileName) {
  const doc = new jsPDF();
  doc.text(title, 14, 14);
  const head = rows.length ? [Object.keys(rows[0])] : [[]];
  const body = rows.map((r) => Object.values(r));
  autoTable(doc, { startY: 20, head, body, styles: { fontSize: 9 } });
  doc.save(fileName);
}

export function ExportMenu({ rows, sheetName, fileBaseName, title }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { label: '📊 Export to Excel', onClick: () => exportToExcel(rows, sheetName, `${fileBaseName}.xlsx`) },
    { label: '📄 Export to PDF', onClick: () => exportToPdf(title, rows, `${fileBaseName}.pdf`) },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={secondaryBtnStyle}>Export ▾</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 34, background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, zIndex: 50, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12.5, cursor: 'pointer', color: '#141719' }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
