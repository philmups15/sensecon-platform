import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import Spinner from '../components/Spinner';
import { getPlants, getWorkOrders, toPlantView, toWorkOrderView } from '../lib/api';

export default function Portal() {
  const [plants, setPlants] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlants(), getWorkOrders()])
      .then(([plantDtos, workOrderDtos]) => {
        setPlants(plantDtos.map(toPlantView));
        setHistory(workOrderDtos.map(toWorkOrderView).filter((w) => w.col === 'Done'));
      })
      .catch((err) => setError(err.message || 'Failed to load portal data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 18 }}>
        {plants.length === 0 && <div style={{ fontSize: 13, color: '#78908A' }}>No plants yet.</div>}
        {plants.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#52685F' }}>{p.capacity} · PR {p.pr ? Math.round(p.pr * 100) + '%' : '—'}</div>
            </div>
            <Chip label={p.health} tone={p.healthTone} />
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #D7E4E1' }}>Work order history</div>
        {history.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#78908A' }}>No closed work orders yet.</div>}
        {history.map((w) => (
          <div key={w.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>{w.title} <span style={{ color: '#78908A', fontSize: 11 }}>{w.id}</span></div>
            <Chip label={w.col} tone="green" />
          </div>
        ))}
      </div>
      <HandoverBundle />
    </div>
  );
}
