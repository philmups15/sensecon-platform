import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getOpportunities, toOpportunityView, OPPORTUNITY_STAGE_META } from '../lib/api';

const OPP_STAGES = Object.values(OPPORTUNITY_STAGE_META);

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getOpportunities()
      .then((dtos) => setOpportunities(dtos.map(toOpportunityView)))
      .catch((err) => setError(err.message || 'Failed to load opportunities.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading opportunities…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;

  const selected = opportunities.find((o) => o.entityId === selectedId);
  const byStage = OPP_STAGES.map(({ label: stage, tone }) => ({
    stage,
    tone,
    cards: opportunities.filter((o) => o.stage === stage),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setView('list')}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D2D8DC', background: view === 'list' ? '#EAF0FE' : '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          List
        </button>
        <button
          onClick={() => setView('kanban')}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D2D8DC', background: view === 'kanban' ? '#EAF0FE' : '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Kanban
        </button>
      </div>

      {opportunities.length === 0 && <div style={{ padding: 20, color: '#6A7178' }}>No opportunities yet.</div>}

      {opportunities.length > 0 && view === 'list' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1fr 1.3fr 1fr 0.9fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
            <div>Customer</div><div>Capacity</div><div>Stage</div><div>Next action</div><div>Owner</div><div>Value</div>
          </div>
          {opportunities.map((o) => (
            <div
              key={o.entityId}
              onClick={() => setSelectedId(o.entityId)}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1fr 1.3fr 1fr 0.9fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', cursor: 'pointer', alignItems: 'center' }}
            >
              <div style={{ fontWeight: 600, color: '#141719' }}>
                {o.customer}
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 500 }}>{o.location}</div>
              </div>
              <div style={{ color: '#334155' }}>{o.capacity}</div>
              <div><Chip label={o.stage} tone={o.tone} /></div>
              <div style={{ color: '#334155' }}>{o.next}</div>
              <div style={{ color: '#334155' }}>{o.owner}</div>
              <div style={{ color: '#141719', fontWeight: 600 }}>{o.value}</div>
            </div>
          ))}
        </div>
      )}

      {opportunities.length > 0 && view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {byStage.map((col) => (
            <div key={col.stage}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{col.stage}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.cards.map((c) => (
                  <div
                    key={c.entityId}
                    onClick={() => setSelectedId(c.entityId)}
                    style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 10, padding: 12, boxShadow: '0 1px 2px rgba(20,23,25,0.05)', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#141719' }}>{c.customer}</div>
                    <div style={{ fontSize: 11, color: '#6A7178', marginTop: 3 }}>{c.capacity} · {c.location}</div>
                    <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 6 }}>{c.next}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: '#FFFFFF', borderLeft: '1px solid #E4E8EB', boxShadow: '-8px 0 24px rgba(20,23,25,0.12)', zIndex: 30, padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.customer}</div>
            <span onClick={() => setSelectedId(null)} style={{ cursor: 'pointer', color: '#9AA0A6', fontSize: 18 }}>×</span>
          </div>
          <div style={{ fontSize: 12, color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace', marginTop: 2 }}>{selected.id}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div><span style={{ color: '#6A7178' }}>Capacity</span><div style={{ fontWeight: 600 }}>{selected.capacity}</div></div>
            <div><span style={{ color: '#6A7178' }}>Location</span><div style={{ fontWeight: 600 }}>{selected.location}</div></div>
            <div><span style={{ color: '#6A7178' }}>Indicative value</span><div style={{ fontWeight: 600 }}>{selected.value}</div></div>
            <div><span style={{ color: '#6A7178' }}>Next action</span><div style={{ fontWeight: 600 }}>{selected.next}</div></div>
            <div><span style={{ color: '#6A7178' }}>Owner</span><div style={{ fontWeight: 600 }}>{selected.owner}</div></div>
          </div>
          <button style={{ width: '100%', marginTop: 20, padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Convert to project
          </button>
        </div>
      )}
    </div>
  );
}
