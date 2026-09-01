import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  toSurveyView,
  getProjects,
  toProjectView,
  SURVEY_STATUS_META,
  canAccess,
} from '../lib/api';
import { surveyPhotos, measurements, obstructions } from '../lib/mockData';

const STATUS_ENTRIES = Object.entries(SURVEY_STATUS_META);

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
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };

const EMPTY_FORM = { plantName: '', surveyor: '', date: '', status: 'Scheduled', projectId: '' };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function Surveys({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'surveys', 'write');

  const [surveys, setSurveys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [signingOff, setSigningOff] = useState(false);
  const [signOffError, setSignOffError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getSurveys(), getProjects()])
      .then(([surveyDtos, projectDtos]) => {
        const views = surveyDtos.map(toSurveyView);
        setSurveys(views);
        setProjects(projectDtos.map(toProjectView));
        setSelectedId((prev) => (views.some((s) => s.entityId === prev) ? prev : (views[0]?.entityId ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load surveys.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading surveys…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const detail = surveys.find((s) => s.entityId === selectedId);

  const refresh = () => getSurveys().then((dtos) => setSurveys(dtos.map(toSurveyView)));

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM, date: todayInputValue() });
    setCreateError('');
    setShowAddForm(true);
  };
  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.plantName.trim()) {
      setCreateError('Plant / site name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const id = await createSurvey({
        plantName: form.plantName,
        surveyor: form.surveyor,
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        status: form.status,
        progress: 0,
        projectId: form.projectId || null,
      });
      await refresh();
      setSelectedId(id);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create survey.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (s) => {
    setDraft({
      plantName: s.plant,
      surveyor: s.surveyor,
      date: s.rawDate ? s.rawDate.slice(0, 10) : '',
      status: s.statusKey,
      progress: s.progress,
      projectId: s.projectId || '',
    });
    setSaveError('');
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateSurvey(detail.entityId, {
        code: detail.id,
        plantName: draft.plantName,
        surveyor: draft.surveyor,
        date: draft.date ? new Date(draft.date).toISOString() : new Date().toISOString(),
        status: draft.status,
        progress: Number(draft.progress) || 0,
        projectId: draft.projectId || null,
      });
      await refresh();
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const signOff = async () => {
    if (!detail) return;
    setSigningOff(true);
    setSignOffError('');
    try {
      await updateSurvey(detail.entityId, {
        code: detail.id,
        plantName: detail.plant,
        surveyor: detail.surveyor,
        date: detail.rawDate,
        status: 'SignedOff',
        progress: detail.progress,
        projectId: detail.projectId || null,
      });
      await refresh();
    } catch (err) {
      setSignOffError(err.message || 'Failed to sign off survey.');
    } finally {
      setSigningOff(false);
    }
  };

  const removeSurvey = async (s) => {
    if (!window.confirm(`Delete the survey for ${s.plant}? This cannot be undone.`)) return;
    setDeletingId(s.entityId);
    setDeleteError('');
    try {
      await deleteSurvey(s.entityId);
      const remaining = surveys.filter((item) => item.entityId !== s.entityId);
      setSurveys(remaining);
      if (selectedId === s.entityId) setSelectedId(remaining[0]?.entityId ?? null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete survey.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add survey</button>}
      </div>
      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {surveys.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No surveys yet.</div>}

      {surveys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
            {surveys.map((sv) => (
              <div key={sv.entityId} onClick={() => setSelectedId(sv.entityId)} style={{ padding: '13px 16px', borderBottom: '1px solid #E9F1EF', cursor: 'pointer', background: sv.entityId === selectedId ? '#E4F0EF' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sv.plant}</div>
                </div>
                <div style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 5px' }}>
                  {sv.id} · {sv.date}
                </div>
                {sv.projectName && <div style={{ fontSize: 11, color: '#1F6E72', fontWeight: 600, marginBottom: 6 }}>{sv.projectName}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip label={sv.status} tone={sv.tone} />
                  {canWrite && (deletingId === sv.entityId ? <Spinner size={11} /> : <button type="button" onClick={(e) => { e.stopPropagation(); removeSurvey(sv); }} style={dangerBtnStyle}>Delete</button>)}
                </div>
              </div>
            ))}
          </div>

          {detail && (
            <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {!editing && <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.plant}</div>}
                  <div style={{ fontSize: 12, color: '#78908A', marginTop: 4 }}>
                    {detail.id} · Surveyor {detail.surveyor || '—'} · {detail.date}
                    {detail.projectName && <> · <span style={{ color: '#1F6E72', fontWeight: 600 }}>{detail.projectName}</span></>}
                  </div>
                </div>
                {canWrite && !editing && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Chip label={detail.status} tone={detail.tone} />
                    <button onClick={() => startEdit(detail)} style={linkBtnStyle}>Edit</button>
                  </div>
                )}
                {editing && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={cancelEdit} disabled={saving} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                    <button onClick={saveEdit} disabled={saving} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {saving && <Spinner size={11} color="#fff" />}Save
                    </button>
                  </div>
                )}
              </div>

              {saveError && <div style={{ marginTop: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{saveError}</div>}

              {editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                  <div>
                    <div style={fieldLabelStyle}>Plant / site name</div>
                    <input value={draft.plantName ?? ''} onChange={(e) => setDraft((d) => ({ ...d, plantName: e.target.value }))} style={smallInputStyle} />
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Project</div>
                    <select value={draft.projectId ?? ''} onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))} style={smallInputStyle}>
                      <option value="">— None —</option>
                      {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Surveyor</div>
                    <input value={draft.surveyor ?? ''} onChange={(e) => setDraft((d) => ({ ...d, surveyor: e.target.value }))} style={smallInputStyle} />
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Date</div>
                    <input type="date" value={draft.date ?? ''} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} style={smallInputStyle} />
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Status</div>
                    <select value={draft.status ?? 'Scheduled'} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} style={smallInputStyle}>
                      {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Checklist progress (%)</div>
                    <input type="number" min="0" max="100" value={draft.progress ?? 0} onChange={(e) => setDraft((d) => ({ ...d, progress: e.target.value }))} style={smallInputStyle} />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52685F', marginBottom: 5 }}>
                    <span>Checklist progress</span><span>{detail.progress}%</span>
                  </div>
                  <div style={{ height: 8, background: '#E9F1EF', borderRadius: 999 }}>
                    <div style={{ height: 8, width: `${detail.progress}%`, background: '#1F6E72', borderRadius: 999 }} />
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Photo capture</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                {surveyPhotos.map((p) => (
                  <div key={p.id} style={{ aspectRatio: '1', background: '#F4F8F7', border: '1px dashed #D7E4E1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, color: '#78908A', textAlign: 'center', padding: 4 }}>
                    {p.label}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Measurements</div>
                  {measurements.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 12.5 }}>
                      <span style={{ color: '#52685F' }}>{m.field}</span>
                      <span style={{ fontWeight: 600, color: '#12201F' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Obstructions & shading</div>
                  {obstructions.map((ob, i) => (
                    <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600, color: '#12201F' }}>{ob.item}</div>
                      <div style={{ color: '#78908A' }}>{ob.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              {signOffError && <div style={{ marginTop: 16, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{signOffError}</div>}
              {canWrite && detail.statusKey !== 'SignedOff' && (
                <button onClick={signOff} disabled={signingOff} style={{ marginTop: 20, padding: '10px 18px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: signingOff ? 0.7 : 1 }}>
                  {signingOff && <Spinner size={12} color="#fff" />}Sign off survey
                </button>
              )}
              {detail.statusKey === 'SignedOff' && (
                <div style={{ marginTop: 20, background: '#E3F8EC', border: '1px solid #BFE9CE', color: '#1C8A4E', fontWeight: 700, fontSize: 13, padding: '12px 16px', borderRadius: 10, display: 'inline-block' }}>✓ Signed off</div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 440, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add site survey</div>

            <div style={fieldLabelStyle}>Plant / site name *</div>
            <input value={form.plantName} onChange={(e) => setForm((f) => ({ ...f, plantName: e.target.value }))} required style={inputStyle} />

            <div style={fieldLabelStyle}>Project</div>
            <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} style={inputStyle}>
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Surveyor</div>
                <input value={form.surveyor} onChange={(e) => setForm((f) => ({ ...f, surveyor: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Date</div>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={fieldLabelStyle}>Status</div>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add survey
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
