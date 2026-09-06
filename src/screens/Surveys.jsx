import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import ExportButton from '../components/ExportButton';
import {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  toSurveyView,
  getProjects,
  toProjectView,
  getPlants,
  toPlantView,
  SURVEY_STATUS_META,
  canAccess,
  addSurveyMeasurement, deleteSurveyMeasurement,
  addSurveyObstruction, deleteSurveyObstruction,
  uploadSurveyPhotos, deleteSurveyPhoto, surveyPhotoBlobUrl,
} from '../lib/api';

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

const EMPTY_FORM = { plantName: '', surveyor: '', date: '', status: 'Scheduled', projectId: '', plantId: '' };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function PhotoThumb({ surveyId, photo, canWrite, onDelete }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let revoked = null;
    surveyPhotoBlobUrl(surveyId, photo.id).then((u) => { revoked = u; setUrl(u); }).catch(() => {});
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [surveyId, photo.id]);
  return (
    <div style={{ position: 'relative', aspectRatio: '1', background: '#F4F8F7', border: '1px solid #D7E4E1', borderRadius: 8, overflow: 'hidden' }}>
      {url
        ? <img src={url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={12} /></div>}
      {photo.gps && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(18,32,31,0.6)', color: '#fff', fontSize: 8.5, padding: '2px 4px', textAlign: 'center' }}>{photo.gps}</div>}
      {canWrite && <button type="button" onClick={onDelete} title="Delete" style={{ position: 'absolute', top: 2, right: 2, border: 'none', background: 'rgba(18,32,31,0.6)', color: '#fff', borderRadius: 4, width: 16, height: 16, fontSize: 10, lineHeight: '16px', cursor: 'pointer', padding: 0 }}>×</button>}
    </div>
  );
}

function MiniAdd({ fields, onAdd }) {
  const [v, setV] = useState(Object.fromEntries(fields.map((f) => [f.key, ''])));
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      {fields.map((f) => (
        <input key={f.key} placeholder={f.label} value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
          style={{ flex: 1, boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
      ))}
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await onAdd(v); setV(Object.fromEntries(fields.map((f) => [f.key, '']))); } finally { setBusy(false); } }}
        style={{ border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{busy ? '…' : 'Add'}</button>
    </div>
  );
}

export default function Surveys({ currentUser, projectScopeId, projectName, onChanged }) {
  const canWrite = canAccess(currentUser?.role, 'surveys', 'write');
  const scoped = !!projectScopeId;
  const notifyChanged = () => onChanged && onChanged();

  const [surveys, setSurveys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [plants, setPlants] = useState([]);
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

  const [full, setFull] = useState(null); // GetSurveyById: measurements / obstructions / photos
  const [childError, setChildError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getSurveys(), getProjects(), getPlants()])
      .then(([surveyDtos, projectDtos, plantDtos]) => {
        const views = surveyDtos.map(toSurveyView);
        setSurveys(views);
        setProjects(projectDtos.map(toProjectView));
        setPlants(plantDtos.map(toPlantView));
        const pool = projectScopeId ? views.filter((s) => s.projectId === projectScopeId) : views;
        setSelectedId((prev) => (pool.some((s) => s.entityId === prev) ? prev : (pool[0]?.entityId ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load surveys.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visibleSurveys = scoped ? surveys.filter((s) => s.projectId === projectScopeId) : surveys;
  const scopedPlants = scoped ? plants.filter((p) => p.projectId === projectScopeId) : plants;
  const detail = visibleSurveys.find((s) => s.entityId === selectedId);

  const loadFull = (id) => { if (id) getSurveyById(id).then(setFull).catch(() => setFull(null)); };
  useEffect(() => { setFull(null); setChildError(''); if (detail) loadFull(detail.entityId); }, [detail?.entityId]);
  const refreshFull = () => detail && loadFull(detail.entityId);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading surveys…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const refresh = () => getSurveys().then((dtos) => setSurveys(dtos.map(toSurveyView)));

  const openAddForm = () => {
    const linkedPlant = scoped ? scopedPlants[0] : null;
    setForm({ ...EMPTY_FORM, date: todayInputValue(), projectId: projectScopeId || '', plantId: linkedPlant?.id || '', plantName: linkedPlant?.name || '' });
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
        projectId: projectScopeId || form.projectId || null,
        plantId: form.plantId || null,
      });
      await refresh();
      setSelectedId(id);
      setShowAddForm(false);
      notifyChanged();
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
      plantId: s.plantId || '',
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
        projectId: projectScopeId || draft.projectId || null,
        plantId: draft.plantId || null,
      });
      await refresh();
      setEditing(false);
      notifyChanged();
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
        projectId: projectScopeId || detail.projectId || null,
        plantId: detail.plantId || null,
      });
      await refresh();
      notifyChanged();
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
      if (selectedId === s.entityId) {
        const pool = scoped ? remaining.filter((x) => x.projectId === projectScopeId) : remaining;
        setSelectedId(pool[0]?.entityId ?? null);
      }
      notifyChanged();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete survey.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }} />
        <ExportButton filename="site-surveys" sheet="Surveys" rows={() => visibleSurveys.map((s) => ({
          Ref: s.id, 'Plant / site': s.plant, Surveyor: s.surveyor || '', Date: s.rawDate ? s.rawDate.slice(0, 10) : '',
          Status: s.status, 'Progress %': s.progress, Project: s.projectName || '',
        }))} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add survey</button>}
      </div>
      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      {visibleSurveys.length === 0 && <div style={{ padding: 20, color: '#52685F' }}>No surveys yet.</div>}

      {visibleSurveys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: scoped ? 'minmax(180px, 300px) minmax(0, 1fr)' : '360px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
            {visibleSurveys.map((sv) => (
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
                  {!scoped && (
                    <div>
                      <div style={fieldLabelStyle}>Project</div>
                      <select value={draft.projectId ?? ''} onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))} style={smallInputStyle}>
                        <option value="">— None —</option>
                        {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <div style={fieldLabelStyle}>Plant</div>
                    <select
                      value={draft.plantId ?? ''}
                      onChange={(e) => {
                        const plantId = e.target.value;
                        const plant = plants.find((pl) => pl.id === plantId);
                        setDraft((d) => ({ ...d, plantId, plantName: plant ? plant.name : d.plantName }));
                      }}
                      style={smallInputStyle}
                    >
                      <option value="">— None —</option>
                      {scopedPlants.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
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

              {childError && <div style={{ marginTop: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{childError}</div>}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Photo capture</div>
                {canWrite && (
                  <label style={{ ...linkBtnStyle, cursor: 'pointer' }}>
                    + photos
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={async (e) => {
                        const f = Array.from(e.target.files || []); e.target.value = '';
                        if (!f.length) return;
                        const gps = window.prompt('GPS / location caption for these photos (optional):') || '';
                        try { await uploadSurveyPhotos(detail.entityId, f, f[0].name.replace(/\.[^/.]+$/, ''), gps); refreshFull(); }
                        catch (err) { setChildError(err.message || 'Photo upload failed.'); }
                      }} />
                  </label>
                )}
              </div>
              {!full ? <Spinner size={12} /> : (full.photos || []).length === 0 ? (
                <div style={{ fontSize: 12, color: '#78908A' }}>No photos captured yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scoped ? 4 : 6},1fr)`, gap: 8 }}>
                  {full.photos.map((p) => (
                    <PhotoThumb key={p.id} surveyId={detail.entityId} photo={p} canWrite={canWrite}
                      onDelete={async () => { try { await deleteSurveyPhoto(detail.entityId, p.id); refreshFull(); } catch (err) { setChildError(err.message || 'Delete failed.'); } }} />
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>Measurements</div>
                    <ExportButton label="Excel" filename={`${detail.id}-measurements`} sheet="Measurements" rows={() => (full?.measurements || []).map((m) => ({ Field: m.field, Value: m.value }))} />
                  </div>
                  {!full ? <Spinner size={12} /> : (full.measurements || []).map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 12.5 }}>
                      <span style={{ color: '#52685F' }}>{m.field}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#12201F' }}>{m.value}</span>
                        {canWrite && <button type="button" onClick={async () => { try { await deleteSurveyMeasurement(detail.entityId, m.id); refreshFull(); } catch (err) { setChildError(err.message); } }} style={dangerBtnStyle}>×</button>}
                      </span>
                    </div>
                  ))}
                  {full && (full.measurements || []).length === 0 && <div style={{ fontSize: 12, color: '#78908A' }}>None yet.</div>}
                  {canWrite && full && (
                    <MiniAdd fields={[{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }]}
                      onAdd={async (v) => { if (!v.field.trim()) return; try { await addSurveyMeasurement(detail.entityId, { field: v.field, value: v.value }); refreshFull(); } catch (err) { setChildError(err.message); } }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>Obstructions &amp; shading</div>
                    <ExportButton label="Excel" filename={`${detail.id}-obstructions`} sheet="Obstructions" rows={() => (full?.obstructions || []).map((o) => ({ Obstruction: o.item, Impact: o.impact }))} />
                  </div>
                  {!full ? <Spinner size={12} /> : (full.obstructions || []).map((ob) => (
                    <div key={ob.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 12.5 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#12201F' }}>{ob.item}</div>
                        <div style={{ color: '#78908A' }}>{ob.impact}</div>
                      </div>
                      {canWrite && <button type="button" onClick={async () => { try { await deleteSurveyObstruction(detail.entityId, ob.id); refreshFull(); } catch (err) { setChildError(err.message); } }} style={dangerBtnStyle}>×</button>}
                    </div>
                  ))}
                  {full && (full.obstructions || []).length === 0 && <div style={{ fontSize: 12, color: '#78908A' }}>None yet.</div>}
                  {canWrite && full && (
                    <MiniAdd fields={[{ key: 'item', label: 'Obstruction' }, { key: 'impact', label: 'Impact' }]}
                      onAdd={async (v) => { if (!v.item.trim()) return; try { await addSurveyObstruction(detail.entityId, { item: v.item, impact: v.impact }); refreshFull(); } catch (err) { setChildError(err.message); } }} />
                  )}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add site survey</div>
            {scoped && <div style={{ fontSize: 11.5, color: '#78908A', marginBottom: 16 }}>Linked to {projectName}</div>}

            <div style={fieldLabelStyle}>Plant / site name *</div>
            <input value={form.plantName} onChange={(e) => setForm((f) => ({ ...f, plantName: e.target.value }))} required style={inputStyle} />

            {!scoped && (
              <>
                <div style={fieldLabelStyle}>Project</div>
                <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} style={inputStyle}>
                  <option value="">— None —</option>
                  {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
                </select>
              </>
            )}

            <div style={fieldLabelStyle}>Plant</div>
            <select
              value={form.plantId}
              onChange={(e) => {
                const plantId = e.target.value;
                const plant = plants.find((pl) => pl.id === plantId);
                setForm((f) => ({ ...f, plantId, plantName: plant ? plant.name : f.plantName }));
              }}
              style={inputStyle}
            >
              <option value="">— None —</option>
              {scopedPlants.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
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
