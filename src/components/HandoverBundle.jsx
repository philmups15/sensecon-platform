const DEFAULT_ITEMS = [
  { name: 'Commissioning record', meta: 'PDF · Signed off 12 Jun 2026', ext: 'PDF' },
  { name: 'As-built drawings', meta: 'PDF · Rev C', ext: 'PDF' },
  { name: 'Equipment warranties', meta: 'ZIP · 4 documents', ext: 'ZIP' },
  { name: 'Spares list', meta: 'XLSX · 18 line items', ext: 'XLS' },
  { name: 'O&M manuals', meta: 'PDF · Inverter + monitoring', ext: 'PDF' },
  { name: 'Initial performance baseline', meta: 'PDF · First 30-day report', ext: 'PDF' },
];

export default function HandoverBundle({ items = DEFAULT_ITEMS, generatedDate = '12 Jun 2026' }) {
  return (
    <div style={{ border: '1px solid #E4E8EB', borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #E4E8EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#141719' }}>Handover bundle</div>
        <div style={{ fontSize: 12, color: '#6A7178' }}>Generated {generatedDate}</div>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 18px',
            borderBottom: '1px solid #F0F2F4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#F4F6F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#6A7178',
              }}
            >
              {item.ext}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#141719' }}>{item.name}</div>
              <div style={{ fontSize: 11.5, color: '#9AA0A6' }}>{item.meta}</div>
            </div>
          </div>
          <button
            style={{
              border: '1px solid #D2D8DC',
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
