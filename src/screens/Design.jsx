import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getDesigns, toDesignView } from '../lib/api';
import { designTabs, designFieldsByTab, revisions, attachments } from '../lib/mockData';

export default function Design() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('array');

  useEffect(() => {
    getDesigns()
      .then((dtos) => {
        const views = dtos.map(toDesignView);
        setDesigns(views);
        if (views.length > 0) setSelectedId(views[0].entityId);
      })
      .catch((err) => setError(err.message || 'Failed to load designs.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading designs…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;
  if (designs.length === 0) return <div style={{ padding: 20, color: '#52685F' }}>No designs yet.</div>;

  const detail = designs.find((d) => d.entityId === selectedId) || designs[0];
  const fields = designFieldsByTab[tab] || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 240px', gap: 16, alignItems: 'start' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        {designs.map((d) => (
          <div key={d.entityId} onClick={() => setSelectedId(d.entityId)} style={{ padding: '13px 16px', borderBottom: '1px solid #E9F1EF', cursor: 'pointer' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.project}</div>
            <div style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 7px' }}>
              {d.id} · Rev {d.rev}
            </div>
            <Chip label={d.status} tone={d.tone} />
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.project}</div>
        {detail.survey !== '—' && (
          <div style={{ marginTop: 8, padding: '9px 12px', background: '#E4F0EF', borderRadius: 8, fontSize: 12, color: '#12484B' }}>
            Linked to survey <b>{detail.survey}</b> — findings drive these values
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: '1px solid #D7E4E1' }}>
          {designTabs.map(([key, label]) => {
            const active = tab === key;
            const color = active ? '#12484B' : '#78908A';
            return (
              <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                {label}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map(([f, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
              <span style={{ color: '#52685F' }}>{f}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Attachments</div>
          {attachments.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, color: '#52685F' }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: '#F4F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: '#52685F' }}>
                {a.ext}
              </span>
              {a.name}
            </div>
          ))}
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Revision history</div>
          {revisions.map((r, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E9F1EF' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                Rev {r.rev} <span style={{ fontWeight: 500, color: '#78908A' }}>· {r.date}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#52685F', marginTop: 2 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
