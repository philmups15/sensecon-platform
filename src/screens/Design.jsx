import { useState } from 'react';
import Chip from '../components/Chip';
import { designs, designTabs, designFieldsByTab, revisions, attachments } from '../lib/mockData';

export default function Design() {
  const [selectedId, setSelectedId] = useState('DSN-0091');
  const [tab, setTab] = useState('array');
  const detail = designs.find((d) => d.id === selectedId);
  const fields = designFieldsByTab[tab] || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 240px', gap: 16, alignItems: 'start' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        {designs.map((d) => (
          <div key={d.id} onClick={() => setSelectedId(d.id)} style={{ padding: '13px 16px', borderBottom: '1px solid #F0F2F4', cursor: 'pointer' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.project}</div>
            <div style={{ fontSize: 11, color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 7px' }}>
              {d.id} · Rev {d.rev}
            </div>
            <Chip label={d.status} tone={d.tone} />
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.project}</div>
        <div style={{ marginTop: 8, padding: '9px 12px', background: '#EAF0FE', borderRadius: 8, fontSize: 12, color: '#1E4FC4' }}>
          Linked to survey <b>{detail.survey}</b> — findings drive these values
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: '1px solid #E4E8EB' }}>
          {designTabs.map(([key, label]) => {
            const active = tab === key;
            const color = active ? '#1E4FC4' : '#9AA0A6';
            return (
              <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                {label}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map(([f, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
              <span style={{ color: '#6A7178' }}>{f}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Attachments</div>
          {attachments.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, color: '#334155' }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: '#6A7178' }}>
                {a.ext}
              </span>
              {a.name}
            </div>
          ))}
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Revision history</div>
          {revisions.map((r, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F0F2F4' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                Rev {r.rev} <span style={{ fontWeight: 500, color: '#9AA0A6' }}>· {r.date}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#6A7178', marginTop: 2 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
