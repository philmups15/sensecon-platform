import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import LifecycleTimeline from '../components/LifecycleTimeline';
import Spinner from '../components/Spinner';
import { getPlants, getWorkOrders, toPlantView, toWorkOrderView } from '../lib/api';
import { plantActivity } from '../lib/mockData';

export default function Plants() {
  const [plants, setPlants] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('overview');
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    Promise.all([getPlants(), getWorkOrders()])
      .then(([plantDtos, workOrderDtos]) => {
        const plantViews = plantDtos.map(toPlantView);
        setPlants(plantViews);
        setWorkOrders(workOrderDtos.map(toWorkOrderView));
        if (plantViews.length > 0) setSelectedId(plantViews[0].id);
      })
      .catch((err) => setError(err.message || 'Failed to load plants.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading plants…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;
  if (plants.length === 0) return <div style={{ padding: 20, color: '#52685F' }}>No plants yet.</div>;

  const detail = plants.find((p) => p.id === selectedId) || plants[0];
  const openWork = workOrders.filter((w) => w.plantId === detail.id && w.col !== 'Done');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.4fr 0.9fr 0.9fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
          <div>Plant</div><div>Stage</div><div>Capacity</div><div>Equipment</div><div>PR</div><div>Health</div>
        </div>
        {plants.map((p) => {
          const prPct = p.pr ? Math.round(p.pr * 100) + '%' : '—';
          return (
            <div
              key={p.id}
              onClick={() => { setSelectedId(p.id); setTab('overview'); }}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.4fr 0.9fr 0.9fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', cursor: 'pointer', alignItems: 'center' }}
            >
              <div style={{ fontWeight: 600, color: '#12201F' }}>{p.name}</div>
              <div><Chip label={p.stageLabel} tone={p.tone} /></div>
              <div>{p.capacity}</div>
              <div style={{ color: '#52685F', fontSize: 12 }}>{p.equip}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 36, height: 6, background: '#E9F1EF', borderRadius: 999 }}>
                  <div style={{ height: 6, width: prPct === '—' ? '0%' : prPct, background: '#1F6E72', borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11.5, color: '#52685F' }}>{prPct}</span>
              </div>
              <div><Chip label={p.health} tone={p.healthTone} /></div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.name}</div>
          <Chip label={detail.health} tone={detail.healthTone} />
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <LifecycleTimeline stage={detail.stage} variant="full" />
        </div>

        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #D7E4E1', marginBottom: 16 }}>
          {[['overview', 'Overview'], ['handover', 'Handover bundle'], ['work', 'Open work'], ['activity', 'Activity']].map(([key, label]) => {
            const active = tab === key;
            const color = active ? '#12484B' : '#78908A';
            return (
              <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                {label}
              </div>
            );
          })}
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 13 }}>
              <div><span style={{ color: '#52685F' }}>Capacity</span><div style={{ fontWeight: 600 }}>{detail.capacity}</div></div>
              <div><span style={{ color: '#52685F' }}>Equipment</span><div style={{ fontWeight: 600 }}>{detail.equip}</div></div>
            </div>
            <div
              onClick={() => setHistoryOpen((v) => !v)}
              style={{ marginTop: 20, padding: 12, border: '1px solid #D7E4E1', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#52685F' }}>Historical records — survey, design & deployment</span>
              <span style={{ color: '#78908A' }}>{historyOpen ? '▾' : '▸'}</span>
            </div>
            {historyOpen && (
              <div style={{ padding: 14, border: '1px solid #D7E4E1', borderTop: 'none', borderRadius: '0 0 10px 10px', marginTop: -1, fontSize: 12.5, color: '#52685F', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>No historical records captured for this plant yet.</div>
              </div>
            )}
          </>
        )}

        {tab === 'handover' && <HandoverBundle />}

        {tab === 'work' && (openWork.length > 0 ? openWork.map((w) => (
          <div key={w.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>{w.title} <span style={{ color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', fontSize: 11 }}>{w.id}</span></div>
            <Chip label={w.priority} tone={w.priorityTone} />
          </div>
        )) : <div style={{ padding: '10px 0', fontSize: 13, color: '#78908A' }}>No open work orders.</div>)}

        {tab === 'activity' && plantActivity.map((a, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>{a.text}</div>
            <div style={{ fontSize: 11, color: '#78908A', marginTop: 2 }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
