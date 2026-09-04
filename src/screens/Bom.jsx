import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getBomItems,
  createBomItem,
  updateBomItem,
  deleteBomItem,
  toBomView,
  getPlants,
  toPlantView,
  canAccess,
  BOM_STATUS_META,
} from '../lib/api';
import { variance } from '../lib/mockData';

const STATUS_ENTRIES = Object.entries(BOM_STATUS_META);

const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };

const EMPTY_FORM = { component: '', quantity: '1', unitCost: '', supplier: '', status: 'Ordered', plantId: '' };

export default function Bom({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'bomItems', 'write');

  const [rows, setRows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getBomItems(), getPlants()])
      .then(([bomDtos, plantDtos]) => {
        setRows(bomDtos.map(toBomView));
        setPlants(plantDtos.map(toPlantView));
      })
      .catch((err) => setError(err.message || 'Failed to load BOM items.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading bill of materials…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const refresh = () => getBomItems().then((dtos) => setRows(dtos.map(toBomView)));

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setCreateError('');
    setShowAddForm(true);
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.component.trim()) {
      setCreateError('Component is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await createBomItem({
        component: form.component,
        quantity: Number(form.quantity) || 1,
        unitCost: Number(form.unitCost) || 0,
        supplier: form.supplier,
        status: form.status,
        plantId: form.plantId || null,
      });
      await refresh();
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create BOM item.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.entityId);
    setDraft({
      component: row.component,
      quantity: String(row.qty),
      unitCost: String(row.rawUnitCost),
      supplier: row.supplier,
      status: row.statusKey,
      plantId: row.plantId || '',
    });
    setSaveError('');
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id) => {
    setSaving(true);
    setSaveError('');
    try {
      await updateBomItem(id, {
        component: draft.component,
        quantity: Number(draft.quantity) || 1,
        unitCost: Number(draft.unitCost) || 0,
        supplier: draft.supplier,
        status: draft.status,
        plantId: draft.plantId || null,
      });
      await refresh();
      setEditingId(null);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (row) => {
    if (!window.confirm(`Delete BOM line ${row.component}? This cannot be undone.`)) return;
    setDeletingId(row.entityId);
    setDeleteError('');
    try {
      await deleteBomItem(row.entityId);
      setRows((prev) => prev.filter((item) => item.entityId !== row.entityId));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete BOM item.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add BOM item</button>}
      </div>

      {deleteError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}
      {saveError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{saveError}</div>}

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.6fr 0.9fr 1.2fr 1.3fr 1fr 1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
          <div>Component</div><div>Qty</div><div>Unit cost</div><div>Supplier</div><div>Plant</div><div>Status</div><div>Actions</div>
        </div>
        {rows.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#78908A' }}>No BOM lines yet.</div>}
        {rows.map((b) => {
          const editing = editingId === b.entityId;
          return (
            <div key={b.entityId} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.6fr 0.9fr 1.2fr 1.3fr 1fr 1fr', padding: '10px 16px', fontSize: 13, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}>
              {editing ? (
                <>
                  <input value={draft.component} onChange={(e) => setDraft((d) => ({ ...d, component: e.target.value }))} style={smallInputStyle} />
                  <input type="number" min="1" value={draft.quantity} onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))} style={smallInputStyle} />
                  <input type="number" min="0" step="0.01" value={draft.unitCost} onChange={(e) => setDraft((d) => ({ ...d, unitCost: e.target.value }))} style={smallInputStyle} />
                  <input value={draft.supplier} onChange={(e) => setDraft((d) => ({ ...d, supplier: e.target.value }))} style={smallInputStyle} />
                  <select value={draft.plantId} onChange={(e) => setDraft((d) => ({ ...d, plantId: e.target.value }))} style={smallInputStyle}>
                    <option value="">— None —</option>
                    {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} style={smallInputStyle}>
                    {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={cancelEdit} disabled={saving} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                    <button type="button" onClick={() => saveEdit(b.entityId)} disabled={saving} style={{ ...linkBtnStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {saving && <Spinner size={10} />}Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: '#12201F' }}>{b.component}</div>
                  <div>{b.qty}</div>
                  <div>{b.unit}</div>
                  <div>{b.supplier || '—'}</div>
                  <div style={{ color: b.plantName ? '#1F6E72' : '#78908A', fontWeight: b.plantName ? 600 : 400 }}>{b.plantName || '—'}</div>
                  <div><Chip label={b.status} tone={b.tone} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {canWrite && <button type="button" onClick={() => startEdit(b)} style={linkBtnStyle}>Edit</button>}
                    {canWrite && (deletingId === b.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeItem(b)} style={dangerBtnStyle}>Delete</button>)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Cost variance vs budget ($k)</div>
        {variance.map((v, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52685F', marginBottom: 4 }}>
              <span>{v.label}</span>
              <span>{v.actual}k / {v.budget}k budget</span>
            </div>
            <div style={{ height: 8, background: '#E9F1EF', borderRadius: 999, position: 'relative' }}>
              <div style={{ height: 8, width: `${v.actualPct}%`, background: '#1F6E72', borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 440, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add BOM item</div>

            <div style={fieldLabelStyle}>Component *</div>
            <input value={form.component} onChange={(e) => setForm((f) => ({ ...f, component: e.target.value }))} required style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Quantity</div>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Unit cost ($)</div>
                <input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={fieldLabelStyle}>Supplier</div>
            <input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} style={inputStyle} />

            <div style={fieldLabelStyle}>Plant</div>
            <select value={form.plantId} onChange={(e) => setForm((f) => ({ ...f, plantId: e.target.value }))} style={inputStyle}>
              <option value="">— None —</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div style={fieldLabelStyle}>Status</div>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add BOM item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
