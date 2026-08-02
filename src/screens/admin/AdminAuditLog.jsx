import { useEffect, useMemo, useState } from 'react';
import Chip from '../../components/Chip';
import Spinner from '../../components/Spinner';
import { getAuditLog, toAuditLogView } from '../../lib/api';
import {
  selectStyle,
  inputStyle,
  secondaryBtnStyle,
  cardStyle,
  sectionHeaderStyle,
  toolbarStyle,
  errorBannerStyle,
  thStyle,
  tdStyle,
  Modal,
  ModalField,
  Pagination,
  ExportMenu,
} from './shared';

export default function AdminAuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [viewingEntry, setViewingEntry] = useState(null);

  useEffect(() => {
    getAuditLog()
      .then((dtos) => setEntries(dtos.map((d) => ({ ...toAuditLogView(d), created: d.created }))))
      .catch((err) => setError(err.message || 'Failed to load audit log.'))
      .finally(() => setLoading(false));
  }, []);

  // Built from whatever actions actually appear in the loaded entries, rather
  // than a hardcoded list — several of the prototype's actions (Disable User,
  // Reset Password) don't exist in real data yet since those endpoints haven't
  // shipped (Phase 2), so a fixed list would offer choices that never match anything.
  const actionOptions = useMemo(() => Array.from(new Set(entries.map((e) => e.action))).sort(), [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    return entries.filter((e) => {
      if (q && !e.who.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q)) return false;
      if (actionFilter && e.action !== actionFilter) return false;
      const ts = new Date(e.created);
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }, [entries, search, actionFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportRows = filtered.map((e) => ({ Actor: e.who, Action: e.action, Timestamp: e.time }));

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Audit Log</div>
          <div style={{ fontSize: 12.5, color: '#9AA0A6', marginTop: 2 }}>Every account and permission change, in order.</div>
        </div>
        <ExportMenu rows={exportRows} sheetName="Audit Log" fileBaseName="audit-log" title="Audit Log" />
      </div>

      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={toolbarStyle}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actor or action"
            style={{ ...inputStyle, minWidth: 200 }}
          />
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All actions</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} style={inputStyle} />
          <span style={{ fontSize: 12.5, color: '#9AA0A6' }}>to</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} style={inputStyle} />
        </div>

        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6', padding: '8px 0' }}><Spinner size={14} />Loading…</div>}
        {error && <div style={errorBannerStyle}>{error}</div>}

        {!loading && !error && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Actor</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Timestamp</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '26px 0', textAlign: 'center', color: '#9AA0A6', fontSize: 13 }}>No matching entries.</td>
                    </tr>
                  )}
                  {pageItems.map((e) => (
                    <tr key={e.entityId}>
                      <td style={tdStyle}>{e.who}</td>
                      <td style={tdStyle}><Chip label={e.action} tone="slate" /></td>
                      <td style={{ ...tdStyle, color: '#6A7178' }}>{e.time}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button type="button" onClick={() => setViewingEntry(e)} style={secondaryBtnStyle}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
              pageSizeOptions={[8, 20, 50]}
            />
          </>
        )}
      </div>

      {viewingEntry && (
        <Modal title="Audit entry" onClose={() => setViewingEntry(null)} footer={<button type="button" onClick={() => setViewingEntry(null)} style={secondaryBtnStyle}>Close</button>}>
          <ModalField label="Actor">{viewingEntry.who}</ModalField>
          <ModalField label="Action"><Chip label={viewingEntry.action} tone="slate" /></ModalField>
          <ModalField label="Timestamp">{viewingEntry.time}</ModalField>
          <ModalField label="Entry ID"><span style={{ color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace' }}>{viewingEntry.entityId}</span></ModalField>
        </Modal>
      )}
    </div>
  );
}
