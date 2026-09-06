import { useEffect, useState } from 'react';
import Chip from '../../components/Chip';
import Spinner from '../../components/Spinner';
import {
  getCommissioningTemplates,
  upsertCommissioningTemplate,
  deleteCommissioningTemplate,
  PLANT_TYPE_META,
} from '../../lib/api';
import { primaryBtnStyle, secondaryBtnStyle, inputStyle } from './shared';

const CATEGORIES = ['Dc', 'Ac', 'Monitoring', 'Safety'];
const CATEGORY_LABEL = { Dc: 'DC', Ac: 'AC', Monitoring: 'Monitoring', Safety: 'Safety' };
const TYPE_KEYS = Object.keys(PLANT_TYPE_META);

const EMPTY = { id: null, category: 'Dc', testName: '', appliesToTypes: [], order: 0, isActive: true };

export default function AdminCommissioningTemplates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCommissioningTemplates()
      .then(setRows)
      .catch((err) => setError(err.message || 'Failed to load templates.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!draft.testName.trim()) return;
    setSaving(true); setError('');
    try {
      await upsertCommissioningTemplate(draft);
      setDraft(null);
      load();
    } catch (err) { setError(err.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this test template?')) return;
    try { await deleteCommissioningTemplate(id); setRows((p) => p.filter((r) => r.id !== id)); }
    catch (err) { setError(err.message || 'Delete failed.'); }
  };

  const toggleType = (t) => setDraft((d) => ({
    ...d,
    appliesToTypes: d.appliesToTypes.includes(t) ? d.appliesToTypes.filter((x) => x !== t) : [...d.appliesToTypes, t],
  }));

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: '#78908A' }}><Spinner size={14} />Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }} />
        <button onClick={() => setDraft({ ...EMPTY, order: rows.length })} style={primaryBtnStyle}>+ Add test</button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 2fr 2fr 0.6fr 0.7fr 1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#78908A', borderBottom: '1px solid #D7E4E1' }}>
          <div>Category</div><div>Test</div><div>Applies to</div><div>Order</div><div>Active</div><div>Actions</div>
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 2fr 2fr 0.6fr 0.7fr 1fr', padding: '10px 16px', fontSize: 12.5, borderBottom: '1px solid #E9F1EF', alignItems: 'center' }}>
            <div>{CATEGORY_LABEL[r.category] || r.category}</div>
            <div style={{ fontWeight: 600 }}>{r.testName}</div>
            <div style={{ color: '#52685F' }}>{r.appliesToTypes.length === 0 ? 'All types' : r.appliesToTypes.map((t) => PLANT_TYPE_META[t]?.label || t).join(', ')}</div>
            <div>{r.order}</div>
            <div>{r.isActive ? <Chip label="Active" tone="green" /> : <Chip label="Off" tone="slate" />}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDraft({ ...r })} style={{ border: 'none', background: 'transparent', color: '#1F6E72', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
              <button type="button" onClick={() => remove(r.id)} style={{ border: 'none', background: 'transparent', color: '#A6362E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div onClick={() => !saving && setDraft(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,31,0.35)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, background: '#FFFFFF', borderRadius: 12, padding: 22, boxShadow: '0 12px 32px rgba(18,32,31,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{draft.id ? 'Edit test' : 'Add test'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Category</div>
                <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Order</div>
                <input type="number" value={draft.order} onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Test name</div>
            <input value={draft.testName} onChange={(e) => setDraft((d) => ({ ...d, testName: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Applies to plant types (none = all)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {TYPE_KEYS.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  style={{ padding: '5px 10px', borderRadius: 999, border: '1px solid #D7E4E1', fontSize: 12, cursor: 'pointer', background: draft.appliesToTypes.includes(t) ? '#E4F0EF' : '#FFFFFF', color: draft.appliesToTypes.includes(t) ? '#12484B' : '#52685F', fontWeight: draft.appliesToTypes.includes(t) ? 700 : 500 }}>
                  {PLANT_TYPE_META[t].label}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
              Active
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setDraft(null)} disabled={saving} style={{ ...secondaryBtnStyle, flex: 1 }}>Cancel</button>
              <button type="button" onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saving && <Spinner size={12} color="#fff" />}Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
