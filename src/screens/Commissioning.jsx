import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import Spinner from '../components/Spinner';
import { getNonConformities, toNonConformityView } from '../lib/api';
import { commTypes, dcTests, acTests, monTests, safetyTests } from '../lib/mockData';

function TestGroup({ title, tests }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {tests.map((t, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
          {t.test}
          <Chip label={t.result} tone={t.tone} />
        </div>
      ))}
    </div>
  );
}

export default function Commissioning() {
  const [type, setType] = useState('rooftop');
  const [nonConformities, setNonConformities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getNonConformities()
      .then((dtos) => setNonConformities(dtos.map(toNonConformityView)))
      .catch((err) => setError(err.message || 'Failed to load non-conformities.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #D7E4E1' }}>
        {commTypes.map(([key, label]) => {
          const active = type === key;
          const color = active ? '#12484B' : '#78908A';
          return (
            <div key={key} onClick={() => setType(key)} style={{ padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
              {label}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TestGroup title="DC side tests" tests={dcTests} />
        <TestGroup title="AC side tests" tests={acTests} />
        <TestGroup title="Monitoring functional" tests={monTests} />
        <TestGroup title="Safety" tests={safetyTests} />
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Non-conformity tracker</div>
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A' }}><Spinner size={14} />Loading…</div>}
        {error && <div style={{ fontSize: 13, color: '#A6362E' }}>{error}</div>}
        {!loading && !error && nonConformities.length === 0 && (
          <div style={{ fontSize: 13, color: '#78908A' }}>No non-conformities logged.</div>
        )}
        {nonConformities.map((nc) => (
          <div key={nc.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>
              <span style={{ fontFamily: 'SF Mono, Consolas, monospace', color: '#78908A', fontSize: 11 }}>{nc.id}</span> {nc.desc} <span style={{ color: '#78908A' }}>— {nc.plant}</span>
            </div>
            <Chip label={nc.status} tone={nc.tone} />
          </div>
        ))}
      </div>
      <HandoverBundle />
    </div>
  );
}
