import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getDesigns,
  getDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
  toDesignView,
  getProjects,
  toProjectView,
  getSurveys,
  toSurveyView,
  canAccess,
  DESIGN_STATUS_META,
  uploadDesignAttachments,
  downloadDesignAttachment,
  addDesignRevision,
  updateDesignSpecs,
} from '../lib/api';
import { designTabs } from '../lib/mockData';

const STATUS_ENTRIES = Object.entries(DESIGN_STATUS_META);

const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };

const EMPTY_FORM = { projectId: '', surveyId: '', projectName: '', status: 'InReview', revision: '' };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function Design({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'designs', 'write');

  const [designs, setDesigns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('array');

  const [full, setFull] = useState(null); // GetDesignById result: specs / attachments / revisions
  const [specDraft, setSpecDraft] = useState([]); // [[key,value], ...] for the active tab
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [specError, setSpecError] = useState('');

  const [revNote, setRevNote] = useState('');
  const [revLabel, setRevLabel] = useState('');
  const [savingRev, setSavingRev] = useState(false);

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

  const load = () => {
    setLoading(true);
    Promise.all([getDesigns(), getProjects(), getSurveys()])
      .then(([designDtos, projectDtos, surveyDtos]) => {
        const views = designDtos.map(toDesignView);
        setDesigns(views);
        setProjects(projectDtos.map(toProjectView));
        setSurveys(surveyDtos.map(toSurveyView));
        setSelectedId((prev) => (views.some((d) => d.entityId === prev) ? prev : (views[0]?.entityId ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load designs.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const detail = designs.find((d) => d.entityId === selectedId) || designs[0];

  const loadFull = (id) => { if (id) getDesignById(id).then(setFull).catch(() => setFull(null)); };
  useEffect(() => { setFull(null); setEditingCore(false); if (detail) loadFull(detail.entityId); }, [detail?.entityId]);
  const refreshFull = () => detail && loadFull(detail.entityId);

  // Sync the spec editor rows when the tab or the loaded design changes.
  useEffect(() => {
    const specs = (full?.specs && full.specs[tab]) || {};
    setSpecDraft(Object.entries(specs));
    setSpecError('');
  }, [tab, full]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading designs…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const refresh = () => getDesigns().then((dtos) => setDesigns(dtos.map(toDesignView)));

  const openAddForm = () => { setForm(EMPTY_FORM); setCreateError(''); setShowAddForm(true); };

  const pickProject = (setter) => (e) => {
    const projectId = e.target.value;
    const project = projects.find((p) => p.entityId === projectId);
    setter((f) => ({ ...f, projectId, projectName: project ? project.name : f.projectName }));
  };
  const pickSurvey = (setter) => (e) => {
    const surveyId = e.target.value;
    const survey = surveys.find((s) => s.entityId === surveyId);
    setter((f) => {
      if (f.projectId || !survey?.projectId) return { ...f, surveyId };
      const project = projects.find((p) => p.entityId === survey.projectId);
      return { ...f, surveyId, projectId: survey.projectId, projectName: project ? project.name : f.projectName };
    });
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) { setCreateError('Project name is required — pick a project or type one.'); return; }
    setCreating(true); setCreateError('');
    try {
      const id = await createDesign({
        projectName: form.projectName, status: form.status, revision: form.revision,
        surveyId: form.surveyId || null, projectId: form.projectId || null,
      });
      await refresh(); setSelectedId(id); setShowAddForm(false);
    } catch (err) { setCreateError(err.message || 'Failed to create design.'); }
    finally { setCreating(false); }
  };

  const startEditCore = (d) => {
    setCoreDraft({ projectId: d.projectId || '', surveyId: d.surveyId || '', projectName: d.project, status: d.statusKey, revision: d.rev });
    setCoreError(''); setEditingCore(true);
  };
  const saveCore = async () => {
    if (!detail) return;
    setSavingCore(true); setCoreError('');
    try {
      await updateDesign(detail.entityId, {
        projectName: coreDraft.projectName, status: coreDraft.status, revision: coreDraft.revision,
        surveyId: coreDraft.surveyId || null, projectId: coreDraft.projectId || null,
      });
      await refresh(); refreshFull(); setEditingCore(false);
    } catch (err) { setCoreError(err.message || 'Failed to save changes.'); }
    finally { setSavingCore(false); }
  };

  const removeDesign = async (d) => {
    if (!window.confirm(`Delete design ${d.id}? This cannot be undone.`)) return;
    setDeletingId(d.entityId); setDeleteError('');
    try {
      await deleteDesign(d.entityId);
      const remaining = designs.filter((item) => item.entityId !== d.entityId);
      setDesigns(remaining);
      if (selectedId === d.entityId) setSelectedId(remaining[0]?.entityId ?? null);
    } catch (err) { setDeleteError(err.message || 'Failed to delete design.'); }
    finally { setDeletingId(null); }
  };

  const saveSpecs = async () => {
    setSavingSpecs(true); setSpecError('');
    try {
      const fields = {};
      for (const [k, v] of specDraft) { if (k.trim()) fields[k.trim()] = v; }
      await updateDesignSpecs(detail.entityId, tab, fields);
      refreshFull();
    } catch (err) { setSpecError(err.message || 'Failed to save spec fields.'); }
    finally { setSavingSpecs(false); }
  };

  const addRevision = async () => {
    if (!revLabel.trim()) return;
    setSavingRev(true);
    try {
      await addDesignRevision(detail.entityId, revLabel.trim(), revNote.trim() || null);
      setRevNote(''); setRevLabel('');
      await refresh(); refreshFull();
    } catch (err) { setSpecError(err.message || 'Failed to add revision.'); }
    finally { setSavingRev(false); }
  };

  const uploadAtt = async (files) => {
    try { await uploadDesignAttachments(detail.entityId, files, files[0].name.replace(/\.[^/.]+$/, '')); refreshFull(); }
    catch (err) { setSpecError(err.message || 'Upload failed.'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add design</button>}
      </div>

      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}
      {designs.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No designs yet.</div>}

      {designs.length > 0 && detail && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 260px', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
            {designs.map((d) => (
              <div key={d.entityId} onClick={() => setSelectedId(d.entityId)} style={{ padding: '13px 16px', borderBottom: '1px solid #E9F1EF', cursor: 'pointer', background: d.entityId === selectedId ? '#E4F0EF' : 'transparent' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.project}</div>
                <div style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 7px' }}>{d.id} · Rev {d.rev}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip label={d.status} tone={d.tone} />
                  {canWrite && (deletingId === d.entityId ? <Spinner size={11} /> : <button type="button" onClick={(e) => { e.stopPropagation(); removeDesign(d); }} style={dangerBtnStyle}>Delete</button>)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {!editingCore && <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.project}</div>}
              {canWrite && !editingCore && <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>}
              {editingCore && (
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                  <button onClick={() => setEditingCore(false)} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                  <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {savingCore && <Spinner size={11} color="#fff" />}Save
                  </button>
                </div>
              )}
            </div>

            {coreError && <div style={{ marginTop: 10, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}

            {editingCore ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <div style={fieldLabelStyle}>Project</div>
                  <select value={coreDraft.projectId ?? ''} onChange={pickProject(setCoreDraft)} style={smallInputStyle}>
                    <option value="">— None —</option>
                    {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={fieldLabelStyle}>Survey</div>
                  <select value={coreDraft.surveyId ?? ''} onChange={pickSurvey(setCoreDraft)} style={smallInputStyle}>
                    <option value="">— None —</option>
                    {surveys.map((s) => <option key={s.entityId} value={s.entityId}>{s.id} · {s.plant}</option>)}
                  </select>
                </div>
                <div>
                  <div style={fieldLabelStyle}>Project name label</div>
                  <input value={coreDraft.projectName ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, projectName: e.target.value }))} style={smallInputStyle} />
                </div>
                <div>
                  <div style={fieldLabelStyle}>Revision</div>
                  <input value={coreDraft.revision ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, revision: e.target.value }))} style={smallInputStyle} />
                </div>
                <div>
                  <div style={fieldLabelStyle}>Status</div>
                  <select value={coreDraft.status ?? 'InReview'} onChange={(e) => setCoreDraft((d) => ({ ...d, status: e.target.value }))} style={smallInputStyle}>
                    {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              detail.survey !== '—' && (
                <div style={{ marginTop: 8, padding: '9px 12px', background: '#E4F0EF', borderRadius: 8, fontSize: 12, color: '#12484B' }}>
                  Linked to survey <b>{detail.survey}</b>
                </div>
              )
            )}

            {!editingCore && (
              <>
                <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: '1px solid #D7E4E1' }}>
                  {designTabs.map(([key, label]) => {
                    const active = tab === key;
                    const color = active ? '#12484B' : '#78908A';
                    return (
                      <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${active ? color : 'transparent'}` }}>
                        {label}
                      </div>
                    );
                  })}
                </div>

                {!full ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', fontSize: 12.5, color: '#78908A' }}><Spinner size={12} />Loading…</div>
                ) : (
                  <div style={{ marginTop: 14 }}>
                    {specError && <div style={{ marginBottom: 10, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{specError}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {specDraft.map(([k, v], i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={k} readOnly={!canWrite} placeholder="Field"
                            onChange={(e) => setSpecDraft((rows) => rows.map((r, ri) => (ri === i ? [e.target.value, r[1]] : r)))}
                            style={{ ...smallInputStyle, flex: 1 }} />
                          <input value={v} readOnly={!canWrite} placeholder="Value"
                            onChange={(e) => setSpecDraft((rows) => rows.map((r, ri) => (ri === i ? [r[0], e.target.value] : r)))}
                            style={{ ...smallInputStyle, flex: 1.4 }} />
                          {canWrite && <button type="button" onClick={() => setSpecDraft((rows) => rows.filter((_, ri) => ri !== i))} style={dangerBtnStyle}>×</button>}
                        </div>
                      ))}
                      {specDraft.length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No fields for this tab yet.</div>}
                    </div>
                    {canWrite && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                        <button type="button" onClick={() => setSpecDraft((rows) => [...rows, ['', '']])} style={linkBtnStyle}>+ Add field</button>
                        <button type="button" onClick={saveSpecs} disabled={savingSpecs} style={{ ...primaryBtnStyle, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {savingSpecs && <Spinner size={11} color="#fff" />}Save {designTabs.find(([k]) => k === tab)?.[1]}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Attachments</div>
                {canWrite && (
                  <label style={{ ...linkBtnStyle, cursor: 'pointer' }}>
                    + file
                    <input type="file" multiple style={{ display: 'none' }} onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) uploadAtt(f); }} />
                  </label>
                )}
              </div>
              {!full ? <Spinner size={12} /> : (full.attachments || []).length === 0 ? (
                <div style={{ fontSize: 12, color: '#78908A' }}>None.</div>
              ) : (full.attachments || []).map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, borderBottom: '1px solid #E9F1EF' }}>
                  <button type="button" onClick={() => downloadDesignAttachment(detail.entityId, a.id, a.fileName)} style={{ border: 'none', background: 'transparent', color: '#1F6E72', fontWeight: 600, cursor: 'pointer', fontSize: 12, textAlign: 'left', flex: 1 }}>{a.title}</button>
                  <span style={{ color: '#78908A', fontSize: 10.5 }}>v{a.version}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Revision history</div>
              {!full ? <Spinner size={12} /> : (full.revisions || []).length === 0 ? (
                <div style={{ fontSize: 12, color: '#78908A' }}>No revisions recorded.</div>
              ) : (full.revisions || []).map((r) => (
                <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #E9F1EF' }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    Rev {r.revision} <span style={{ fontWeight: 500, color: '#78908A' }}>· {fmtDate(r.created)}{r.changedByName ? ` · ${r.changedByName}` : ''}</span>
                  </div>
                  {r.note && <div style={{ fontSize: 11.5, color: '#52685F', marginTop: 2 }}>{r.note}</div>}
                </div>
              ))}
              {canWrite && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={revLabel} onChange={(e) => setRevLabel(e.target.value)} placeholder="New revision (e.g. D)" style={smallInputStyle} />
                  <input value={revNote} onChange={(e) => setRevNote(e.target.value)} placeholder="Note (optional)" style={smallInputStyle} />
                  <button type="button" onClick={addRevision} disabled={savingRev || !revLabel.trim()} style={{ ...primaryBtnStyle, padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {savingRev && <Spinner size={11} color="#fff" />}Add revision
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 440, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add design</div>

            <div style={fieldLabelStyle}>Project</div>
            <select value={form.projectId} onChange={pickProject(setForm)} style={inputStyle}>
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
            </select>

            <div style={fieldLabelStyle}>Survey</div>
            <select value={form.surveyId} onChange={pickSurvey(setForm)} style={inputStyle}>
              <option value="">— None —</option>
              {surveys.map((s) => <option key={s.entityId} value={s.entityId}>{s.id} · {s.plant}</option>)}
            </select>

            <div style={fieldLabelStyle}>Project name label *</div>
            <input value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} placeholder="Filled from Project, or type one" required style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Revision</div>
                <input value={form.revision} onChange={(e) => setForm((f) => ({ ...f, revision: e.target.value }))} placeholder="e.g. A" style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Status</div>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
            </div>

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add design
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
