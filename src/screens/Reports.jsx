import { reportCatalogue, recentReports } from '../lib/mockData';

export default function Reports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {reportCatalogue.map((r, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6A7178' }}>{r.desc}</div>
            <button style={{ alignSelf: 'flex-start', marginTop: 6, padding: '7px 14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              Generate
            </button>
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Recently generated</div>
        {recentReports.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>{r.name}</div>
            <div style={{ color: '#9AA0A6' }}>{r.by} · {r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
