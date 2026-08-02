import { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { getReports, createReport, toReportView, canAccess } from '../lib/api';
import { reportCatalogue } from '../lib/mockData';

export default function Reports({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'reports', 'write');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState('');

  const load = () => getReports().then((dtos) => setReports(dtos.map(toReportView)));

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const generate = async (name) => {
    setGenerating(name);
    try {
      await createReport({ name, generatedBy: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setGenerating('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {reportCatalogue.map((r, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6A7178' }}>{r.desc}</div>
            {canWrite && (
              <button
                onClick={() => generate(r.name)}
                disabled={generating === r.name}
                style={{ alignSelf: 'flex-start', marginTop: 6, padding: '7px 14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: generating === r.name ? 'default' : 'pointer', opacity: generating === r.name ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {generating === r.name && <Spinner size={12} color="#fff" />}
                {generating === r.name ? 'Generating…' : 'Generate'}
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Recently generated</div>
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, fontSize: 13, color: '#9AA0A6' }}><Spinner size={14} />Loading…</div>}
        {error && <div style={{ padding: 16, fontSize: 13, color: '#B42318' }}>{error}</div>}
        {!loading && !error && reports.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: '#9AA0A6' }}>No reports generated yet.</div>
        )}
        {reports.map((r) => (
          <div key={r.entityId} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>{r.name}</div>
            <div style={{ color: '#9AA0A6' }}>{r.by} · {r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
