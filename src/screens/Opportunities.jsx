import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  uploadOpportunityAttachments,
  downloadOpportunityAttachment,
  getCurrentUser,
  toOpportunityView,
  OPPORTUNITY_STAGE_META,
} from '../lib/api';

const OPP_STAGE_ENTRIES = Object.entries(OPPORTUNITY_STAGE_META);

function buildStagePayload(o, stageKey) {
  return {
    code: o.id,
    customer: o.customer,
    capacity: o.capacity,
    stage: stageKey,
    location: o.location,
    nextAction: o.next,
    owner: o.owner,
    value: o.rawValue,
  };
}

function buildEditPayload(existing, form) {
  return {
    code: existing.id,
    customer: form.customer,
    capacity: form.capacity,
    stage: existing.stageKey,
    location: form.location,
    nextAction: form.nextAction,
    owner: form.owner,
    value: Number(form.value) || 0,
    notes: form.notes || null,
  };
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(kb < 10 ? 1 : 0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

const stageStepStyle = {
  padding: '3px 6px',
  border: 'none',
  background: 'transparent',
  color: '#2563EB',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
};

const dangerStepStyle = { ...stageStepStyle, color: '#B42318' };

const selectStyle = {
  padding: '5px 8px',
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  color: '#334155',
  background: '#FFFFFF',
  cursor: 'pointer',
};

const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 12 };

const EMPTY_FORM = { customer: '', capacity: '', location: '', owner: '', nextAction: '', value: '', notes: '' };

const LIST_GRID_COLUMNS = '1.4fr 0.8fr 1.1fr 1.2fr 0.9fr 0.8fr 1.3fr';

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [moveError, setMoveError] = useState('');
  const [dragId, setDragId] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState(null); // null | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [attachError, setAttachError] = useState('');
  const [uploadingMore, setUploadingMore] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getOpportunities()
      .then((dtos) => setOpportunities(dtos.map(toOpportunityView)))
      .catch((err) => setError(err.message || 'Failed to load opportunities.'))
      .finally(() => setLoading(false));
    getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  const changeStage = async (o, stageKey) => {
    if (!o || stageKey === o.stageKey) return;
    const meta = OPPORTUNITY_STAGE_META[stageKey];
    if (!meta) return;

    const previous = opportunities;
    setMovingId(o.entityId);
    setMoveError('');
    setOpportunities((prev) =>
      prev.map((item) =>
        item.entityId === o.entityId
          ? { ...item, stageKey, stage: meta.label, tone: meta.tone }
          : item
      )
    );

    try {
      await updateOpportunity(o.entityId, buildStagePayload(o, stageKey));
    } catch (err) {
      setOpportunities(previous);
      setMoveError(err.message || 'Failed to move opportunity to the new stage.');
    } finally {
      setMovingId(null);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setFiles([]);
    setFormError('');
    setEditingId(null);
    setFormMode('add');
  };

  const openEditForm = (o) => {
    setForm({
      customer: o.customer,
      capacity: o.capacity,
      location: o.location,
      owner: o.owner,
      nextAction: o.next,
      value: o.rawValue != null ? String(o.rawValue) : '',
      notes: o.notes || '',
    });
    setFormError('');
    setEditingId(o.entityId);
    setFormMode('edit');
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
  };

  const addFiles = (fileList) => {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.customer.trim()) {
      setFormError('Customer is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (formMode === 'edit') {
        const existing = opportunities.find((o) => o.entityId === editingId);
        await updateOpportunity(editingId, buildEditPayload(existing, form));
        const dto = await getOpportunity(editingId);
        const view = toOpportunityView(dto);
        setOpportunities((prev) => prev.map((item) => (item.entityId === view.entityId ? view : item)));
        setFormMode(null);
        setEditingId(null);
        setSelectedId(view.entityId);
      } else {
        const id = await createOpportunity({
          customer: form.customer,
          capacity: form.capacity,
          stage: 'Qualifying',
          location: form.location,
          nextAction: '',
          owner: form.owner,
          value: Number(form.value) || 0,
          notes: form.notes || null,
        });

        if (files.length > 0) {
          await uploadOpportunityAttachments(id, files);
        }

        const dto = await getOpportunity(id);
        const view = toOpportunityView(dto);
        setOpportunities((prev) => [view, ...prev]);
        setFormMode(null);
        setSelectedId(view.entityId);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save opportunity.');
    } finally {
      setSaving(false);
    }
  };

  const addMoreAttachments = async (opportunity, fileList) => {
    const newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    setAttachError('');
    setUploadingMore(true);
    try {
      await uploadOpportunityAttachments(opportunity.entityId, newFiles);
      const dto = await getOpportunity(opportunity.entityId);
      const view = toOpportunityView(dto);
      setOpportunities((prev) => prev.map((item) => (item.entityId === view.entityId ? view : item)));
    } catch (err) {
      setAttachError(err.message || 'Failed to upload attachment(s).');
    } finally {
      setUploadingMore(false);
    }
  };

  const removeOpportunity = async (o) => {
    if (!window.confirm(`Delete the opportunity for ${o.customer}? This cannot be undone.`)) return;
    setDeletingId(o.entityId);
    setDeleteError('');
    try {
      await deleteOpportunity(o.entityId);
      setOpportunities((prev) => prev.filter((item) => item.entityId !== o.entityId));
      setSelectedId((prev) => (prev === o.entityId ? null : prev));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete opportunity.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading opportunities…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;

  const selected = opportunities.find((o) => o.entityId === selectedId);
  const byStage = OPP_STAGE_ENTRIES.map(([key, meta], stageIndex) => ({
    key,
    stageIndex,
    stage: meta.label,
    tone: meta.tone,
    cards: opportunities.filter((o) => o.stageKey === key),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setView('list')}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D2D8DC', background: view === 'list' ? '#EAF0FE' : '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          List
        </button>
        <button
          onClick={() => setView('kanban')}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D2D8DC', background: view === 'kanban' ? '#EAF0FE' : '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Kanban
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={openAddForm}
          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          + Add opportunity
        </button>
      </div>
      {view === 'kanban' && <div style={{ fontSize: 11.5, color: '#9AA0A6', marginTop: -8 }}>Drag a card to another column to move it through the pipeline.</div>}

      {moveError && <div style={{ padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{moveError}</div>}
      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {opportunities.length === 0 && <div style={{ padding: 20, color: '#6A7178' }}>No opportunities yet.</div>}

      {opportunities.length > 0 && view === 'list' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: LIST_GRID_COLUMNS, padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
            <div>Customer</div><div>Capacity</div><div>Stage</div><div>Next action</div><div>Owner</div><div>Value</div><div>Actions</div>
          </div>
          {opportunities.map((o) => (
            <div
              key={o.entityId}
              style={{ display: 'grid', gridTemplateColumns: LIST_GRID_COLUMNS, padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', alignItems: 'center' }}
            >
              <div onClick={() => setSelectedId(o.entityId)} style={{ fontWeight: 600, color: '#141719', cursor: 'pointer' }}>
                {o.customer}
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 500 }}>{o.location}</div>
              </div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.capacity}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={o.stageKey}
                  disabled={movingId === o.entityId}
                  onChange={(e) => changeStage(o, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ ...selectStyle, opacity: movingId === o.entityId ? 0.6 : 1 }}
                >
                  {OPP_STAGE_ENTRIES.map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                {movingId === o.entityId && <Spinner size={12} />}
              </div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.next}</div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.owner}</div>
              <div onClick={() => setSelectedId(o.entityId)} style={{ color: '#141719', fontWeight: 600, cursor: 'pointer' }}>{o.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setSelectedId(o.entityId)} style={stageStepStyle}>View</button>
                <button type="button" onClick={() => openEditForm(o)} style={stageStepStyle}>Edit</button>
                {deletingId === o.entityId ? (
                  <Spinner size={12} />
                ) : (
                  <button type="button" onClick={() => removeOpportunity(o)} style={dangerStepStyle}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {opportunities.length > 0 && view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {byStage.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const dragged = opportunities.find((o) => o.entityId === draggedId);
                if (dragged) changeStage(dragged, col.key);
                setDragId(null);
              }}
              style={{ borderRadius: 10, padding: 4, background: dragId ? '#F5F7FA' : 'transparent' }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{col.stage}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                {col.cards.map((c) => (
                  <div
                    key={c.entityId}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', c.entityId);
                      setDragId(c.entityId);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelectedId(c.entityId)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4E8EB',
                      borderRadius: 10,
                      padding: 12,
                      boxShadow: '0 1px 2px rgba(20,23,25,0.05)',
                      cursor: 'grab',
                      opacity: movingId === c.entityId || dragId === c.entityId ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#141719' }}>{c.customer}</div>
                    <div style={{ fontSize: 11, color: '#6A7178', marginTop: 3 }}>{c.capacity} · {c.location}</div>
                    <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 6 }}>{c.next}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <button
                        type="button"
                        disabled={col.stageIndex === 0 || movingId === c.entityId}
                        onClick={(e) => { e.stopPropagation(); changeStage(c, OPP_STAGE_ENTRIES[col.stageIndex - 1][0]); }}
                        style={{ ...stageStepStyle, visibility: col.stageIndex === 0 ? 'hidden' : 'visible' }}
                      >
                        ‹ Back
                      </button>
                      {movingId === c.entityId && <Spinner size={12} />}
                      <button
                        type="button"
                        disabled={col.stageIndex === OPP_STAGE_ENTRIES.length - 1 || movingId === c.entityId}
                        onClick={(e) => { e.stopPropagation(); changeStage(c, OPP_STAGE_ENTRIES[col.stageIndex + 1][0]); }}
                        style={{ ...stageStepStyle, visibility: col.stageIndex === OPP_STAGE_ENTRIES.length - 1 ? 'hidden' : 'visible' }}
                      >
                        Next ›
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openEditForm(c); }} style={stageStepStyle}>Edit</button>
                      {deletingId === c.entityId ? (
                        <Spinner size={12} />
                      ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeOpportunity(c); }} style={dangerStepStyle}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: '#FFFFFF', borderLeft: '1px solid #E4E8EB', boxShadow: '-8px 0 24px rgba(20,23,25,0.12)', zIndex: 30, padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.customer}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => openEditForm(selected)} style={stageStepStyle}>Edit</button>
              {deletingId === selected.entityId ? (
                <Spinner size={12} />
              ) : (
                <button type="button" onClick={() => removeOpportunity(selected)} style={dangerStepStyle}>Delete</button>
              )}
              <span onClick={() => setSelectedId(null)} style={{ cursor: 'pointer', color: '#9AA0A6', fontSize: 18 }}>×</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace', marginTop: 2 }}>{selected.id}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div>
              <span style={{ color: '#6A7178' }}>Stage</span>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={selected.stageKey}
                  disabled={movingId === selected.entityId}
                  onChange={(e) => changeStage(selected, e.target.value)}
                  style={{ ...selectStyle, opacity: movingId === selected.entityId ? 0.6 : 1 }}
                >
                  {OPP_STAGE_ENTRIES.map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                {movingId === selected.entityId ? <Spinner size={12} /> : <Chip label={selected.stage} tone={selected.tone} />}
              </div>
            </div>
            <div><span style={{ color: '#6A7178' }}>Capacity</span><div style={{ fontWeight: 600 }}>{selected.capacity || '—'}</div></div>
            <div><span style={{ color: '#6A7178' }}>Location</span><div style={{ fontWeight: 600 }}>{selected.location || '—'}</div></div>
            <div><span style={{ color: '#6A7178' }}>Indicative value</span><div style={{ fontWeight: 600 }}>{selected.value}</div></div>
            <div><span style={{ color: '#6A7178' }}>Next action</span><div style={{ fontWeight: 600 }}>{selected.next || '—'}</div></div>
            <div><span style={{ color: '#6A7178' }}>Owner</span><div style={{ fontWeight: 600 }}>{selected.owner || '—'}</div></div>
            <div><span style={{ color: '#6A7178' }}>Notes</span><div style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{selected.notes || '—'}</div></div>
            <div><span style={{ color: '#6A7178' }}>Created</span><div style={{ fontWeight: 600 }}>{selected.createdDate} by {selected.createdByName || 'Unknown'}</div></div>

            <div>
              <span style={{ color: '#6A7178' }}>Attachments</span>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.attachments.length === 0 && <div style={{ color: '#9AA0A6', fontWeight: 500 }}>No attachments.</div>}
                {selected.attachments.map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#F7F8F9', borderRadius: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.fileName}</div>
                      <div style={{ fontSize: 10.5, color: '#9AA0A6' }}>{formatBytes(a.sizeBytes)} · {a.date}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadOpportunityAttachment(selected.entityId, a.id, a.fileName)}
                      style={{ ...stageStepStyle, flex: 'none' }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
              {attachError && <div style={{ marginTop: 8, padding: '6px 8px', background: '#FBE9E7', color: '#B42318', borderRadius: 6, fontSize: 11.5 }}>{attachError}</div>}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11.5, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>
                {uploadingMore ? <Spinner size={12} /> : '+'} Add attachment
                <input
                  type="file"
                  multiple
                  disabled={uploadingMore}
                  onChange={(e) => { addMoreAttachments(selected, e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          <button style={{ width: '100%', marginTop: 20, padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Convert to project
          </button>
        </div>
      )}

      {formMode && (
        <div
          onClick={closeForm}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,23,25,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitForm}
            style={{ width: 460, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(20,23,25,0.2)' }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{formMode === 'edit' ? 'Edit opportunity' : 'Add opportunity'}</div>
            {formMode === 'add' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Chip label="Qualifying" tone="slate" />
                <span style={{ fontSize: 11.5, color: '#9AA0A6' }}>
                  Created {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} by {currentUser?.displayName || 'you'}
                </span>
              </div>
            )}

            <div style={fieldLabelStyle}>Customer *</div>
            <input
              value={form.customer}
              onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
              required
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Capacity</div>
                <input
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 480 kWp"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={fieldLabelStyle}>Location</div>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Owner</div>
                <input
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={fieldLabelStyle}>Estimated value ($)</div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {formMode === 'edit' && (
              <>
                <div style={fieldLabelStyle}>Next action</div>
                <input
                  value={form.nextAction}
                  onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                  placeholder="e.g. Schedule site visit"
                  style={inputStyle}
                />
              </>
            )}

            <div style={fieldLabelStyle}>Notes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />

            {formMode === 'add' && (
              <>
                <div style={fieldLabelStyle}>Attachments (optional)</div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>
                  + Choose files
                  <input type="file" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
                {files.length > 0 && (
                  <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: '#F7F8F9', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span onClick={() => removeFile(i)} style={{ cursor: 'pointer', color: '#9AA0A6', flex: 'none', marginLeft: 8 }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {formError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{formError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={closeForm} disabled={saving} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saving && <Spinner size={12} color="#fff" />}
                {formMode === 'edit' ? 'Save changes' : 'Add opportunity'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
