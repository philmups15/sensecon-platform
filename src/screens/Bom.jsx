import Chip from '../components/Chip';
import { bomRows, variance } from '../lib/mockData';

export default function Bom() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 1.2fr 1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
          <div>Component</div><div>Qty</div><div>Unit cost</div><div>Supplier</div><div>Status</div>
        </div>
        {bomRows.map((b, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 1.2fr 1fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#141719' }}>{b.component}</div>
            <div>{b.qty}</div>
            <div>{b.unit}</div>
            <div>{b.supplier}</div>
            <div><Chip label={b.status} tone={b.tone} /></div>
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Cost variance vs budget ($k)</div>
        {variance.map((v, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155', marginBottom: 4 }}>
              <span>{v.label}</span>
              <span>{v.actual}k / {v.budget}k budget</span>
            </div>
            <div style={{ height: 8, background: '#F0F2F4', borderRadius: 999, position: 'relative' }}>
              <div style={{ height: 8, width: `${v.actualPct}%`, background: '#2563EB', borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
