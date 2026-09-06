import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getNonConformities,
  createNonConformity,
  updateNonConformity,
  deleteNonConformity,
  toNonConformityView,
  getPlants,
  toPlantView,
  canAccess,
  NON_CONFORMITY_STATUS_META,
} from '../lib/api';

const STATUS_ENTRIES = Object.entries(NON_CONFORMITY_STATUS_META);

const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };

const EMPTY_FORM = { description: '', plantId: '', status: 'Open' };

export default function NonConformities({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'nonConformities', 'write');

  const [rows, setRows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getNonConformities(), getPlants()])
      .then(([ncDtos, plantDtos]) => {
        setRows(ncDtos.map(toNonConformityView));
        setPlants(plantDtos.map(toPlantView));
      })
      .catch((err) => setError(err.message || 'Failed to load non-conformities.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const refresh = () => getNonConformities().then((d) => setRows(d.map(toNonConformityView)));

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading non-conformities…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const plantName = (id) => plants.find((p) => p.id === id)?.name || '';
  const projectFor = (id) => plants.find((p) => p.id === id)?.projectName || '';

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    setCreating(true); setFormError('');
    try {
      await createNonConformity({
        description: form.description,
        plantName: plantName(form.plantId),
        status: form.status,
        plantId: form.plantId || null,
      });
      await refresh();
      setShowAdd(false); setForm(EMPTY_FORM);
    } catch (err) { setFormError(err.message || 'Failed to create.'); }
    finally { setCreating(false); }
  };

  const startEdit = (r) => { setEditingId(r.entityId); setDraft({ description: r.desc, plantId: r.plantId || '', status: r.statusKey }); };
  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await updateNonConformity(id, {
        description: draft.description,
        plantName: plantName(draft.plantId),
        status: draft.status,
        plantId: draft.plantId || null,
      });
      await refresh();
      setEditingId(null);
    } catch (err) { setError(err.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.id}?`)) return;
    setDeletingId(r.entityId);
    try {
      await deleteNonConformity(r.entityId);
      setRows((prev) => prev.filter((x) => x.entityId !== r.entityId));
    } catch (err) { setError(err.message || 'Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={() => { setForm({ ...EMPTY_FORM, plantId: plants[0]?.id || '' }); setFormError(''); setShowAdd(true); }} style={primaryBtnStyle}>+ Log non-conformity</button>}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.55fr 2.1fr 1.1fr 1.1fr 0.8fr 0.85fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
          <div>Ref</div><div>Description</div><div>Plant</div><div>Project</div><div>Status</div><div>Actions</div>
        </div>
        {rows.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#78908A' }}>No non-conformities logged.</div>}
        {rows.map((r) => {
          const editing = editingId === r.entityId;
          return (
            <div key={r.entityId} style={{ display: 'grid', gridTemplateColumns: '0.55fr 2.1fr 1.1fr 1.1fr 0.8fr 0.85fr', padding: '10px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}>
              <div style={{ fontFamily: 'SF Mono, Consolas, monospace', fontSize: 11, color: '#78908A' }}>{r.id}</div>
              {editing ? (
                <>
                  <input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} style={smallInputStyle} />
                  <select value={draft.plantId} onChange={(e) => setDraft((d) => ({ ...d, plantId: e.target.value }))} style={smallInputStyle}>
                    <option value="">— None —</option>
                    {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div style={{ fontSize: 11.5, color: '#1F6E72' }}>{projectFor(draft.plantId) || '—'}</div>
                  <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} style={smallInputStyle}>
                    {STATUS_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setEditingId(null)} disabled={saving} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                    <button type="button" onClick={() => saveEdit(r.entityId)} disabled={saving} style={linkBtnStyle}>{saving ? '…' : 'Save'}</button>
                  </div>
                </>
              ) : (
                <>
                  <div>{r.desc}</div>
                  <div style={{ color: '#52685F' }}>{r.plant || '—'}</div>
                  <div style={{ color: '#1F6E72', fontWeight: 600 }}>{projectFor(r.plantId) || '—'}</div>
                  <div><Chip label={r.status} tone={r.tone} /></div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {canWrite && <button type="button" onClick={() => startEdit(r)} style={linkBtnStyle}>Edit</button>}
                    {canWrite && (deletingId === r.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => remove(r)} style={dangerBtnStyle}>Delete</button>)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div onClick={() => !creating && setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAdd} style={{ width: 440, background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Log non-conformity</div>
            <div style={fieldLabelStyle}>Description *</div>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required style={inputStyle} />
            <div style={fieldLabelStyle}>Plant</div>
            <select value={form.plantId} onChange={(e) => setForm((f) => ({ ...f, plantId: e.target.value }))} style={inputStyle}>
              <option value="">— None —</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.projectName ? ` — ${p.projectName}` : ''}</option>)}
            </select>
            {projectFor(form.plantId) && <div style={{ marginTop: -6, marginBottom: 12, fontSize: 11.5, color: '#1F6E72' }}>Project: {projectFor(form.plantId)}</div>}
            <div style={fieldLabelStyle}>Status</div>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {STATUS_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
            {formError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{formError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAdd(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Log it
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
