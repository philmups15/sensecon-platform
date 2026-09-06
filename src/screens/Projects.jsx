import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import Surveys from './Surveys';
import Design from './Design';
import Bom from './Bom';
import Plants from './Plants';
import Commissioning from './Commissioning';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  toProjectView,
  STAGE_META,
  canAccess,
  projectMilestones, projectTasks, projectSubcontractors, projectRisks, projectBudgetLines,
  MILESTONE_STATE_META, PROJECT_TASK_STATUS_META, SUBCONTRACTOR_STATUS_META,
  RISK_SEVERITY_META, RISK_STATUS_META, BOM_CATEGORY_META,
} from '../lib/api';

const STAGE_ENTRIES = Object.entries(STAGE_META);
const MILESTONE_CYCLE = { Upcoming: 'Current', Current: 'Done', Done: 'Upcoming' };
const BOM_CATEGORY_ENTRIES = Object.entries(BOM_CATEGORY_META);
const money = (n) => `$${Number(n || 0).toLocaleString()}`;

const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const smallInputStyle_ = { boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '5px 7px', fontSize: 12, fontFamily: 'inherit' };

const EMPTY_FORM = { name: '', customer: '', stage: 'DesignSurvey', projectManager: '', budget: '', actual: '' };

function Section({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

// Generic inline add-row: `fields` is [{key,label,type?,options?,default?,flex?}]
function InlineAdd({ fields, onAdd, label = 'Add' }) {
  const init = () => Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']));
  const [v, setV] = useState(init);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div style={{ borderTop: '1px dashed #D7E4E1', paddingTop: 10, marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {fields.map((f) => f.options ? (
          <select key={f.key} value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            style={{ flex: f.flex || 1, minWidth: 110, boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'inherit' }}>
            {f.options.map(([ok, ol]) => <option key={ok} value={ok}>{ol}</option>)}
          </select>
        ) : (
          <input key={f.key} type={f.type || 'text'} placeholder={f.label} value={v[f.key]}
            step={f.type === 'number' ? 'any' : undefined}
            onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            style={{ flex: f.flex || 1, minWidth: 110, boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'inherit' }} />
        ))}
        <button type="button" disabled={busy}
          onClick={async () => {
            setBusy(true); setErr('');
            try { await onAdd(v); setV(init()); }
            catch (e) { setErr(e.message || 'Failed.'); }
            finally { setBusy(false); }
          }}
          style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {busy ? '…' : label}
        </button>
      </div>
      {err && <div style={{ marginTop: 6, color: '#A6362E', fontSize: 11.5 }}>{err}</div>}
    </div>
  );
}

export default function Projects({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'projects', 'write');
  const canReadPlants = canAccess(currentUser?.role, 'plants', 'read');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [full, setFull] = useState(null); // GetProjectById: milestones/tasks/subs/risks/budgetLines
  const [childError, setChildError] = useState('');
  const [childBusy, setChildBusy] = useState(false);
  const [dataSignal, setDataSignal] = useState(0); // bumped by an embedded section so its siblings re-fetch
  const bump = () => setDataSignal((n) => n + 1);

  const [editingCore, setEditingCore] = useState(false);
  const [coreDraft, setCoreDraft] = useState({});
  const [savingCore, setSavingCore] = useState(false);
  const [coreError, setCoreError] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    getProjects()
      .then((dtos) => setProjects(dtos.map(toProjectView)))
      .catch((err) => setError(err.message || 'Failed to load projects.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const detail = projects.find((p) => p.entityId === selectedId);

  const loadFull = (id) => { if (id) getProjectById(id).then(setFull).catch(() => setFull(null)); };
  useEffect(() => {
    setFull(null); setChildError(''); setEditingCore(false);
    if (detail) loadFull(detail.entityId);
  }, [detail?.entityId]);

  const childAction = async (fn) => {
    setChildBusy(true); setChildError('');
    try { await fn(); await loadFull(detail.entityId); }
    catch (err) { setChildError(err.message || 'Action failed.'); }
    finally { setChildBusy(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading projects…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  // ---- project CRUD ----
  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setCreateError('Name is required.'); return; }
    setCreating(true); setCreateError('');
    try {
      await createProject({
        name: form.name, customer: form.customer, stage: form.stage,
        projectManager: form.projectManager,
        budget: Number(form.budget) || 0, actual: Number(form.actual) || 0,
      });
      const views = (await getProjects()).map(toProjectView);
      setProjects(views);
      setSelectedId((views.find((p) => p.name === form.name) || views[0])?.entityId ?? null);
      setShowAddForm(false); setForm(EMPTY_FORM);
    } catch (err) { setCreateError(err.message || 'Failed to create project.'); }
    finally { setCreating(false); }
  };

  const startEditCore = (p) => {
    setCoreDraft({
      name: p.name, customer: p.customer, stage: p.stageKey, projectManager: p.pm,
      budget: p.rawBudget != null ? String(p.rawBudget) : '',
      actual: p.rawActual != null ? String(p.rawActual) : '',
    });
    setCoreError(''); setEditingCore(true);
  };
  const saveCore = async () => {
    if (!detail) return;
    setSavingCore(true); setCoreError('');
    try {
      await updateProject(detail.entityId, {
        code: detail.id, name: coreDraft.name, customer: coreDraft.customer,
        stage: coreDraft.stage, projectManager: coreDraft.projectManager,
        budget: Number(coreDraft.budget) || 0, actual: Number(coreDraft.actual) || 0,
      });
      setProjects((await getProjects()).map(toProjectView));
      setEditingCore(false);
    } catch (err) { setCoreError(err.message || 'Failed to save changes.'); }
    finally { setSavingCore(false); }
  };

  const removeProject = async (p) => {
    if (!window.confirm(`Delete project ${p.name}? This cannot be undone.`)) return;
    setDeletingId(p.entityId); setDeleteError('');
    try {
      await deleteProject(p.entityId);
      setProjects((prev) => prev.filter((item) => item.entityId !== p.entityId));
      if (selectedId === p.entityId) setSelectedId(null);
    } catch (err) { setDeleteError(err.message || 'Failed to delete project.'); }
    finally { setDeletingId(null); }
  };

  // ============ LIST VIEW ============
  if (!detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }} />
          {canWrite && <button onClick={() => { setForm(EMPTY_FORM); setCreateError(''); setShowAddForm(true); }} style={primaryBtnStyle}>+ Add project</button>}
        </div>

        {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}
        {projects.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No projects yet.</div>}

        {projects.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
              <div>Project</div><div>Stage</div><div>PM</div><div>Budget</div><div>Actual</div><div>Actions</div>
            </div>
            {projects.map((p) => (
              <div key={p.entityId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.1fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}>
                <div onClick={() => setSelectedId(p.entityId)} style={{ fontWeight: 600, color: '#12201F', cursor: 'pointer' }}>{p.name}</div>
                <div><Chip label={p.stage} tone={p.tone} /></div>
                <div>{p.pm || '—'}</div><div>{p.budget}</div><div>{p.actual}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setSelectedId(p.entityId)} style={linkBtnStyle}>Open</button>
                  {canWrite && (deletingId === p.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeProject(p)} style={dangerBtnStyle}>Delete</button>)}
                </div>
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
                <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {creating && <Spinner size={12} color="#fff" />}Add project
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  const eid = detail.entityId;
  const pname = detail.name;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" onClick={() => setSelectedId(null)} style={{ ...linkBtnStyle, alignSelf: 'flex-start', fontSize: 12.5, padding: '4px 0' }}>← All projects</button>

      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {/* Header + Overview */}
      <Section title="Overview">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            {!editingCore && <div style={{ fontSize: 16, fontWeight: 800 }}>{detail.name}</div>}
            <div style={{ fontSize: 12, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', marginTop: 2 }}>{detail.id}</div>
          </div>
          {canWrite && !editingCore && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>
              {deletingId === eid ? <Spinner size={12} /> : <button type="button" onClick={() => removeProject(detail)} style={dangerBtnStyle}>Delete</button>}
            </div>
          )}
          {editingCore && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingCore(false)} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
              <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {savingCore && <Spinner size={11} color="#fff" />}Save
              </button>
            </div>
          )}
        </div>

        {coreError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}

        {editingCore ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={fieldLabelStyle}>Name</div><input value={coreDraft.name ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, name: e.target.value }))} style={smallInputStyle} /></div>
            <div><div style={fieldLabelStyle}>Customer</div><input value={coreDraft.customer ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, customer: e.target.value }))} style={smallInputStyle} /></div>
            <div><div style={fieldLabelStyle}>Stage</div>
              <select value={coreDraft.stage ?? 'DesignSurvey'} onChange={(e) => setCoreDraft((d) => ({ ...d, stage: e.target.value }))} style={smallInputStyle}>
                {STAGE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select></div>
            <div><div style={fieldLabelStyle}>Project manager</div><input value={coreDraft.projectManager ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, projectManager: e.target.value }))} style={smallInputStyle} /></div>
            <div><div style={fieldLabelStyle}>Budget ($)</div><input type="number" min="0" step="any" value={coreDraft.budget ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, budget: e.target.value }))} style={smallInputStyle} /></div>
            <div><div style={fieldLabelStyle}>Actual ($)</div><input type="number" min="0" step="any" value={coreDraft.actual ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, actual: e.target.value }))} style={smallInputStyle} /></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            <div><div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Customer</div><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.customer || '—'}</div></div>
            <div><div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Stage</div><Chip label={detail.stage} tone={detail.tone} /></div>
            <div><div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Project manager</div><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.pm || '—'}</div></div>
            <div><div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 5 }}>Budget / Actual</div><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.budget} / {detail.actual}</div></div>
          </div>
        )}

        {/* Milestone timeline */}
        {full && (full.milestones || []).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', margin: '18px 0 4px' }}>
            {[...full.milestones].sort((a, b) => a.order - b.order).map((m) => {
              const bg = m.state === 'Done' ? '#1F6E72' : m.state === 'Current' ? '#8FC7C0' : '#E9F1EF';
              const meta = MILESTONE_STATE_META[m.state] || MILESTONE_STATE_META.Upcoming;
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div title={meta.label} style={{ width: 20, height: 20, borderRadius: 999, background: bg, border: '2px solid #1F6E72' }} />
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: '#52685F', textAlign: 'center' }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {childError && <div style={{ marginTop: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{childError}</div>}

        {/* Milestone list + add */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52685F', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Milestones</div>
          {!full ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#78908A' }}><Spinner size={12} />Loading…</div> : (
            <>
              {(full.milestones || []).length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No milestones yet.</div>}
              {[...full.milestones].sort((a, b) => a.order - b.order).map((m) => {
                const meta = MILESTONE_STATE_META[m.state] || MILESTONE_STATE_META.Upcoming;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                    <div><span style={{ fontWeight: 600 }}>{m.label}</span> <span style={{ color: '#78908A', fontSize: 11.5 }}>#{m.order}</span></div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button type="button" disabled={!canWrite || childBusy}
                        onClick={() => childAction(() => projectMilestones.update(eid, m.id, { label: m.label, state: MILESTONE_CYCLE[m.state], order: m.order }))}
                        style={{ border: 'none', background: 'transparent', cursor: canWrite ? 'pointer' : 'default', padding: 0 }}>
                        <Chip label={meta.label} tone={meta.tone} />
                      </button>
                      {canWrite && <button type="button" onClick={() => childAction(() => projectMilestones.remove(eid, m.id))} style={dangerBtnStyle}>Delete</button>}
                    </div>
                  </div>
                );
              })}
              {canWrite && (
                <InlineAdd
                  fields={[
                    { key: 'label', label: 'Milestone', flex: 2 },
                    { key: 'order', label: 'Order', type: 'number', default: String((full.milestones || []).length), flex: 0.6 },
                    { key: 'state', label: 'State', options: Object.entries(MILESTONE_STATE_META).map(([k, v]) => [k, v.label]), default: 'Upcoming' },
                  ]}
                  onAdd={(v) => v.label.trim() && childAction(() => projectMilestones.add(eid, { label: v.label, state: v.state, order: Number(v.order) || 0 }))}
                />
              )}
            </>
          )}
        </div>
      </Section>

      {canReadPlants && (
        <Section title="Plant">
          <Plants key={`plt-${eid}-${dataSignal}`} projectScopeId={eid} projectName={pname} currentUser={currentUser} onChanged={bump} />
        </Section>
      )}

      <Section title="Site surveys">
        <Surveys key={`srv-${eid}-${dataSignal}`} projectScopeId={eid} projectName={pname} currentUser={currentUser} onChanged={bump} />
      </Section>

      <Section title="Design">
        <Design key={`dsn-${eid}-${dataSignal}`} projectScopeId={eid} projectName={pname} currentUser={currentUser} onChanged={bump} />
      </Section>

      <Section title="Bill of materials">
        <Bom key={`bom-${eid}-${dataSignal}`} projectScopeId={eid} projectName={pname} currentUser={currentUser} onChanged={bump} />
      </Section>

      {canReadPlants && (
        <Section title="Commissioning & handover">
          <Commissioning key={`comm-${eid}-${dataSignal}`} projectScopeId={eid} currentUser={currentUser} />
        </Section>
      )}

      {/* Tasks */}
      <Section title="Tasks">
        {!full ? <Spinner size={12} /> : (
          <>
            {(full.tasks || []).length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No tasks yet.</div>}
            {(full.tasks || []).map((tk) => {
              const meta = PROJECT_TASK_STATUS_META[tk.status] || PROJECT_TASK_STATUS_META.NotStarted;
              return (
                <div key={tk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tk.name}</div>
                    <div style={{ fontSize: 11.5, color: '#78908A' }}>{tk.owner || '—'}{tk.dueDate ? ` · due ${tk.dueDate.slice(0, 10)}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {canWrite ? (
                      <select value={tk.status} disabled={childBusy}
                        onChange={(e) => childAction(() => projectTasks.update(eid, tk.id, { name: tk.name, owner: tk.owner, dueDate: tk.dueDate, status: e.target.value }))}
                        style={smallInputStyle_}>
                        {Object.entries(PROJECT_TASK_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    ) : <Chip label={meta.label} tone={meta.tone} />}
                    {canWrite && <button type="button" onClick={() => childAction(() => projectTasks.remove(eid, tk.id))} style={dangerBtnStyle}>Delete</button>}
                  </div>
                </div>
              );
            })}
            {canWrite && (
              <InlineAdd
                fields={[
                  { key: 'name', label: 'Task', flex: 2 },
                  { key: 'owner', label: 'Owner' },
                  { key: 'dueDate', label: 'Due', type: 'date', flex: 0.9 },
                  { key: 'status', label: 'Status', options: Object.entries(PROJECT_TASK_STATUS_META).map(([k, v]) => [k, v.label]), default: 'NotStarted' },
                ]}
                onAdd={(v) => v.name.trim() && childAction(() => projectTasks.add(eid, { name: v.name, owner: v.owner, dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null, status: v.status }))}
              />
            )}
          </>
        )}
      </Section>

      {/* Subcontractors */}
      <Section title="Subcontractors">
        {!full ? <Spinner size={12} /> : (
          <>
            {(full.subcontractors || []).length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No subcontractors yet.</div>}
            {(full.subcontractors || []).map((sb) => {
              const meta = SUBCONTRACTOR_STATUS_META[sb.status] || SUBCONTRACTOR_STATUS_META.Active;
              return (
                <div key={sb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{sb.name}</div>
                    <div style={{ fontSize: 11.5, color: '#78908A' }}>{sb.scope}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {canWrite ? (
                      <select value={sb.status} disabled={childBusy}
                        onChange={(e) => childAction(() => projectSubcontractors.update(eid, sb.id, { name: sb.name, scope: sb.scope, status: e.target.value }))}
                        style={smallInputStyle_}>
                        {Object.entries(SUBCONTRACTOR_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    ) : <Chip label={meta.label} tone={meta.tone} />}
                    {canWrite && <button type="button" onClick={() => childAction(() => projectSubcontractors.remove(eid, sb.id))} style={dangerBtnStyle}>Delete</button>}
                  </div>
                </div>
              );
            })}
            {canWrite && (
              <InlineAdd
                fields={[
                  { key: 'name', label: 'Company', flex: 1.4 },
                  { key: 'scope', label: 'Scope', flex: 1.6 },
                  { key: 'status', label: 'Status', options: Object.entries(SUBCONTRACTOR_STATUS_META).map(([k, v]) => [k, v.label]), default: 'Active' },
                ]}
                onAdd={(v) => v.name.trim() && childAction(() => projectSubcontractors.add(eid, { name: v.name, scope: v.scope, status: v.status }))}
              />
            )}
          </>
        )}
      </Section>

      {/* Risk register */}
      <Section title="Risk register">
        {!full ? <Spinner size={12} /> : (
          <>
            {(full.risks || []).length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No risks logged yet.</div>}
            {(full.risks || []).map((rk) => {
              const sev = RISK_SEVERITY_META[rk.severity] || RISK_SEVERITY_META.Low;
              const st = RISK_STATUS_META[rk.status] || RISK_STATUS_META.Open;
              return (
                <div key={rk.id} style={{ padding: '10px 0', borderBottom: '1px solid #E9F1EF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{rk.description}</div>
                    {canWrite ? (
                      <>
                        <select value={rk.severity} disabled={childBusy} onChange={(e) => childAction(() => projectRisks.update(eid, rk.id, { description: rk.description, severity: e.target.value, mitigation: rk.mitigation, status: rk.status }))} style={smallInputStyle_}>
                          {Object.entries(RISK_SEVERITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select value={rk.status} disabled={childBusy} onChange={(e) => childAction(() => projectRisks.update(eid, rk.id, { description: rk.description, severity: rk.severity, mitigation: rk.mitigation, status: e.target.value }))} style={smallInputStyle_}>
                          {Object.entries(RISK_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button type="button" onClick={() => childAction(() => projectRisks.remove(eid, rk.id))} style={dangerBtnStyle}>Delete</button>
                      </>
                    ) : (
                      <><Chip label={sev.label} tone={sev.tone} /><Chip label={st.label} tone={st.tone} /></>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#78908A', marginTop: 3 }}>{rk.mitigation}</div>
                </div>
              );
            })}
            {canWrite && (
              <InlineAdd
                fields={[
                  { key: 'description', label: 'Risk', flex: 1.8 },
                  { key: 'mitigation', label: 'Mitigation', flex: 1.8 },
                  { key: 'severity', label: 'Severity', options: Object.entries(RISK_SEVERITY_META).map(([k, v]) => [k, v.label]), default: 'Medium' },
                  { key: 'status', label: 'Status', options: Object.entries(RISK_STATUS_META).map(([k, v]) => [k, v.label]), default: 'Open' },
                ]}
                onAdd={(v) => v.description.trim() && childAction(() => projectRisks.add(eid, { description: v.description, severity: v.severity, mitigation: v.mitigation, status: v.status }))}
              />
            )}
          </>
        )}
      </Section>

      {/* Budget vs actual */}
      <Section title="Budget vs actual">
        {!full ? <Spinner size={12} /> : (() => {
          const lines = full.budgetLines || [];
          const maxVal = Math.max(1, ...lines.map((b) => Math.max(b.budgetAmount, b.actualAmount)));
          const totBudget = lines.reduce((s, b) => s + b.budgetAmount, 0);
          const totActual = lines.reduce((s, b) => s + b.actualAmount, 0);
          return (
            <div>
              {lines.length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No budget lines yet.</div>}
              {lines.map((bl) => {
                const over = bl.actualAmount > bl.budgetAmount;
                return (
                  <div key={bl.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52685F', marginBottom: 4 }}>
                      <span>{bl.label}{bl.category ? ` · ${BOM_CATEGORY_META[bl.category]?.label || bl.category}` : ''}</span>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: over ? '#A6362E' : '#52685F', fontWeight: 600 }}>{money(bl.actualAmount)} / {money(bl.budgetAmount)}</span>
                        {canWrite && <button type="button" onClick={() => childAction(() => projectBudgetLines.remove(eid, bl.id))} style={dangerBtnStyle}>×</button>}
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: 9, background: '#E9F1EF', borderRadius: 999 }}>
                      <div style={{ position: 'absolute', inset: 0, width: `${(bl.budgetAmount / maxVal) * 100}%`, background: '#C9DAD6', borderRadius: 999 }} />
                      <div style={{ position: 'absolute', top: 0, height: 9, width: `${(bl.actualAmount / maxVal) * 100}%`, background: over ? '#A6362E' : '#1F6E72', borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
              {lines.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid #D7E4E1' }}>
                  <span>Total</span>
                  <span style={{ color: totActual > totBudget ? '#A6362E' : '#12201F' }}>{money(totActual)} / {money(totBudget)}</span>
                </div>
              )}
              {canWrite && (
                <InlineAdd
                  fields={[
                    { key: 'label', label: 'Line item', flex: 1.6 },
                    { key: 'budgetAmount', label: 'Budget', type: 'number', flex: 0.9 },
                    { key: 'actualAmount', label: 'Actual', type: 'number', flex: 0.9 },
                    { key: 'category', label: 'Category', options: [['', '— Category —'], ...BOM_CATEGORY_ENTRIES.map(([k, v]) => [k, v.label])], default: '' },
                  ]}
                  onAdd={(v) => v.label.trim() && childAction(() => projectBudgetLines.add(eid, { label: v.label, budgetAmount: Number(v.budgetAmount) || 0, actualAmount: Number(v.actualAmount) || 0, category: v.category || null }))}
                />
              )}
            </div>
          );
        })()}
      </Section>
    </div>
  );
}
