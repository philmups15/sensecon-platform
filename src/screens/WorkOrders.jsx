import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getWorkOrders, toWorkOrderView, canAccess } from '../lib/api';
import { woColumnsList, woChecklist, woParts, woDeviations } from '../lib/mockData';

export default function WorkOrders({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'workOrders', 'write');

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getWorkOrders()
      .then((dtos) => {
        const views = dtos.map(toWorkOrderView);
        setWorkOrders(views);
        if (views.length > 0) setSelectedId(views[0].id);
      })
      .catch((err) => setError(err.message || 'Failed to load work orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading work orders…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;
  if (workOrders.length === 0) return <div style={{ padding: 20, color: '#52685F' }}>No work orders yet.</div>;

  const detail = workOrders.find((w) => w.id === selectedId) || workOrders[0];

  const columns = woColumnsList.map((label) => ({
    label,
    cards: workOrders.filter((w) => w.col === label),
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {columns.map((col) => (
          <div key={col.label}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#52685F', marginBottom: 8 }}>{col.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.cards.map((c) => (
                <div
                  key={c.entityId}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D7E4E1',
                    borderLeft: `3px solid ${c.tone === 'violet' ? '#2E9E8F' : '#1F6E72'}`,
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: '0 1px 2px rgba(18,32,31,0.05)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{c.id}</span>
                    <Chip label={c.type} tone={c.tone} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#12201F', marginTop: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#52685F', marginTop: 4 }}>{c.plant}</div>
                  <div style={{ fontSize: 11, color: '#78908A', marginTop: 6 }}>{c.assignee}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {detail.title} <span style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{detail.id}</span>
        </div>
        <div style={{ fontSize: 12, color: '#52685F', marginTop: 4 }}>{detail.plant} · {detail.assignee}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Checklist</div>
            {woChecklist.map((ck, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid #1F6E72', background: ck.boxColor }} />
                {ck.item}
              </div>
            ))}
            <div style={{ fontSize: 12.5, fontWeight: 700, margin: '14px 0 6px' }}>Parts consumed</div>
            {woParts.map((pt, i) => (
              <div key={i} style={{ fontSize: 13, color: '#52685F' }}>{pt.qty}× {pt.part}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Deviations</div>
            {woDeviations.map((dv, i) => (
              <div key={i} style={{ padding: '9px 12px', background: '#FBF0DC', borderRadius: 8, fontSize: 12.5, color: '#8A5A16' }}>{dv.note}</div>
            ))}
            {canWrite && (
              <button style={{ marginTop: 16, padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                Sign off & close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
