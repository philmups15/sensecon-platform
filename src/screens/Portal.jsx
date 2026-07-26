import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import { portalPlants, portalHistory } from '../lib/mockData';

export default function Portal() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
        {portalPlants.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#6A7178' }}>{p.capacity} · PR {p.pr}</div>
            </div>
            <Chip label={p.health} tone={p.healthTone} />
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Work order history</div>
        {portalHistory.map((w, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>{w.title} <span style={{ color: '#9AA0A6', fontSize: 11 }}>{w.date}</span></div>
            <Chip label={w.status} tone={w.tone} />
          </div>
        ))}
      </div>
      <HandoverBundle />
    </div>
  );
}
