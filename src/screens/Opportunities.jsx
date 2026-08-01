import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getOpportunities, updateOpportunity, toOpportunityView, OPPORTUNITY_STAGE_META } from '../lib/api';

const OPP_STAGE_ENTRIES = Object.entries(OPPORTUNITY_STAGE_META);

function buildStagePayload(o, stageKey) {
  return {
    code: o.id,
    customer: o.customer,
    capacity: o.capacity,
    stage: stageKey,
    location: o.location,
    nextAction: o.next,
    owner: o.owner,
    value: o.rawValue,
  };
}

const stageStepStyle = {
  padding: '3px 6px',
  border: 'none',
  background: 'transparent',
  color: '#2563EB',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
};

const selectStyle = {
  padding: '5px 8px',
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  color: '#334155',
  background: '#FFFFFF',
  cursor: 'pointer',
};

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [moveError, setMoveError] = useState('');
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    getOpportunities()
      .then((dtos) => setOpportunities(dtos.map(toOpportunityView)))
      .catch((err) => setError(err.message || 'Failed to load opportunities.'))
      .finally(() => setLoading(false));
  }, []);

  const changeStage = async (o, stageKey) => {
    if (!o || stageKey === o.stageKey) return;
    const meta = OPPORTUNITY_STAGE_META[stageKey];
    if (!meta) return;

    const previous = opportunities;
    setMovingId(o.entityId);
    setMoveError('');
    setOpportunities((prev) =>
      prev.map((item) =>
        item.entityId === o.entityId
          ? { ...item, stageKey, stage: meta.label, tone: meta.tone }
          : item
      )
    );

    try {
      await updateOpportunity(o.entityId, buildStagePayload(o, stageKey));
    } catch (err) {
      setOpportunities(previous);
      setMoveError(err.message || 'Failed to move opportunity to the new stage.');
    } finally {
      setMovingId(null);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading opportunities…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;

  const selected = opportunities.find((o) => o.entityId === selectedId);
  const byStage = OPP_STAGE_ENTRIES.map(([key, meta], stageIndex) => ({
    key,
    stageIndex,
    stage: meta.label,
    tone: meta.tone,
    cards: opportunities.filter((o) => o.stageKey === key),
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
        {view === 'kanban' && <span style={{ fontSize: 11.5, color: '#9AA0A6' }}>Drag a card to another column to move it through the pipeline.</span>}
      </div>

      {moveError && <div style={{ padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{moveError}</div>}

      {opportunities.length === 0 && <div style={{ padding: 20, color: '#6A7178' }}>No opportunities yet.</div>}

      {opportunities.length > 0 && view === 'list' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1.1fr 1.3fr 1fr 0.9fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
            <div>Customer</div><div>Capacity</div><div>Stage</div><div>Next action</div><div>Owner</div><div>Value</div>
          </div>
          {opportunities.map((o) => (
            <div
              key={o.entityId}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1.1fr 1.3fr 1fr 0.9fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', alignItems: 'center' }}
            >
              <div onClick={() => setSelectedId(o.entityId)} style={{ fontWeight: 600, color: '#141719', cursor: 'pointer' }}>
                {o.customer}
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 500 }}>{o.location}</div>
              </div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.capacity}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={o.stageKey}
                  disabled={movingId === o.entityId}
                  onChange={(e) => changeStage(o, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ ...selectStyle, opacity: movingId === o.entityId ? 0.6 : 1 }}
                >
                  {OPP_STAGE_ENTRIES.map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                {movingId === o.entityId && <Spinner size={12} />}
              </div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.next}</div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.owner}</div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#141719', fontWeight: 600, cursor: 'pointer' }}>{o.value}</div>
            </div>
          ))}
        </div>
      )}

      {opportunities.length > 0 && view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {byStage.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const dragged = opportunities.find((o) => o.entityId === draggedId);
                if (dragged) changeStage(dragged, col.key);
                setDragId(null);
              }}
              style={{ borderRadius: 10, padding: 4, background: dragId ? '#F5F7FA' : 'transparent' }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{col.stage}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                {col.cards.map((c) => (
                  <div
                    key={c.entityId}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', c.entityId);
                      setDragId(c.entityId);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelectedId(c.entityId)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4E8EB',
                      borderRadius: 10,
                      padding: 12,
                      boxShadow: '0 1px 2px rgba(20,23,25,0.05)',
                      cursor: 'grab',
                      opacity: movingId === c.entityId || dragId === c.entityId ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#141719' }}>{c.customer}</div>
                    <div style={{ fontSize: 11, color: '#6A7178', marginTop: 3 }}>{c.capacity} · {c.location}</div>
                    <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 6 }}>{c.next}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <button
                        type="button"
                        disabled={col.stageIndex === 0 || movingId === c.entityId}
                        onClick={(e) => { e.stopPropagation(); changeStage(c, OPP_STAGE_ENTRIES[col.stageIndex - 1][0]); }}
                        style={{ ...stageStepStyle, visibility: col.stageIndex === 0 ? 'hidden' : 'visible' }}
                      >
                        ‹ Back
                      </button>
                      {movingId === c.entityId && <Spinner size={12} />}
                      <button
                        type="button"
                        disabled={col.stageIndex === OPP_STAGE_ENTRIES.length - 1 || movingId === c.entityId}
                        onClick={(e) => { e.stopPropagation(); changeStage(c, OPP_STAGE_ENTRIES[col.stageIndex + 1][0]); }}
                        style={{ ...stageStepStyle, visibility: col.stageIndex === OPP_STAGE_ENTRIES.length - 1 ? 'hidden' : 'visible' }}
                      >
                        Next ›
                      </button>
                    </div>
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
            <div>
              <span style={{ color: '#6A7178' }}>Stage</span>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={selected.stageKey}
                  disabled={movingId === selected.entityId}
                  onChange={(e) => changeStage(selected, e.target.value)}
                  style={{ ...selectStyle, opacity: movingId === selected.entityId ? 0.6 : 1 }}
                >
                  {OPP_STAGE_ENTRIES.map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                {movingId === selected.entityId ? <Spinner size={12} /> : <Chip label={selected.stage} tone={selected.tone} />}
              </div>
            </div>
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
