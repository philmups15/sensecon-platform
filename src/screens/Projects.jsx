import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  toProjectView,
  getSurveys,
  createSurvey,
  toSurveyView,
  getPlants,
  toPlantView,
  STAGE_META,
  SURVEY_STATUS_META,
  canAccess,
} from '../lib/api';
import { projectTabsList, milestones, tasks, subs, risks, budgetLines } from '../lib/mockData';

const STAGE_ENTRIES = Object.entries(STAGE_META);

const linkBtnStyle = {
  padding: '3px 6px',
  border: 'none',
  background: 'transparent',
  color: '#1F6E72',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
};
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const cardStyle = { background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: '20px 22px', marginBottom: 16 };
const cardHeaderStyle = { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };

const EMPTY_FORM = { name: '', customer: '', stage: 'DesignSurvey', projectManager: '', budget: '', actual: '' };
const EMPTY_SURVEY_FORM = { plantName: '', surveyor: '', date: '', status: 'Scheduled', plantId: '' };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function Projects({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'projects', 'write');
  const canWriteSurveys = canAccess(currentUser?.role, 'surveys', 'write');

  const [projects, setProjects] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('tasks');

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

  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [surveyForm, setSurveyForm] = useState(EMPTY_SURVEY_FORM);
  const [creatingSurvey, setCreatingSurvey] = useState(false);
  const [surveyError, setSurveyError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getProjects(), getSurveys(), getPlants()])
      .then(([projectDtos, surveyDtos, plantDtos]) => {
        const views = projectDtos.map(toProjectView);
        setProjects(views);
        setSurveys(surveyDtos.map(toSurveyView));
        setPlants(plantDtos.map(toPlantView));
        setSelectedId((prev) => (views.some((p) => p.entityId === prev) ? prev : (views[0]?.entityId ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load projects.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const refreshSurveys = () => getSurveys().then((dtos) => setSurveys(dtos.map(toSurveyView)));

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading projects…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const detail = projects.find((p) => p.id === selectedId) || projects.find((p) => p.entityId === selectedId);

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
      await createProject({
        name: form.name,
        customer: form.customer,
        stage: form.stage,
        projectManager: form.projectManager,
        budget: Number(form.budget) || 0,
        actual: Number(form.actual) || 0,
      });
      const dtos = await getProjects();
      const views = dtos.map(toProjectView);
      setProjects(views);
      const created = views.find((p) => p.name === form.name) || views[0];
      setSelectedId(created?.entityId ?? null);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const startEditCore = (p) => {
    setCoreDraft({
      name: p.name,
      customer: p.customer,
      stage: p.stageKey,
      projectManager: p.pm,
      budget: p.rawBudget != null ? String(p.rawBudget) : '',
      actual: p.rawActual != null ? String(p.rawActual) : '',
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
      await updateProject(detail.entityId, {
        code: detail.id,
        name: coreDraft.name,
        customer: coreDraft.customer,
        stage: coreDraft.stage,
        projectManager: coreDraft.projectManager,
        budget: Number(coreDraft.budget) || 0,
        actual: Number(coreDraft.actual) || 0,
      });
      const dtos = await getProjects();
      setProjects(dtos.map(toProjectView));
      setEditingCore(false);
    } catch (err) {
      setCoreError(err.message || 'Failed to save changes.');
    } finally {
      setSavingCore(false);
    }
  };

  const removeProject = async (p) => {
    if (!window.confirm(`Delete project ${p.name}? This cannot be undone.`)) return;
    setDeletingId(p.entityId);
    setDeleteError('');
    try {
      await deleteProject(p.entityId);
      setProjects((prev) => prev.filter((item) => item.entityId !== p.entityId));
      if (selectedId === p.entityId || selectedId === p.id) {
        setSelectedId((prev) => {
          const remaining = projects.filter((item) => item.entityId !== p.entityId);
          return remaining[0]?.entityId ?? null;
        });
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  const openSurveyForm = () => {
    const linkedPlant = detail ? plants.find((pl) => pl.projectId === detail.entityId) : null;
    setSurveyForm({ ...EMPTY_SURVEY_FORM, plantName: linkedPlant?.name || detail?.name || '', plantId: linkedPlant?.id || '', date: todayInputValue() });
    setSurveyError('');
    setShowSurveyForm(true);
  };
  const submitSurveyForm = async (e) => {
    e.preventDefault();
    if (!detail || !surveyForm.plantName.trim()) {
      setSurveyError('Plant / site name is required.');
      return;
    }
    setCreatingSurvey(true);
    setSurveyError('');
    try {
      await createSurvey({
        plantName: surveyForm.plantName,
        surveyor: surveyForm.surveyor,
        date: surveyForm.date ? new Date(surveyForm.date).toISOString() : new Date().toISOString(),
        status: surveyForm.status,
        progress: 0,
        projectId: detail.entityId,
        plantId: surveyForm.plantId || null,
      });
      await refreshSurveys();
      setShowSurveyForm(false);
    } catch (err) {
      setSurveyError(err.message || 'Failed to create site survey.');
    } finally {
      setCreatingSurvey(false);
    }
  };

  const linkedSurveys = detail ? surveys.filter((s) => s.projectId === detail.entityId) : [];
  const linkedPlants = detail ? plants.filter((pl) => pl.projectId === detail.entityId) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        {canWrite && (
          <button onClick={openAddForm} style={primaryBtnStyle}>+ Add project</button>
        )}
      </div>

      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {projects.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No projects yet.</div>}

      {projects.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.3fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
            <div>Project</div><div>Stage</div><div>PM</div><div>Budget</div><div>Actual</div><div>Actions</div>
          </div>
          {projects.map((p) => (
            <div key={p.entityId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.3fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}>
              <div onClick={() => setSelectedId(p.entityId)} style={{ fontWeight: 600, color: '#12201F', cursor: 'pointer' }}>{p.name}</div>
              <div><Chip label={p.stage} tone={p.tone} /></div>
              <div>{p.pm || '—'}</div><div>{p.budget}</div><div>{p.actual}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setSelectedId(p.entityId)} style={linkBtnStyle}>View</button>
                {canWrite && <button type="button" onClick={() => { setSelectedId(p.entityId); startEditCore(p); }} style={linkBtnStyle}>Edit</button>}
                {canWrite && (deletingId === p.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeProject(p)} style={dangerBtnStyle}>Delete</button>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingCore ? 16 : 4 }}>
            <div>
              {!editingCore && <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.name}</div>}
              <div style={{ fontSize: 12, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', marginTop: 2 }}>{detail.id}</div>
            </div>
            {canWrite && !editingCore && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>
                {deletingId === detail.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeProject(detail)} style={dangerBtnStyle}>Delete</button>}
              </div>
            )}
            {editingCore && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={cancelEditCore} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {savingCore && <Spinner size={11} color="#fff" />}Save
                </button>
              </div>
            )}
          </div>

          {coreError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}

          {editingCore ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div>
                <div style={fieldLabelStyle}>Name</div>
                <input value={coreDraft.name ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, name: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Customer</div>
                <input value={coreDraft.customer ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, customer: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Stage</div>
                <select value={coreDraft.stage ?? 'DesignSurvey'} onChange={(e) => setCoreDraft((d) => ({ ...d, stage: e.target.value }))} style={smallInputStyle}>
                  {STAGE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Project manager</div>
                <input value={coreDraft.projectManager ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, projectManager: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Budget ($)</div>
                <input type="number" min="0" step="any" value={coreDraft.budget ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, budget: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Actual ($)</div>
                <input type="number" min="0" step="any" value={coreDraft.actual ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, actual: e.target.value }))} style={smallInputStyle} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{detail.customer || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Stage</div>
                <Chip label={detail.stage} tone={detail.tone} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Project manager</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{detail.pm || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Budget / Actual</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{detail.budget} / {detail.actual}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {detail && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={cardHeaderStyle}>Site survey</div>
            {canWriteSurveys && <button onClick={openSurveyForm} style={linkBtnStyle}>+ New site survey</button>}
          </div>
          {linkedSurveys.length === 0 && <div style={{ fontSize: 13, color: '#78908A' }}>No site surveys linked to this project yet.</div>}
          {linkedSurveys.map((s) => {
            const meta = SURVEY_STATUS_META[s.statusKey] || SURVEY_STATUS_META.Scheduled;
            return (
              <div key={s.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.plant}</div>
                  <div style={{ fontSize: 11.5, color: '#78908A' }}>{s.id} · surveyor {s.surveyor || '—'} · {s.date}</div>
                </div>
                <Chip label={meta.label} tone={meta.tone} />
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>Plant</div>
          {linkedPlants.length === 0 && (
            <div style={{ fontSize: 13, color: '#78908A', marginTop: 10 }}>No plant linked to this project yet.</div>
          )}
          {linkedPlants.map((pl) => (
            <div key={pl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13, marginTop: 10 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{pl.name}</div>
                <div style={{ fontSize: 11.5, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{pl.code}</div>
              </div>
              <Chip label={pl.stageLabel} tone={pl.tone} />
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', margin: '4px 0 16px' }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: m.bg, border: `2px solid ${m.color}` }} />
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: '#52685F', textAlign: 'center' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #D7E4E1', marginBottom: 14 }}>
            {projectTabsList.map(([key, label]) => {
              const active = tab === key;
              const color = active ? '#12484B' : '#78908A';
              return (
                <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                  {label}
                </div>
              );
            })}
          </div>

          {tab === 'tasks' && tasks.map((tk, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{tk.name}</div>
                <div style={{ fontSize: 11.5, color: '#78908A' }}>{tk.owner} · due {tk.due}</div>
              </div>
              <Chip label={tk.status} tone={tk.tone} />
            </div>
          ))}

          {tab === 'subs' && subs.map((sb, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{sb.name}</div>
                <div style={{ fontSize: 11.5, color: '#78908A' }}>{sb.scope}</div>
              </div>
              <Chip label={sb.status} tone={sb.tone} />
            </div>
          ))}

          {tab === 'budget' && budgetLines.map((bl, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52685F', marginBottom: 4 }}>
                <span>{bl.label}</span>
                <span>${bl.actual} / ${bl.budget}</span>
              </div>
              <div style={{ height: 7, background: '#E9F1EF', borderRadius: 999 }}>
                <div style={{ height: 7, width: '70%', background: '#1F6E72', borderRadius: 999 }} />
              </div>
            </div>
          ))}

          {tab === 'risk' && risks.map((rk, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #E9F1EF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{rk.risk}</div>
                <Chip label={rk.severity} tone={rk.tone} />
              </div>
              <div style={{ fontSize: 11.5, color: '#78908A', marginTop: 3 }}>{rk.mitigation}</div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 460, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add project</div>

            <div style={fieldLabelStyle}>Name *</div>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />

            <div style={fieldLabelStyle}>Customer</div>
            <input value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Stage</div>
                <select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} style={inputStyle}>
                  {STAGE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Project manager</div>
                <input value={form.projectManager} onChange={(e) => setForm((f) => ({ ...f, projectManager: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Budget ($)</div>
                <input type="number" min="0" step="any" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Actual ($)</div>
                <input type="number" min="0" step="any" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add project
              </button>
            </div>
          </form>
        </div>
      )}

      {showSurveyForm && (
        <div onClick={() => !creatingSurvey && setShowSurveyForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitSurveyForm} style={{ width: 420, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>New site survey</div>
            <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 16 }}>Linked to {detail?.name}</div>

            <div style={fieldLabelStyle}>Plant / site name *</div>
            <input value={surveyForm.plantName} onChange={(e) => setSurveyForm((f) => ({ ...f, plantName: e.target.value }))} required style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Surveyor</div>
                <input value={surveyForm.surveyor} onChange={(e) => setSurveyForm((f) => ({ ...f, surveyor: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Date</div>
                <input type="date" value={surveyForm.date} onChange={(e) => setSurveyForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={fieldLabelStyle}>Status</div>
            <select value={surveyForm.status} onChange={(e) => setSurveyForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {Object.entries(SURVEY_STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>

            {surveyError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{surveyError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowSurveyForm(false)} disabled={creatingSurvey} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creatingSurvey} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creatingSurvey ? 'default' : 'pointer', opacity: creatingSurvey ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creatingSurvey && <Spinner size={12} color="#fff" />}Add survey
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
