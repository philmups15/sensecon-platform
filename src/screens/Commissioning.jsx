import { useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import { commTypes, dcTests, acTests, monTests, safetyTests, nonConformities } from '../lib/mockData';

function TestGroup({ title, tests }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {tests.map((t, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
          {t.test}
          <Chip label={t.result} tone={t.tone} />
        </div>
      ))}
    </div>
  );
}

export default function Commissioning() {
  const [type, setType] = useState('rooftop');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E4E8EB' }}>
        {commTypes.map(([key, label]) => {
          const active = type === key;
          const color = active ? '#1E4FC4' : '#9AA0A6';
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
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Non-conformity tracker</div>
        {nonConformities.map((nc, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>
              <span style={{ fontFamily: 'SF Mono, Consolas, monospace', color: '#9AA0A6', fontSize: 11 }}>{nc.id}</span> {nc.desc} <span style={{ color: '#9AA0A6' }}>— {nc.plant}</span>
            </div>
            <Chip label={nc.status} tone={nc.tone} />
          </div>
        ))}
      </div>
      <HandoverBundle />
    </div>
  );
}
