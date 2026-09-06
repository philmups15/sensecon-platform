import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import ExportButton from '../components/ExportButton';
import {
  getWorkOrders,
  getWorkOrderById,
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
  addWorkOrderChecklistItem, updateWorkOrderChecklistItem, deleteWorkOrderChecklistItem,
  addWorkOrderPart, deleteWorkOrderPart,
  addWorkOrderLabour, deleteWorkOrderLabour,
  uploadWorkOrderAttachments, downloadWorkOrderAttachment,
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

const EMPTY_FORM = { title: '', plantId: '', type: 'OM', priority: 'Medium', assignee: '', status: 'Open', dueDate: '' };
const iso = (d) => (d ? new Date(d).toISOString() : null);
const dateInput = (d) => (d ? d.slice(0, 10) : '');

function ChildList({ title, items, columns, render, onAdd, canWrite, addLabel }) {
  const [adding, setAdding] = useState(false);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{title}</div>
        {canWrite && <button type="button" onClick={() => setAdding((a) => !a)} style={linkBtnStyle}>{adding ? 'Close' : `+ ${addLabel}`}</button>}
      </div>
      {items.length === 0 && !adding && <div style={{ fontSize: 12.5, color: '#78908A' }}>None yet.</div>}
      {items.map((it) => render(it))}
      {adding && <AddRow columns={columns} onSave={async (v) => { await onAdd(v); setAdding(false); }} onCancel={() => setAdding(false)} />}
    </div>
  );
}

function AddRow({ columns, onSave, onCancel }) {
  const [v, setV] = useState(Object.fromEntries(columns.map((c) => [c.key, c.default ?? ''])));
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: '1px dashed #D7E4E1' }}>
      {columns.map((c) => (
        <input key={c.key} type={c.type || 'text'} placeholder={c.label} value={v[c.key]} step={c.type === 'number' ? 'any' : undefined}
          onChange={(e) => setV((s) => ({ ...s, [c.key]: e.target.value }))}
          style={{ ...smallInputStyle, flex: c.flex || 1 }} />
      ))}
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(v); } finally { setBusy(false); } }} style={linkBtnStyle}>{busy ? '…' : 'Add'}</button>
      <button type="button" onClick={onCancel} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
    </div>
  );
}

