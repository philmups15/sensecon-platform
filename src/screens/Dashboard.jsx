import Chip from '../components/Chip';
import { kpis, mapPins, stageDist, activity, attentionPlants } from '../lib/mockData';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#6A7178', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 6, color: '#141719' }}>{k.value}</div>
            <div style={{ fontSize: 11.5, marginTop: 6, color: k.trendColor, fontWeight: 600 }}>{k.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Plants — Zambia</div>
          <div style={{ position: 'relative', height: 260, background: '#F4F6F8', borderRadius: 10, border: '1px dashed #D2D8DC' }}>
            {mapPins.map((p, i) => (
              <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 11, height: 11, borderRadius: 999, background: p.color, border: '2px solid #FFFFFF', boxShadow: '0 1px 4px rgba(20,23,25,0.25)' }} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#334155', marginTop: 3, background: '#FFFFFF', padding: '1px 5px', borderRadius: 4 }}>
                  {p.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Lifecycle stage distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                flex: 'none',
                background: 'conic-gradient(#2563EB 0% 34%, #6D28D9 34% 52%, #B45309 52% 68%, #15803D 68% 100%)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stageDist.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  {s.label} <span style={{ color: '#9AA0A6' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>This week</div>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid #F0F2F4' }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: a.color, marginTop: 6, flex: 'none' }} />
              <div>
                <div style={{ fontSize: 12.5, color: '#141719' }}>
                  <b>{a.who}</b> {a.what}
                </div>
                <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Plants needing attention</div>
          {attentionPlants.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F0F2F4' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#141719' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#9AA0A6' }}>{p.issue}</div>
              </div>
              <Chip label={p.healthLabel} tone={p.healthTone} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
