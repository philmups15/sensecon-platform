import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import Spinner from '../components/Spinner';
import {
  getPlants,
  getWorkOrders,
  getPlantAttachments,
  downloadPlantAttachment,
  toPlantView,
  toWorkOrderView,
} from '../lib/api';

function attachmentExt(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? 'FILE' : fileName.slice(dot + 1).toUpperCase().slice(0, 4);
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Portal() {
  const [plants, setPlants] = useState([]);
  const [history, setHistory] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlants(), getWorkOrders()])
      .then(async ([plantDtos, workOrderDtos]) => {
        const plantViews = plantDtos.map(toPlantView);
        setPlants(plantViews);
        setHistory(workOrderDtos.map(toWorkOrderView).filter((w) => w.col === 'Done'));

        const attachmentLists = await Promise.all(
          plantViews.map((p) => getPlantAttachments(p.id).catch(() => [])),
        );
        setBundles(
          plantViews
            .map((p, i) => ({ plant: p, attachments: attachmentLists[i] }))
            .filter((b) => b.attachments.length > 0),
        );
      })
      .catch((err) => setError(err.message || 'Failed to load portal data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 18 }}>
        {plants.length === 0 && <div style={{ fontSize: 13, color: '#78908A' }}>No plants yet.</div>}
        {plants.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#52685F' }}>{p.capacity} · PR {p.pr ? Math.round(p.pr * 100) + '%' : '—'}</div>
            </div>
            <Chip label={p.health} tone={p.healthTone} />
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #D7E4E1' }}>Work order history</div>
        {history.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#78908A' }}>No closed work orders yet.</div>}
        {history.map((w) => (
          <div key={w.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>{w.title} <span style={{ color: '#78908A', fontSize: 11 }}>{w.id}</span></div>
            <Chip label={w.col} tone="green" />
          </div>
        ))}
      </div>

      {bundles.length === 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 18, fontSize: 13, color: '#78908A' }}>
          No handover documents available yet.
        </div>
      )}
      {bundles.map(({ plant, attachments }) => (
        <div key={plant.id}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#52685F', margin: '2px 0 6px' }}>{plant.name}</div>
          <HandoverBundle
            items={attachments.map((a) => ({
              id: a.id,
              name: a.title,
              meta: `${attachmentExt(a.fileName)} · v${a.version} · ${formatBytes(a.sizeBytes)} · ${a.uploadedByName}`,
              ext: attachmentExt(a.fileName),
              fileName: a.fileName,
            }))}
            generatedDate={formatDate(attachments[0].created)}
            onDownload={(item) => downloadPlantAttachment(plant.id, item.id, item.fileName)}
            emptyLabel="No handover documents uploaded yet."
          />
        </div>
      ))}
    </div>
  );
}
