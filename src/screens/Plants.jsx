import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import LifecycleTimeline from '../components/LifecycleTimeline';
import Spinner from '../components/Spinner';
import {
  getPlants,
  createPlant,
  updatePlant,
  deletePlant,
  getWorkOrders,
  getProjects,
  toPlantView,
  toWorkOrderView,
  toProjectView,
  getPlantAttachments,
  uploadPlantAttachments,
  downloadPlantAttachment,
  canAccess,
  STAGE_META,
  HEALTH_META,
} from '../lib/api';

const STAGE_ENTRIES = Object.entries(STAGE_META);
const HEALTH_ENTRIES = Object.entries(HEALTH_META);

const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };

const EMPTY_FORM = { name: '', stage: 'DesignSurvey', capacity: '', equipment: '', performanceRatio: '', health: 'Unknown', projectId: '' };

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

export default function Plants({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'plants', 'write');

  const [plants, setPlants] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('overview');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [editingCore, setEditingCore] = useState(false);
  const [coreDraft, setCoreDraft] = useState({});
  const [savingCore, setSavingCore] = useState(false);
  const [coreError, setCoreError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getPlants(), getWorkOrders(), getProjects()])
      .then(([plantDtos, workOrderDtos, projectDtos]) => {
        const plantViews = plantDtos.map(toPlantView);
        setPlants(plantViews);
        setWorkOrders(workOrderDtos.map(toWorkOrderView));
        setProjects(projectDtos.map(toProjectView));
        setSelectedId((prev) => (plantViews.some((p) => p.id === prev) ? prev : (plantViews[0]?.id ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load plants.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (tab !== 'handover' || !selectedId) return;
    setAttachmentsLoading(true);
    getPlantAttachments(selectedId)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [tab, selectedId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading plants…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const detail = plants.find((p) => p.id === selectedId) || plants[0];
  const openWork = detail ? workOrders.filter((w) => w.plantId === detail.id && w.col !== 'Done') : [];

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setCreateError('');
    setShowAddForm(true);
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setCreateError('Name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await createPlant({
        name: form.name,
        stage: form.stage,
        capacity: form.capacity,
        equipment: form.equipment,
        performanceRatio: form.performanceRatio ? Number(form.performanceRatio) : null,
        health: form.health,
        projectId: form.projectId || null,
      });
      const dtos = await getPlants();
      const views = dtos.map(toPlantView);
      setPlants(views);
      const created = views.find((p) => p.name === form.name) || views[0];
      setSelectedId(created?.id ?? null);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create plant.');
    } finally {
      setCreating(false);
    }
  };

  const startEditCore = (p) => {
    setCoreDraft({
      name: p.name,
      stage: Object.entries(STAGE_META).find(([, meta]) => meta.key === p.stage)?.[0] || 'DesignSurvey',
      capacity: p.capacity,
      equipment: p.equip,
      performanceRatio: p.pr != null ? String(p.pr) : '',
      health: Object.entries(HEALTH_META).find(([, meta]) => meta.label === p.health)?.[0] || 'Unknown',
      projectId: p.projectId || '',
    });
    setCoreError('');
    setEditingCore(true);
  };
  const cancelEditCore = () => setEditingCore(false);
  const saveCore = async () => {
    if (!detail) return;
    setSavingCore(true);
    setCoreError('');
    try {
      await updatePlant(detail.id, {
        name: coreDraft.name,
        stage: coreDraft.stage,
        capacity: coreDraft.capacity,
        equipment: coreDraft.equipment,
        performanceRatio: coreDraft.performanceRatio ? Number(coreDraft.performanceRatio) : null,
        health: coreDraft.health,
        projectId: coreDraft.projectId || null,
      });
      const dtos = await getPlants();
      setPlants(dtos.map(toPlantView));
      setEditingCore(false);
    } catch (err) {
      setCoreError(err.message || 'Failed to save changes.');
    } finally {
      setSavingCore(false);
    }
  };

  const removePlant = async (p) => {
    if (!window.confirm(`Delete plant ${p.name}? This cannot be undone.`)) return;
    setDeletingId(p.id);
    setDeleteError('');
    try {
      await deletePlant(p.id);
      setPlants((prev) => prev.filter((item) => item.id !== p.id));
      if (selectedId === p.id) {
        setSelectedId((prev) => plants.filter((item) => item.id !== p.id)[0]?.id ?? null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete plant. It may still have linked work orders.');
    } finally {
      setDeletingId(null);
    }
  };

  const handoverItems = attachments.map((a) => ({
    id: a.id,
    name: a.title,
    meta: `${a.fileName.split('.').pop().toUpperCase()} · v${a.version} · ${formatBytes(a.sizeBytes)} · ${a.uploadedByName}`,
    ext: attachmentExt(a.fileName),
    fileName: a.fileName,
  }));

  const uploadHandoverFiles = async (files) => {
    await uploadPlantAttachments(detail.id, files, files[0].name.replace(/\.[^/.]+$/, ''));
    const list = await getPlantAttachments(detail.id);
    setAttachments(list);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add plant</button>}
      </div>

      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {plants.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No plants yet.</div>}

      {plants.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.4fr 0.9fr 0.9fr 1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
            <div>Plant</div><div>Stage</div><div>Capacity</div><div>Equipment</div><div>PR</div><div>Health</div><div>Actions</div>
          </div>
          {plants.map((p) => {
            const prPct = p.pr ? Math.round(p.pr * 100) + '%' : '—';
            return (
              <div
                key={p.id}
                style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.4fr 0.9fr 0.9fr 1fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}
              >
                <div onClick={() => { setSelectedId(p.id); setTab('overview'); }} style={{ fontWeight: 600, color: '#12201F', cursor: 'pointer' }}>{p.name}</div>
                <div><Chip label={p.stageLabel} tone={p.tone} /></div>
                <div>{p.capacity}</div>
                <div style={{ color: '#52685F', fontSize: 12 }}>{p.equip}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 36, height: 6, background: '#E9F1EF', borderRadius: 999 }}>
                    <div style={{ height: 6, width: prPct === '—' ? '0%' : prPct, background: '#1F6E72', borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#52685F' }}>{prPct}</span>
                </div>
                <div><Chip label={p.health} tone={p.healthTone} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {canWrite && <button type="button" onClick={() => { setSelectedId(p.id); startEditCore(p); }} style={linkBtnStyle}>Edit</button>}
                  {canWrite && (deletingId === p.id ? <Spinner size={12} /> : <button type="button" onClick={() => removePlant(p)} style={dangerBtnStyle}>Delete</button>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!editingCore && <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.name}</div>}
            {!editingCore && <Chip label={detail.health} tone={detail.healthTone} />}
            {canWrite && !editingCore && <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>}
            {editingCore && (
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button onClick={cancelEditCore} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {savingCore && <Spinner size={11} color="#fff" />}Save
                </button>
              </div>
            )}
          </div>

          {coreError && <div style={{ margin: '10px 0', padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}

          {editingCore ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Name</div>
                <input value={coreDraft.name ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, name: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Stage</div>
                <select value={coreDraft.stage ?? 'DesignSurvey'} onChange={(e) => setCoreDraft((d) => ({ ...d, stage: e.target.value }))} style={smallInputStyle}>
                  {STAGE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Capacity</div>
                <input value={coreDraft.capacity ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, capacity: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Equipment</div>
                <input value={coreDraft.equipment ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, equipment: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Performance ratio (0–1)</div>
                <input type="number" min="0" max="1" step="0.01" value={coreDraft.performanceRatio ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, performanceRatio: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Health</div>
                <select value={coreDraft.health ?? 'Unknown'} onChange={(e) => setCoreDraft((d) => ({ ...d, health: e.target.value }))} style={smallInputStyle}>
                  {HEALTH_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Project</div>
                <select value={coreDraft.projectId ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, projectId: e.target.value }))} style={smallInputStyle}>
                  <option value="">— None —</option>
                  {projects.map((pr) => <option key={pr.entityId} value={pr.entityId}>{pr.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ margin: '8px 0 4px' }}>
              {detail.projectName && (
                <div style={{ marginBottom: 8, padding: '9px 12px', background: '#E4F0EF', borderRadius: 8, fontSize: 12, color: '#12484B' }}>
                  Linked to project <b>{detail.projectName}</b>
                </div>
              )}
              <LifecycleTimeline stage={detail.stage} variant="full" />
            </div>
          )}

          {!editingCore && (
            <>
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #D7E4E1', marginBottom: 16 }}>
                {[['overview', 'Overview'], ['handover', 'Handover bundle'], ['work', 'Open work']].map(([key, label]) => {
                  const active = tab === key;
                  const color = active ? '#12484B' : '#78908A';
                  return (
                    <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                      {label}
                    </div>
                  );
                })}
              </div>

              {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 13 }}>
                  <div><span style={{ color: '#52685F' }}>Capacity</span><div style={{ fontWeight: 600 }}>{detail.capacity}</div></div>
                  <div><span style={{ color: '#52685F' }}>Equipment</span><div style={{ fontWeight: 600 }}>{detail.equip}</div></div>
                </div>
              )}

              {tab === 'handover' && (
                attachmentsLoading
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A' }}><Spinner size={14} />Loading documents…</div>
                  : (
                    <HandoverBundle
                      items={handoverItems}
                      generatedDate={handoverItems.length ? formatDate(attachments[0].created) : '—'}
                      onDownload={(item) => downloadPlantAttachment(detail.id, item.id, item.fileName)}
                      onUpload={canWrite ? uploadHandoverFiles : undefined}
                      canUpload={canWrite}
                      emptyLabel="No handover documents uploaded yet."
                    />
                  )
              )}

              {tab === 'work' && (openWork.length > 0 ? openWork.map((w) => (
                <div key={w.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                  <div>{w.title} <span style={{ color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', fontSize: 11 }}>{w.id}</span></div>
                  <Chip label={w.priority} tone={w.priorityTone} />
                </div>
              )) : <div style={{ padding: '10px 0', fontSize: 13, color: '#78908A' }}>No open work orders.</div>)}
            </>
          )}
        </div>
      )}

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 460, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add plant</div>

            <div style={fieldLabelStyle}>Name *</div>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Stage</div>
                <select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} style={inputStyle}>
                  {STAGE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Health</div>
                <select value={form.health} onChange={(e) => setForm((f) => ({ ...f, health: e.target.value }))} style={inputStyle}>
                  {HEALTH_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Capacity</div>
                <input value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 480 kWp" style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Equipment</div>
                <input value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} placeholder="e.g. 3× 150kW inverters" style={inputStyle} />
              </div>
            </div>

            <div style={fieldLabelStyle}>Performance ratio (0–1)</div>
            <input type="number" min="0" max="1" step="0.01" value={form.performanceRatio} onChange={(e) => setForm((f) => ({ ...f, performanceRatio: e.target.value }))} placeholder="e.g. 0.82" style={inputStyle} />

            <div style={fieldLabelStyle}>Project</div>
            <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} style={inputStyle}>
              <option value="">— None —</option>
              {projects.map((pr) => <option key={pr.entityId} value={pr.entityId}>{pr.name}</option>)}
            </select>

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add plant
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
