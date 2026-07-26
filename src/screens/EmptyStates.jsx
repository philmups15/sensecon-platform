export default function EmptyStates() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>No opportunities yet</div>
        <div style={{ fontSize: 12.5, color: '#6A7178', maxWidth: 260 }}>
          Opportunities you log from sales calls or referrals will appear here. Add your first one to start the pipeline.
        </div>
        <button style={{ marginTop: 8, padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
          Add opportunity
        </button>
      </div>
      <div style={{ background: '#FBE9E7', border: '1px solid #F3C6C0', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#B42318' }}>Couldn't load work orders</div>
        <div style={{ fontSize: 12.5, color: '#8A241A', marginTop: 4 }}>
          The request timed out after 8 seconds. Check your connection and retry — no changes were lost.
        </div>
        <button style={{ marginTop: 10, padding: '7px 14px', background: '#FFFFFF', border: '1px solid #F3C6C0', borderRadius: 8, fontWeight: 600, fontSize: 12, color: '#B42318', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
      <div style={{ background: '#FBF0E2', border: '1px solid #EBD3A8', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309' }}>Offline — 4 actions queued</div>
        <div style={{ fontSize: 12.5, color: '#8A5A0A', marginTop: 4 }}>
          Changes are saved on this device and will sync when connection returns.
        </div>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#141719' }}>You don't have access to this tenant</div>
        <div style={{ fontSize: 12.5, color: '#6A7178', marginTop: 4 }}>
          Administration is restricted to tenant admins and platform admins. Ask your tenant admin for access.
        </div>
      </div>
    </div>
  );
}
