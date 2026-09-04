import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  getPlants,
  toWorkOrderView,
  toPlantView,
  canAccess,
  WORK_ORDER_TYPE_META,
  PRIORITY_META,
  WORK_ORDER_STATUS_META,
} from '../lib/api';
import { woColumnsList } from '../lib/mockData';

const TYPE_ENTRIES = Object.entries(WORK_ORDER_TYPE_META);
const PRIORITY_ENTRIES = Object.entries(PRIORITY_META);
const STATUS_ENTRIES = Object.entries(WORK_ORDER_STATUS_META);

const fieldLabelStyle = { fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D7E4E1', borderRadius: 8, fontSize: 13, marginBottom: 12 };
const smallInputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const linkBtnStyle = { padding: '3px 6px', border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const dangerBtnStyle = { ...linkBtnStyle, color: '#A6362E' };

const EMPTY_FORM = { title: '', plantId: '', type: 'OM', priority: 'Medium', assignee: '', status: 'Open' };

export default function WorkOrders({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'workOrders', 'write');

  const [workOrders, setWorkOrders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

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
    Promise.all([getWorkOrders(), getPlants()])
      .then(([woDtos, plantDtos]) => {
        const views = woDtos.map(toWorkOrderView);
        setWorkOrders(views);
        setPlants(plantDtos.map(toPlantView));
        setSelectedId((prev) => (views.some((w) => w.id === prev) ? prev : (views[0]?.id ?? null)));
      })
      .catch((err) => setError(err.message || 'Failed to load work orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading work orders…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const detail = workOrders.find((w) => w.id === selectedId) || workOrders[0];

  const columns = woColumnsList.map((label) => ({
    label,
    cards: workOrders.filter((w) => w.col === label),
  }));

  const reload = async () => {
    const dtos = await getWorkOrders();
    setWorkOrders(dtos.map(toWorkOrderView));
  };

  const changeStatus = async (statusKey) => {
    if (!detail) return;
    setSavingStatus(true);
    setStatusError('');
    try {
      await updateWorkOrder(detail.entityId, {
        title: detail.title,
        type: Object.entries(WORK_ORDER_TYPE_META).find(([, m]) => m.label === detail.type)?.[0] || 'OM',
        priority: Object.entries(PRIORITY_META).find(([, m]) => m.label === detail.priority)?.[0] || 'Medium',
        assignee: detail.assignee,
        status: statusKey,
        plantId: detail.plantId,
      });
      await reload();
    } catch (err) {
      setStatusError(err.message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM, plantId: plants[0]?.id || '' });
    setCreateError('');
    setShowAddForm(true);
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.plantId) {
      setCreateError('Title and plant are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await createWorkOrder({
        title: form.title,
        type: form.type,
        priority: form.priority,
        assignee: form.assignee,
        status: form.status,
        plantId: form.plantId,
      });
      const dtos = await getWorkOrders();
      const views = dtos.map(toWorkOrderView);
      setWorkOrders(views);
      const created = views.find((w) => w.title === form.title) || views[0];
      setSelectedId(created?.id ?? null);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create work order.');
    } finally {
      setCreating(false);
    }
  };

  const startEditCore = (w) => {
    setCoreDraft({
      title: w.title,
      plantId: w.plantId,
      type: Object.entries(WORK_ORDER_TYPE_META).find(([, m]) => m.label === w.type)?.[0] || 'OM',
      priority: Object.entries(PRIORITY_META).find(([, m]) => m.label === w.priority)?.[0] || 'Medium',
      assignee: w.assignee,
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
      const statusKey = Object.entries(WORK_ORDER_STATUS_META).find(([, m]) => m.label === detail.col)?.[0] || 'Open';
      await updateWorkOrder(detail.entityId, {
        title: coreDraft.title,
        type: coreDraft.type,
        priority: coreDraft.priority,
        assignee: coreDraft.assignee,
        status: statusKey,
        plantId: coreDraft.plantId,
      });
      await reload();
      setEditingCore(false);
    } catch (err) {
      setCoreError(err.message || 'Failed to save changes.');
    } finally {
      setSavingCore(false);
    }
  };

  const removeWorkOrder = async (w) => {
    if (!window.confirm(`Delete work order ${w.id}? This cannot be undone.`)) return;
    setDeletingId(w.entityId);
    setDeleteError('');
    try {
      await deleteWorkOrder(w.entityId);
      setWorkOrders((prev) => prev.filter((item) => item.entityId !== w.entityId));
      if (selectedId === w.id) {
        setSelectedId((prev) => workOrders.filter((item) => item.entityId !== w.entityId)[0]?.id ?? null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete work order.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1 }} />
        {canWrite && <button onClick={openAddForm} style={primaryBtnStyle}>+ Add work order</button>}
      </div>

      {deleteError && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {columns.map((col) => (
          <div key={col.label}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#52685F', marginBottom: 8 }}>{col.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.cards.map((c) => (
                <div
                  key={c.entityId}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${c.id === detail?.id ? '#1F6E72' : '#D7E4E1'}`,
                    borderLeft: `3px solid ${c.tone === 'violet' ? '#2E9E8F' : '#1F6E72'}`,
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: '0 1px 2px rgba(18,32,31,0.05)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{c.id}</span>
                    <Chip label={c.type} tone={c.tone} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#12201F', marginTop: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#52685F', marginTop: 4 }}>{c.plant}</div>
                  <div style={{ fontSize: 11, color: '#78908A', marginTop: 6 }}>{c.assignee}</div>
                </div>
              ))}
              {col.cards.length === 0 && <div style={{ fontSize: 12, color: '#78908A', padding: '8px 0' }}>—</div>}
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 20, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {!editingCore && (
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {detail.title} <span style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{detail.id}</span>
                </div>
              )}
              {!editingCore && <div style={{ fontSize: 12, color: '#52685F', marginTop: 4 }}>{detail.plant} · {detail.assignee}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {canWrite && !editingCore && <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>}
              {canWrite && !editingCore && (deletingId === detail.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeWorkOrder(detail)} style={dangerBtnStyle}>Delete</button>)}
              {editingCore && (
                <>
                  <button onClick={cancelEditCore} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
                  <button onClick={saveCore} disabled={savingCore} style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {savingCore && <Spinner size={11} color="#fff" />}Save
                  </button>
                </>
              )}
            </div>
          </div>

          {coreError && <div style={{ margin: '10px 0', padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{coreError}</div>}

          {editingCore ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Title</div>
                <input value={coreDraft.title ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, title: e.target.value }))} style={smallInputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Plant</div>
                <select value={coreDraft.plantId ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, plantId: e.target.value }))} style={smallInputStyle}>
                  {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Type</div>
                <select value={coreDraft.type ?? 'OM'} onChange={(e) => setCoreDraft((d) => ({ ...d, type: e.target.value }))} style={smallInputStyle}>
                  {TYPE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Priority</div>
                <select value={coreDraft.priority ?? 'Medium'} onChange={(e) => setCoreDraft((d) => ({ ...d, priority: e.target.value }))} style={smallInputStyle}>
                  {PRIORITY_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Assignee</div>
                <input value={coreDraft.assignee ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, assignee: e.target.value }))} style={smallInputStyle} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#52685F', textTransform: 'uppercase', letterSpacing: 0.4 }}>Status</span>
                {canWrite ? (
                  <select
                    value={Object.entries(WORK_ORDER_STATUS_META).find(([, m]) => m.label === detail.col)?.[0] || 'Open'}
                    onChange={(e) => changeStatus(e.target.value)}
                    disabled={savingStatus}
                    style={{ ...smallInputStyle, width: 'auto' }}
                  >
                    {STATUS_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                  </select>
                ) : (
                  <Chip label={detail.col} tone="blue" />
                )}
                {savingStatus && <Spinner size={12} />}
              </div>
              {statusError && <div style={{ marginTop: 8, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{statusError}</div>}
            </>
          )}

          {canWrite && detail.col !== 'Done' && (
            <button
              onClick={() => changeStatus('Done')}
              disabled={savingStatus}
              style={{ marginTop: 16, padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: savingStatus ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: savingStatus ? 0.7 : 1 }}
            >
              {savingStatus && <Spinner size={12} color="#fff" />}Sign off & close
            </button>
          )}
        </div>
      )}

      {showAddForm && (
        <div onClick={() => !creating && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitAddForm} style={{ width: 460, maxHeight: '86vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add work order</div>

            <div style={fieldLabelStyle}>Title *</div>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required style={inputStyle} />

            <div style={fieldLabelStyle}>Plant *</div>
            <select value={form.plantId} onChange={(e) => setForm((f) => ({ ...f, plantId: e.target.value }))} required style={inputStyle}>
              <option value="" disabled>Select a plant…</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={fieldLabelStyle}>Type</div>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {TYPE_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
              <div>
                <div style={fieldLabelStyle}>Priority</div>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={inputStyle}>
                  {PRIORITY_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
            </div>

            <div style={fieldLabelStyle}>Assignee</div>
            <input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} placeholder="e.g. Field team 2" style={inputStyle} />

            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add work order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
