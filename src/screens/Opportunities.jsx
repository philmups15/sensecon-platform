import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  changeOpportunityStage,
  updateOpportunityStageData,
  addOpportunityNote,
  convertOpportunityToProject,
  uploadOpportunityAttachments,
  downloadOpportunityAttachment,
  getCurrentUser,
  toOpportunityView,
  OPPORTUNITY_STAGE_META,
  STAGE_FIELD_DEFS,
} from '../lib/api';

const OPP_STAGE_ENTRIES = Object.entries(OPPORTUNITY_STAGE_META);
const STAGE_ORDER = OPP_STAGE_ENTRIES.map(([key]) => key);

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(kb < 10 ? 1 : 0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function groupDocuments(attachments) {
  const groups = new Map();
  attachments.forEach((a) => {
    if (!groups.has(a.title)) groups.set(a.title, []);
    groups.get(a.title).push(a);
  });
  return Array.from(groups.entries()).map(([title, versions]) => ({
    title,
    versions: [...versions].sort((a, b) => b.version - a.version),
    latestVersion: Math.max(...versions.map((v) => v.version)),
  }));
}

const linkBtnStyle = {
  padding: '3px 6px',
  border: 'none',
  background: 'transparent',
  color: '#2563EB',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
};
const dangerBtnStyle = { ...linkBtnStyle, color: '#B42318' };
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
const cardStyle = { background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: '20px 22px', marginBottom: 16 };
const cardHeaderStyle = { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6' };
const primaryBtnStyle = { padding: '9px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const chipBtnStyle = (active) => ({
  padding: '7px 13px',
  borderRadius: 999,
  border: `1px solid ${active ? '#2563EB' : '#D2D8DC'}`,
  background: active ? '#2563EB' : '#FFFFFF',
  color: active ? '#fff' : '#334155',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const LIST_GRID_COLUMNS = '1.4fr 0.7fr 1.1fr 1.1fr 0.9fr 0.85fr 0.75fr 1.3fr';

const EMPTY_FORM = { customer: '', capacity: '', location: '', owner: '', value: '', nextAction: '' };

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [movingId, setMovingId] = useState(null);
  const [moveError, setMoveError] = useState('');
  const [dragId, setDragId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [stageChangeOpen, setStageChangeOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState(null);
  const [stageChangeNote, setStageChangeNote] = useState('');
  const [stageChanging, setStageChanging] = useState(false);
  const [stageChangeError, setStageChangeError] = useState('');

  const [editingCore, setEditingCore] = useState(false);
  const [coreDraft, setCoreDraft] = useState({});
  const [savingCore, setSavingCore] = useState(false);
  const [coreError, setCoreError] = useState('');

  const [editingStageData, setEditingStageData] = useState(false);
  const [stageDraft, setStageDraft] = useState({});
  const [savingStageData, setSavingStageData] = useState(false);
  const [stageDataError, setStageDataError] = useState('');

  const [docTitleDraft, setDocTitleDraft] = useState('');
  const [docFiles, setDocFiles] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const [expandedDocs, setExpandedDocs] = useState({});

  const [noteDraft, setNoteDraft] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    getOpportunities()
      .then((dtos) => setOpportunities(dtos.map(toOpportunityView)))
      .catch((err) => setError(err.message || 'Failed to load opportunities.'))
      .finally(() => setLoading(false));
    getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  const refreshOpportunity = async (id) => {
    const dto = await getOpportunity(id);
    const view = toOpportunityView(dto);
    setOpportunities((prev) => prev.map((item) => (item.entityId === id ? view : item)));
    return view;
  };

  const openDetail = (id) => {
    setSelectedId(id);
    setEditingCore(false);
    setEditingStageData(false);
    setCoreError('');
    setStageDataError('');
    setNoteError('');
    setDocError('');
    setConvertError('');
    setDocTitleDraft('');
    setDocFiles([]);
    setNoteDraft('');
  };
  const openDetailForEdit = (o) => {
    openDetail(o.entityId);
    startEditCore(o);
  };
  const closeDetail = () => {
    setSelectedId(null);
    setEditingCore(false);
    setEditingStageData(false);
  };

  const changeStage = async (o, stageKey) => {
    if (!o || stageKey === o.stageKey) return;
    setMovingId(o.entityId);
    setMoveError('');
    try {
      await changeOpportunityStage(o.entityId, stageKey);
      await refreshOpportunity(o.entityId);
    } catch (err) {
      setMoveError(err.message || 'Failed to move opportunity to the new stage.');
    } finally {
      setMovingId(null);
    }
  };

  const openStageChangeModal = (stageKey) => {
    if (!selected || stageKey === selected.stageKey) return;
    setPendingStage(stageKey);
    setStageChangeNote('');
    setStageChangeError('');
    setStageChangeOpen(true);
  };
  const cancelStageChange = () => {
    if (stageChanging) return;
    setStageChangeOpen(false);
    setPendingStage(null);
    setStageChangeNote('');
  };
  const confirmStageChange = async () => {
    if (!selected || !pendingStage) return;
    setStageChanging(true);
    setStageChangeError('');
    try {
      await changeOpportunityStage(selected.entityId, pendingStage, stageChangeNote.trim() || undefined);
      await refreshOpportunity(selected.entityId);
      setStageChangeOpen(false);
      setPendingStage(null);
      setStageChangeNote('');
      setEditingStageData(false);
    } catch (err) {
      setStageChangeError(err.message || 'Failed to change stage.');
    } finally {
      setStageChanging(false);
    }
  };

  const startEditCore = (o) => {
    setCoreDraft({
      customer: o.customer,
      capacity: o.capacity,
      location: o.location,
      owner: o.owner,
      value: o.rawValue != null ? String(o.rawValue) : '',
      nextAction: o.next,
    });
    setCoreError('');
    setEditingCore(true);
  };
  const cancelEditCore = () => setEditingCore(false);
  const saveCore = async () => {
    if (!selected) return;
    setSavingCore(true);
    setCoreError('');
    try {
      await updateOpportunity(selected.entityId, {
        code: selected.id,
        customer: coreDraft.customer,
        capacity: coreDraft.capacity,
        stage: selected.stageKey,
        location: coreDraft.location,
        nextAction: coreDraft.nextAction,
        owner: coreDraft.owner,
        value: Number(coreDraft.value) || 0,
      });
      await refreshOpportunity(selected.entityId);
      setEditingCore(false);
    } catch (err) {
      setCoreError(err.message || 'Failed to save changes.');
    } finally {
      setSavingCore(false);
    }
  };

  const startEditStageData = () => {
    if (!selected) return;
    const defs = STAGE_FIELD_DEFS[selected.stageKey] || [];
    const existing = selected.stageData[selected.stageKey] || {};
    const draft = {};
    defs.forEach((f) => { draft[f.key] = existing[f.key] || ''; });
    setStageDraft(draft);
    setStageDataError('');
    setEditingStageData(true);
  };
  const cancelEditStageData = () => setEditingStageData(false);
  const saveStageData = async () => {
    if (!selected) return;
    setSavingStageData(true);
    setStageDataError('');
    try {
      await updateOpportunityStageData(selected.entityId, stageDraft);
      await refreshOpportunity(selected.entityId);
      setEditingStageData(false);
    } catch (err) {
      setStageDataError(err.message || 'Failed to save changes.');
    } finally {
      setSavingStageData(false);
    }
  };

  const addDocFiles = (fileList) => setDocFiles((prev) => [...prev, ...Array.from(fileList)]);
  const removeDocFile = (index) => setDocFiles((prev) => prev.filter((_, i) => i !== index));
  const addDocumentVersion = async () => {
    if (!selected || !docTitleDraft.trim() || docFiles.length === 0) return;
    setUploadingDoc(true);
    setDocError('');
    try {
      await uploadOpportunityAttachments(selected.entityId, docFiles, docTitleDraft.trim());
      await refreshOpportunity(selected.entityId);
      setDocTitleDraft('');
      setDocFiles([]);
    } catch (err) {
      setDocError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };
  const toggleDoc = (title) => setExpandedDocs((prev) => ({ ...prev, [title]: !prev[title] }));

  const submitNote = async () => {
    if (!selected || !noteDraft.trim()) return;
    setAddingNote(true);
    setNoteError('');
    try {
      await addOpportunityNote(selected.entityId, noteDraft.trim());
      await refreshOpportunity(selected.entityId);
      setNoteDraft('');
    } catch (err) {
      setNoteError(err.message || 'Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const convert = async () => {
    if (!selected) return;
    setConverting(true);
    setConvertError('');
    try {
      await convertOpportunityToProject(selected.entityId);
      await refreshOpportunity(selected.entityId);
    } catch (err) {
      setConvertError(err.message || 'Failed to convert opportunity.');
    } finally {
      setConverting(false);
    }
  };

  const removeOpportunity = async (o) => {
    if (!window.confirm(`Delete the opportunity for ${o.customer}? This cannot be undone.`)) return;
    setDeletingId(o.entityId);
    setDeleteError('');
    try {
      await deleteOpportunity(o.entityId);
      setOpportunities((prev) => prev.filter((item) => item.entityId !== o.entityId));
      if (selectedId === o.entityId) closeDetail();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete opportunity.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setFiles([]);
    setCreateError('');
    setShowAddForm(true);
  };
  const addFiles = (fileList) => setFiles((prev) => [...prev, ...Array.from(fileList)]);
  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.customer.trim()) {
      setCreateError('Customer is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const id = await createOpportunity({
        customer: form.customer,
        capacity: form.capacity,
        stage: 'Qualifying',
        location: form.location,
        nextAction: form.nextAction,
        owner: form.owner,
        value: Number(form.value) || 0,
      });

      if (files.length > 0) {
        await uploadOpportunityAttachments(id, files);
      }

      const dto = await getOpportunity(id);
      const view = toOpportunityView(dto);
      setOpportunities((prev) => [view, ...prev]);
      setShowAddForm(false);
      openDetail(view.entityId);
    } catch (err) {
      setCreateError(err.message || 'Failed to create opportunity.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading opportunities…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;

  const selected = opportunities.find((o) => o.entityId === selectedId);
  const showDetail = Boolean(selected);

  const byStage = OPP_STAGE_ENTRIES.map(([key, meta], stageIndex) => ({
    key,
    stageIndex,
    stage: meta.label,
    tone: meta.tone,
    cards: opportunities.filter((o) => o.stageKey === key),
  }));

  const filterChips = ['All', ...STAGE_ORDER].map((key) => ({
    key,
    label: key === 'All' ? 'All' : OPPORTUNITY_STAGE_META[key].label,
    count: key === 'All' ? opportunities.length : opportunities.filter((o) => o.stageKey === key).length,
  }));
  const q = search.trim().toLowerCase();
  const filteredOpportunities = opportunities.filter((o) => {
    const stageOk = activeFilter === 'All' || o.stageKey === activeFilter;
    const searchOk = !q || o.customer.toLowerCase().includes(q) || o.location.toLowerCase().includes(q);
    return stageOk && searchOk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!showDetail && (
        <>
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
            <button onClick={openAddForm} style={{ ...primaryBtnStyle, padding: '7px 14px' }}>
              + Add opportunity
            </button>
          </div>
          {view === 'kanban' && <div style={{ fontSize: 11.5, color: '#9AA0A6', marginTop: -8 }}>Drag a card to another column to move it through the pipeline.</div>}

          {view === 'list' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {filterChips.map((chip) => (
                  <button key={chip.key} onClick={() => setActiveFilter(chip.key)} style={chipBtnStyle(activeFilter === chip.key)}>
                    {chip.label} <span style={{ opacity: 0.7 }}>{chip.count}</span>
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or location…"
                style={{ border: '1px solid #D2D8DC', background: '#fff', padding: '9px 12px', borderRadius: 8, fontSize: 13, width: 240, fontFamily: 'inherit' }}
              />
            </div>
          )}

          {moveError && <div style={{ padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{moveError}</div>}
          {deleteError && <div style={{ padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

          {opportunities.length === 0 && <div style={{ padding: 20, color: '#6A7178' }}>No opportunities yet.</div>}

          {opportunities.length > 0 && view === 'list' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: LIST_GRID_COLUMNS, padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
                <div>Customer</div><div>Capacity</div><div>Stage</div><div>Next action</div><div>Owner</div><div>Value</div><div>Updated</div><div>Actions</div>
              </div>
              {filteredOpportunities.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#9AA0A6', fontSize: 14 }}>No opportunities match this filter.</div>}
              {filteredOpportunities.map((o) => (
                <div
                  key={o.entityId}
                  style={{ display: 'grid', gridTemplateColumns: LIST_GRID_COLUMNS, padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', alignItems: 'center' }}
                >
                  <div onClick={() => openDetail(o.entityId)} style={{ fontWeight: 600, color: '#141719', cursor: 'pointer' }}>
                    {o.customer}
                    <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 500 }}>{o.location}</div>
                  </div>
                  <div onClick={() => openDetail(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.capacity}</div>
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
                  <div onClick={() => openDetail(o.entityId)} style={{ color: '#334155', cursor: 'pointer' }}>{o.next || '—'}</div>
                  <div onClick={() => openDetail(o.entityId)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 999, background: '#EAF0FE', color: '#1E4FC4', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      {(o.owner || '?').trim().charAt(0).toUpperCase()}
                    </div>
                    <div style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.owner || '—'}</div>
                  </div>
                  <div onClick={() => openDetail(o.entityId)} style={{ color: '#141719', fontWeight: 600, cursor: 'pointer' }}>{o.value}</div>
                  <div onClick={() => openDetail(o.entityId)} style={{ color: '#9AA0A6', fontSize: 12, cursor: 'pointer' }}>{o.activity[0]?.tsLabel || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" onClick={() => openDetail(o.entityId)} style={linkBtnStyle}>View</button>
                    <button type="button" onClick={() => openDetailForEdit(o)} style={linkBtnStyle}>Edit</button>
                    {deletingId === o.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeOpportunity(o)} style={dangerBtnStyle}>Delete</button>}
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
                        onClick={() => openDetail(c.entityId)}
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
                            onClick={(e) => { e.stopPropagation(); changeStage(c, STAGE_ORDER[col.stageIndex - 1]); }}
                            style={{ ...linkBtnStyle, visibility: col.stageIndex === 0 ? 'hidden' : 'visible' }}
                          >
                            ‹ Back
                          </button>
                          {movingId === c.entityId && <Spinner size={12} />}
                          <button
                            type="button"
                            disabled={col.stageIndex === STAGE_ORDER.length - 1 || movingId === c.entityId}
                            onClick={(e) => { e.stopPropagation(); changeStage(c, STAGE_ORDER[col.stageIndex + 1]); }}
                            style={{ ...linkBtnStyle, visibility: col.stageIndex === STAGE_ORDER.length - 1 ? 'hidden' : 'visible' }}
                          >
                            Next ›
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                          <button type="button" onClick={(e) => { e.stopPropagation(); openDetailForEdit(c); }} style={linkBtnStyle}>Edit</button>
                          {deletingId === c.entityId ? <Spinner size={12} /> : <button type="button" onClick={(e) => { e.stopPropagation(); removeOpportunity(c); }} style={dangerBtnStyle}>Delete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showDetail && (
        <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <button onClick={closeDetail} style={{ border: '1px solid #D2D8DC', background: '#fff', color: '#454B58', padding: '8px 13px', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
              ← Back
            </button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selected.customer}</div>
              <div style={{ fontSize: 12, color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace', marginTop: 2 }}>{selected.id} · {selected.location || '—'}</div>
            </div>
            <div style={{ flex: 1 }} />
            {deletingId === selected.entityId ? <Spinner size={14} /> : <button type="button" onClick={() => removeOpportunity(selected)} style={{ ...dangerBtnStyle, fontSize: 12.5 }}>Delete</button>}
          </div>

          <div style={cardStyle}>
            <div style={{ ...cardHeaderStyle, marginBottom: 20 }}>Progression</div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {STAGE_ORDER.map((key, idx) => {
                const currentIdx = STAGE_ORDER.indexOf(selected.stageKey);
                const active = idx === currentIdx;
                const done = idx < currentIdx;
                const meta = OPPORTUNITY_STAGE_META[key];
                const toneColor = { slate: '#334155', blue: '#2563EB', violet: '#6D28D9', amber: '#B45309', green: '#15803D' }[meta.tone] || '#334155';
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div onClick={() => openStageChangeModal(key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 13.5, boxSizing: 'border-box',
                        background: active ? toneColor : (done ? '#EAF0FE' : '#fff'),
                        color: active ? '#fff' : (done ? '#2563EB' : '#C3C7D1'),
                        border: `2px solid ${active ? toneColor : (done ? '#2563EB' : '#D2D8DC')}`,
                      }}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#141719' : (done ? '#454B58' : '#C3C7D1'), whiteSpace: 'nowrap' }}>{meta.label}</div>
                    </div>
                    {idx < STAGE_ORDER.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: done ? '#2563EB' : '#E4E8EB', margin: '0 8px 22px 8px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22, alignItems: 'flex-start' }}>
            <div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={cardHeaderStyle}>Details</div>
                  {!editingCore && <button onClick={() => startEditCore(selected)} style={linkBtnStyle}>Edit</button>}
                  {editingCore && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={cancelEditCore} disabled={savingCore} style={{ ...linkBtnStyle, color: '#9AA0A6' }}>Cancel</button>
                      <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#2563EB', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {savingCore && <Spinner size={11} color="#fff" />}Save
                      </button>
                    </div>
                  )}
                </div>
                {coreError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  {[
                    { key: 'customer', label: 'Customer' },
                    { key: 'capacity', label: 'Capacity' },
                    { key: 'location', label: 'Location' },
                    { key: 'owner', label: 'Owner' },
                    { key: 'value', label: 'Value' },
                    { key: 'nextAction', label: 'Next action' },
                  ].map((f) => (
                    <div key={f.key}>
                      <div style={{ fontSize: 11.5, color: '#9AA0A6', marginBottom: 5 }}>{f.label}</div>
                      {editingCore ? (
                        <input
                          value={coreDraft[f.key] ?? ''}
                          onChange={(e) => setCoreDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          type={f.key === 'value' ? 'number' : 'text'}
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D2D8DC', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' }}
                        />
                      ) : (
                        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{f.key === 'value' ? selected.value : (selected[f.key === 'nextAction' ? 'next' : f.key] || '—')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={cardHeaderStyle}>{selected.stage} details</div>
                  {!editingStageData && <button onClick={startEditStageData} style={linkBtnStyle}>Edit</button>}
                  {editingStageData && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={cancelEditStageData} disabled={savingStageData} style={{ ...linkBtnStyle, color: '#9AA0A6' }}>Cancel</button>
                      <button onClick={saveStageData} disabled={savingStageData} style={{ border: 'none', background: '#2563EB', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {savingStageData && <Spinner size={11} color="#fff" />}Save
                      </button>
                    </div>
                  )}
                </div>
                {stageDataError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{stageDataError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  {(STAGE_FIELD_DEFS[selected.stageKey] || []).map((f) => {
                    const value = (selected.stageData[selected.stageKey] || {})[f.key] || '';
                    return (
                      <div key={f.key}>
                        <div style={{ fontSize: 11.5, color: '#9AA0A6', marginBottom: 5 }}>{f.label}</div>
                        {editingStageData ? (
                          <input
                            value={stageDraft[f.key] ?? ''}
                            onChange={(e) => setStageDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D2D8DC', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' }}
                          />
                        ) : (
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: value ? '#141719' : '#C3C7D1' }}>{value || '—'}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ ...cardHeaderStyle, marginBottom: 16 }}>Documents</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <input
                    value={docTitleDraft}
                    onChange={(e) => setDocTitleDraft(e.target.value)}
                    placeholder="e.g. Proposal, Site survey report"
                    style={{ flex: '1 1 200px', border: '1px solid #D2D8DC', borderRadius: 6, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit' }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {docFiles.length > 0 ? `${docFiles.length} file(s)` : 'Choose file'}
                    <input type="file" multiple onChange={(e) => { addDocFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
                  </label>
                  <button
                    onClick={addDocumentVersion}
                    disabled={uploadingDoc || !docTitleDraft.trim() || docFiles.length === 0}
                    style={{ ...primaryBtnStyle, opacity: uploadingDoc || !docTitleDraft.trim() || docFiles.length === 0 ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {uploadingDoc && <Spinner size={11} color="#fff" />}+ Add version
                  </button>
                </div>
                {docFiles.length > 0 && (
                  <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {docFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: '#F7F8F9', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span onClick={() => removeDocFile(i)} style={{ cursor: 'pointer', color: '#9AA0A6', marginLeft: 8 }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
                {docError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{docError}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupDocuments(selected.attachments).map((doc) => {
                    const expanded = !!expandedDocs[doc.title];
                    const latest = doc.versions[0];
                    return (
                      <div key={doc.title} style={{ border: '1px solid #EEF0F3', background: '#FAFBFC', borderRadius: 9, padding: '12px 14px' }}>
                        <div onClick={() => toggleDoc(doc.title)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{doc.title}</div>
                          <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 700 }}>v{latest.version} {expanded ? '▲' : '▼'}</div>
                        </div>
                        {expanded && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {doc.versions.map((v) => (
                              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#75798A', borderTop: '1px solid #EEF0F3', paddingTop: 6 }}>
                                <div>v{v.version} · {v.fileName} · {formatBytes(v.sizeBytes)}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span>{v.uploadedByName} · {v.date}</span>
                                  <button type="button" onClick={() => downloadOpportunityAttachment(selected.entityId, v.id, v.fileName)} style={linkBtnStyle}>Download</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selected.attachments.length === 0 && <div style={{ fontSize: 13, color: '#9AA0A6' }}>No documents yet.</div>}
                </div>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ ...cardHeaderStyle, marginBottom: 16 }}>Notes</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add a note about this opportunity…"
                    onKeyDown={(e) => { if (e.key === 'Enter') submitNote(); }}
                    style={{ flex: 1, border: '1px solid #D2D8DC', borderRadius: 6, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit' }}
                  />
                  <button onClick={submitNote} disabled={addingNote || !noteDraft.trim()} style={{ ...primaryBtnStyle, opacity: addingNote || !noteDraft.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {addingNote && <Spinner size={11} color="#fff" />}Add
                  </button>
                </div>
                {noteError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{noteError}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {selected.notes.map((n) => (
                    <div key={n.id} style={{ fontSize: 13.5, borderLeft: '2px solid #EEF0F3', paddingLeft: 12 }}>
                      <div style={{ color: '#141719' }}>{n.text}</div>
                      <div style={{ color: '#9AA0A6', fontSize: 12, marginTop: 4 }}>{n.who} · {n.tsLabel}</div>
                    </div>
                  ))}
                  {selected.notes.length === 0 && <div style={{ fontSize: 13, color: '#9AA0A6' }}>No notes yet.</div>}
                </div>
              </div>
            </div>

            <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
              {convertError && <div style={{ padding: '10px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>{convertError}</div>}
              {selected.stageKey === 'Won' && !selected.converted && (
                <button onClick={convert} disabled={converting} style={{ width: '100%', boxSizing: 'border-box', background: '#047857', color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {converting && <Spinner size={13} color="#fff" />}Convert to project
                </button>
              )}
              {selected.converted && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontWeight: 700, fontSize: 13.5, padding: '14px 16px', borderRadius: 12 }}>✓ Converted to project</div>
              )}

              <div style={cardStyle}>
                <div style={{ ...cardHeaderStyle, marginBottom: 14 }}>Audit trail</div>
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 640, overflowY: 'auto' }}>
                  {selected.activity.map((a) => (
                    <div key={a.id} style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid #F4F5F7' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: a.dotColor, marginTop: 5, flex: 'none' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, color: '#141719', lineHeight: 1.4 }}>{a.text}</div>
                        <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 3 }}>{a.who} · {a.tsLabel}</div>
                      </div>
                    </div>
                  ))}
                  {selected.activity.length === 0 && <div style={{ fontSize: 13, color: '#9AA0A6' }}>No activity yet.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stageChangeOpen && (
        <div onClick={cancelStageChange} style={{ position: 'fixed', inset: 0, background: 'rgba(20,23,25,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 440, maxWidth: '92vw', borderRadius: 14, padding: '26px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Move to {pendingStage ? OPPORTUNITY_STAGE_META[pendingStage].label : ''}</div>
            <div style={{ fontSize: 12.5, color: '#9AA0A6', marginBottom: 16 }}>from {selected?.stage} · recorded in the audit trail</div>
            <div style={{ fontSize: 12, color: '#454B58', fontWeight: 600, marginBottom: 6 }}>Note / comment (optional)</div>
            <textarea
              value={stageChangeNote}
              onChange={(e) => setStageChangeNote(e.target.value)}
              placeholder="Why is this moving? Any context for the team…"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D2D8DC', borderRadius: 7, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', minHeight: 84, resize: 'vertical' }}
            />
            {stageChangeError && <div style={{ marginTop: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{stageChangeError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={cancelStageChange} disabled={stageChanging} style={{ flex: 1, border: '1px solid #D2D8DC', background: '#fff', padding: 11, borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmStageChange} disabled={stageChanging} style={{ flex: 1, border: 'none', background: '#2563EB', color: '#fff', padding: 11, borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {stageChanging && <Spinner size={12} color="#fff" />}Confirm move
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div
          onClick={() => !creating && setShowAddForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,23,25,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitAddForm}
            style={{ width: 460, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(20,23,25,0.2)' }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add opportunity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Chip label="Qualifying" tone="slate" />
              <span style={{ fontSize: 11.5, color: '#9AA0A6' }}>
                Created {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} by {currentUser?.displayName || 'you'}
              </span>
            </div>

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

            <div style={fieldLabelStyle}>Next action</div>
            <input
              value={form.nextAction}
              onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
              placeholder="e.g. Schedule site visit"
              style={inputStyle}
            />

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

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}
                Add opportunity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