export default function WorkOrders({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'workOrders', 'write');

  const [workOrders, setWorkOrders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [woDetail, setWoDetail] = useState(null);

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

  const detail = workOrders.find((w) => w.id === selectedId) || workOrders[0];
  const projectFor = (plantId) => plants.find((p) => p.id === plantId)?.projectName || '';

  const loadWoDetail = (entityId) => { if (entityId) getWorkOrderById(entityId).then(setWoDetail).catch(() => setWoDetail(null)); };
  useEffect(() => { setWoDetail(null); if (detail) loadWoDetail(detail.entityId); }, [detail?.entityId]);
  const refreshDetail = () => detail && loadWoDetail(detail.entityId);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading work orders…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const columns = woColumnsList.map((label) => ({ label, cards: workOrders.filter((w) => w.col === label) }));
  const reload = async () => { const dtos = await getWorkOrders(); setWorkOrders(dtos.map(toWorkOrderView)); };

  const changeStatus = async (statusKey) => {
    if (!detail) return;
    setSavingStatus(true); setStatusError('');
    try {
      await updateWorkOrder(detail.entityId, {
        title: detail.title, type: detail.typeKey, priority: detail.priorityKey,
        assignee: detail.assignee, status: statusKey, dueDate: detail.dueDate, plantId: detail.plantId,
      });
      await reload(); refreshDetail();
    } catch (err) { setStatusError(err.message || 'Failed to update status.'); }
    finally { setSavingStatus(false); }
  };

  const submitAddForm = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.plantId) { setCreateError('Title and plant are required.'); return; }
    setCreating(true); setCreateError('');
    try {
      await createWorkOrder({
        title: form.title, type: form.type, priority: form.priority, assignee: form.assignee,
        status: form.status, dueDate: iso(form.dueDate), plantId: form.plantId,
      });
      const dtos = await getWorkOrders();
      const views = dtos.map(toWorkOrderView);
      setWorkOrders(views);
      setSelectedId((views.find((w) => w.title === form.title) || views[0])?.id ?? null);
      setShowAddForm(false); setForm(EMPTY_FORM);
    } catch (err) { setCreateError(err.message || 'Failed to create work order.'); }
    finally { setCreating(false); }
  };

  const startEditCore = (w) => {
    setCoreDraft({ title: w.title, plantId: w.plantId, type: w.typeKey, priority: w.priorityKey, assignee: w.assignee, dueDate: dateInput(w.dueDate) });
    setCoreError(''); setEditingCore(true);
  };
  const saveCore = async () => {
    if (!detail) return;
    setSavingCore(true); setCoreError('');
    try {
      await updateWorkOrder(detail.entityId, {
        title: coreDraft.title, type: coreDraft.type, priority: coreDraft.priority, assignee: coreDraft.assignee,
        status: detail.statusKey, dueDate: iso(coreDraft.dueDate), plantId: coreDraft.plantId,
      });
      await reload(); refreshDetail(); setEditingCore(false);
    } catch (err) { setCoreError(err.message || 'Failed to save changes.'); }
    finally { setSavingCore(false); }
  };

  const removeWorkOrder = async (w) => {
    if (!window.confirm(`Delete work order ${w.id}?`)) return;
    setDeletingId(w.entityId); setDeleteError('');
    try {
      await deleteWorkOrder(w.entityId);
      setWorkOrders((prev) => prev.filter((item) => item.entityId !== w.entityId));
      if (selectedId === w.id) setSelectedId((prev) => workOrders.filter((item) => item.entityId !== w.entityId)[0]?.id ?? null);
    } catch (err) { setDeleteError(err.message || 'Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  const uploadAtt = async (files) => { await uploadWorkOrderAttachments(detail.entityId, files, files[0].name.replace(/\.[^/.]+$/, '')); refreshDetail(); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <div style={{ flex: 1 }} />
        <ExportButton filename="work-orders" sheet="Work orders" rows={() => workOrders.map((w) => ({
          Ref: w.id, Title: w.title, Plant: w.plant || '', Project: projectFor(w.plantId) || '',
          Type: w.type, Priority: w.priority, Assignee: w.assignee || '',
          'Due date': dateInput(w.dueDate), Status: w.col,
        }))} />
        {canWrite && <button onClick={() => { setForm({ ...EMPTY_FORM, plantId: plants[0]?.id || '' }); setCreateError(''); setShowAddForm(true); }} style={primaryBtnStyle}>+ Add work order</button>}
      </div>
      {deleteError && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{deleteError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {columns.map((col) => (
          <div key={col.label}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#52685F', marginBottom: 8 }}>{col.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.cards.map((c) => (
                <div key={c.entityId} onClick={() => setSelectedId(c.id)}
                  style={{ background: '#FFFFFF', border: `1px solid ${c.id === detail?.id ? '#1F6E72' : '#D7E4E1'}`, borderLeft: `3px solid ${c.tone === 'violet' ? '#2E9E8F' : '#1F6E72'}`, borderRadius: 10, padding: 12, boxShadow: '0 1px 2px rgba(18,32,31,0.05)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{c.id}</span>
                    <Chip label={c.type} tone={c.tone} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#12201F', marginTop: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#52685F', marginTop: 4 }}>{c.plant}</div>
                  {projectFor(c.plantId) && <div style={{ fontSize: 10.5, color: '#1F6E72', fontWeight: 600, marginTop: 2 }}>{projectFor(c.plantId)}</div>}
                  <div style={{ fontSize: 11, color: '#78908A', marginTop: 6 }}>{c.assignee}{c.dueDate ? ` · due ${dateInput(c.dueDate)}` : ''}</div>
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
              {!editingCore && <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.title} <span style={{ fontSize: 11, color: '#78908A', fontFamily: 'SF Mono, Consolas, monospace' }}>{detail.id}</span></div>}
              {!editingCore && <div style={{ fontSize: 12, color: '#52685F', marginTop: 4 }}>{detail.plant}{projectFor(detail.plantId) ? <> · <span style={{ color: '#1F6E72', fontWeight: 600 }}>{projectFor(detail.plantId)}</span></> : ''} · {detail.assignee}{detail.dueDate ? ` · due ${dateInput(detail.dueDate)}` : ''}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {canWrite && !editingCore && <button onClick={() => startEditCore(detail)} style={linkBtnStyle}>Edit</button>}
              {canWrite && !editingCore && (deletingId === detail.entityId ? <Spinner size={12} /> : <button type="button" onClick={() => removeWorkOrder(detail)} style={dangerBtnStyle}>Delete</button>)}
              {editingCore && (
                <>
                  <button onClick={() => setEditingCore(false)} disabled={savingCore} style={{ ...linkBtnStyle, color: '#78908A' }}>Cancel</button>
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
              <div><div style={fieldLabelStyle}>Title</div><input value={coreDraft.title ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, title: e.target.value }))} style={smallInputStyle} /></div>
              <div><div style={fieldLabelStyle}>Plant</div>
                <select value={coreDraft.plantId ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, plantId: e.target.value }))} style={smallInputStyle}>
                  {plants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.projectName ? ` — ${p.projectName}` : ''}</option>)}
                </select></div>
              <div><div style={fieldLabelStyle}>Type</div>
                <select value={coreDraft.type ?? 'OM'} onChange={(e) => setCoreDraft((d) => ({ ...d, type: e.target.value }))} style={smallInputStyle}>
                  {TYPE_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select></div>
              <div><div style={fieldLabelStyle}>Priority</div>
                <select value={coreDraft.priority ?? 'Medium'} onChange={(e) => setCoreDraft((d) => ({ ...d, priority: e.target.value }))} style={smallInputStyle}>
                  {PRIORITY_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select></div>
              <div><div style={fieldLabelStyle}>Assignee</div><input value={coreDraft.assignee ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, assignee: e.target.value }))} style={smallInputStyle} /></div>
              <div><div style={fieldLabelStyle}>Due date</div><input type="date" value={coreDraft.dueDate ?? ''} onChange={(e) => setCoreDraft((d) => ({ ...d, dueDate: e.target.value }))} style={smallInputStyle} /></div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#52685F', textTransform: 'uppercase', letterSpacing: 0.4 }}>Status</span>
                {canWrite ? (
                  <select value={detail.statusKey} onChange={(e) => changeStatus(e.target.value)} disabled={savingStatus} style={{ ...smallInputStyle, width: 'auto' }}>
                    {STATUS_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                  </select>
                ) : <Chip label={detail.col} tone="blue" />}
                {savingStatus && <Spinner size={12} />}
              </div>
              {statusError && <div style={{ marginTop: 8, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{statusError}</div>}

              {woDetail ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 12 }}>
                  <div>
                    <ChildList title="Checklist" addLabel="item" canWrite={canWrite}
                      items={woDetail.checklistItems || []}
                      columns={[{ key: 'text', label: 'Task', flex: 3 }]}
                      onAdd={async (v) => { await addWorkOrderChecklistItem(detail.entityId, { text: v.text, order: (woDetail.checklistItems || []).length }); refreshDetail(); }}
                      render={(it) => (
                        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                          <input type="checkbox" checked={it.isDone} disabled={!canWrite}
                            onChange={async (e) => { await updateWorkOrderChecklistItem(detail.entityId, it.id, { text: it.text, isDone: e.target.checked, order: it.order }); refreshDetail(); }} />
                          <span style={{ flex: 1, textDecoration: it.isDone ? 'line-through' : 'none', color: it.isDone ? '#78908A' : '#12201F' }}>{it.text}</span>
                          {canWrite && <button type="button" onClick={async () => { await deleteWorkOrderChecklistItem(detail.entityId, it.id); refreshDetail(); }} style={dangerBtnStyle}>×</button>}
                        </div>
                      )} />

                    <ChildList title="Parts consumed" addLabel="part" canWrite={canWrite}
                      items={woDetail.parts || []}
                      columns={[{ key: 'partName', label: 'Part', flex: 3 }, { key: 'quantity', label: 'Qty', type: 'number', flex: 1, default: '1' }]}
                      onAdd={async (v) => { await addWorkOrderPart(detail.entityId, { partName: v.partName, quantity: Number(v.quantity) || 1, notes: null }); refreshDetail(); }}
                      render={(it) => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                          <span>{it.quantity}× {it.partName}</span>
                          {canWrite && <button type="button" onClick={async () => { await deleteWorkOrderPart(detail.entityId, it.id); refreshDetail(); }} style={dangerBtnStyle}>×</button>}
                        </div>
                      )} />
                  </div>

                  <div>
                    <ChildList title="Labour" addLabel="entry" canWrite={canWrite}
                      items={woDetail.labour || []}
                      columns={[{ key: 'personName', label: 'Person', flex: 2 }, { key: 'hours', label: 'Hours', type: 'number', flex: 1 }, { key: 'workDate', label: '', type: 'date', flex: 1.5 }]}
                      onAdd={async (v) => { await addWorkOrderLabour(detail.entityId, { personName: v.personName, hours: Number(v.hours) || 0, workDate: iso(v.workDate), notes: null }); refreshDetail(); }}
                      render={(it) => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                          <span>{it.personName} · {it.hours}h{it.workDate ? ` · ${dateInput(it.workDate)}` : ''}</span>
                          {canWrite && <button type="button" onClick={async () => { await deleteWorkOrderLabour(detail.entityId, it.id); refreshDetail(); }} style={dangerBtnStyle}>×</button>}
                        </div>
                      )} />

                    <div style={{ marginTop: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>Attachments</div>
                        {canWrite && (
                          <label style={{ ...linkBtnStyle, cursor: 'pointer' }}>
                            + file
                            <input type="file" multiple style={{ display: 'none' }} onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) uploadAtt(f); }} />
                          </label>
                        )}
                      </div>
                      {(woDetail.attachments || []).length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>None.</div>}
                      {(woDetail.attachments || []).map((a) => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
                          <button type="button" onClick={() => downloadWorkOrderAttachment(detail.entityId, a.id, a.fileName)} style={{ border: 'none', background: 'transparent', color: '#1F6E72', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{a.title}</button>
                          <span style={{ color: '#78908A', fontSize: 11.5 }}>v{a.version} · {a.uploadedByName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12.5, color: '#78908A' }}><Spinner size={12} />Loading detail…</div>
              )}

              {canWrite && detail.col !== 'Done' && (
                <button onClick={() => changeStatus('Done')} disabled={savingStatus}
                  style={{ marginTop: 16, padding: '9px 16px', background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {savingStatus && <Spinner size={12} color="#fff" />}Sign off &amp; close
                </button>
              )}
            </>
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
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.projectName ? ` — ${p.projectName}` : ''}</option>)}
            </select>
            {projectFor(form.plantId) && <div style={{ marginTop: -6, marginBottom: 12, fontSize: 11.5, color: '#1F6E72' }}>Project: {projectFor(form.plantId)}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={fieldLabelStyle}>Type</div>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {TYPE_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select></div>
              <div><div style={fieldLabelStyle}>Priority</div>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={inputStyle}>
                  {PRIORITY_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={fieldLabelStyle}>Assignee</div><input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} style={inputStyle} /></div>
              <div><div style={fieldLabelStyle}>Due date</div><input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} style={inputStyle} /></div>
            </div>
            {createError && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{createError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAddForm(false)} disabled={creating} style={{ flex: 1, padding: 10, background: '#FFFFFF', color: '#52685F', border: '1px solid #D7E4E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ flex: 1, padding: 10, background: '#1F6E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {creating && <Spinner size={12} color="#fff" />}Add work order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
