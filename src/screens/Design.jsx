import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getDesigns,
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
} from '../lib/api';
import { designTabs, designFieldsByTab, revisions, attachments } from '../lib/mockData';

const STATUS_ENTRIES = Object.entries(DESIGN_STATUS_META);

const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };

const EMPTY_FORM = { projectId: '', surveyId: '', projectName: '', status: 'InReview', revision: '' };

export default function Design({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'designs', 'write');

  const [designs, setDesigns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('array');

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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading designs…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const detail = designs.find((d) => d.entityId === selectedId) || designs[0];
  const fields = designFieldsByTab[tab] || [];

  const refresh = () => getDesigns().then((dtos) => setDesigns(dtos.map(toDesignView)));

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setCreateError('');
    setShowAddForm(true);
  };

  // Picking a project fills the project-name label directly; picking a survey
  // (when no project is chosen yet) inherits that survey's linked project.
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
    if (!form.projectName.trim()) {
      setCreateError('Project name is required — pick a project or type one.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const id = await createDesign({
        projectName: form.projectName,
        status: form.status,
        revision: form.revision,
        surveyId: form.surveyId || null,
        projectId: form.projectId || null,
      });
      await refresh();
      setSelectedId(id);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create design.');
    } finally {
      setCreating(false);
    }
  };

  const startEditCore = (d) => {
    setCoreDraft({
      projectId: d.projectId || '',
      surveyId: d.surveyId || '',
      projectName: d.project,
      status: d.statusKey,
      revision: d.rev,
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
      await updateDesign(detail.entityId, {
        projectName: coreDraft.projectName,
        status: coreDraft.status,
        revision: coreDraft.revision,
        surveyId: coreDraft.surveyId || null,
        projectId: coreDraft.projectId || null,
      });
      await refresh();
      setEditingCore(false);
    } catch (err) {
      setCoreError(err.message || 'Failed to save changes.');
    } finally {
      setSavingCore(false);
    }
  };

  const removeDesign = async (d) => {
    if (!window.confirm(`Delete design ${d.id}? This cannot be undone.`)) return;
    setDeletingId(d.entityId);
    setDeleteError('');
    try {
      await deleteDesign(d.entityId);
      const remaining = designs.filter((item) => item.entityId !== d.entityId);
      setDesigns(remaining);
      if (selectedId === d.entityId) setSelectedId(remaining[0]?.entityId ?? null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete design.');
    } finally {
      setDeletingId(null);
    }
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
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 240px', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
            {designs.map((d) => (
              <div key={d.entityId} onClick={() => setSelectedId(d.entityId)} style={{ padding: '13px 16px', borderBottom: '1px solid #E9F1EF', cursor: 'pointer', background: d.entityId === selectedId ? '#E4F0EF' : 'transparent' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.project}</div>
                <div style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 7px' }}>
                  {d.id} · Rev {d.rev}
                </div>
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
                  <button onClick={cancelEditCore} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
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
                  Linked to survey <b>{detail.survey}</b> — findings drive these values
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
                      <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                        {label}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {fields.map(([f, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                      <span style={{ color: '#52685F' }}>{f}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Attachments</div>
              {attachments.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, color: '#52685F' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: '#F4F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: '#52685F' }}>
                    {a.ext}
                  </span>
                  {a.name}
                </div>
              ))}
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Revision history</div>
              {revisions.map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E9F1EF' }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    Rev {r.rev} <span style={{ fontWeight: 500, color: '#78908A' }}>· {r.date}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#52685F', marginTop: 2 }}>{r.note}</div>
                </div>
              ))}
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
