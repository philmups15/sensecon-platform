import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import Spinner from '../components/Spinner';
import {
  getPlants,
  toPlantView,
  getNonConformities,
  toNonConformityView,
  getCommissioningTests,
  recordCommissioningTest,
  toCommissioningTestView,
  getPlantAttachments,
  uploadPlantAttachments,
  downloadPlantAttachment,
  COMMISSIONING_CHECKLIST,
  COMMISSIONING_RESULT_META,
  canAccess,
} from '../lib/api';

const CATEGORY_TITLES = {
  Dc: 'DC side tests',
  Ac: 'AC side tests',
  Monitoring: 'Monitoring functional',
  Safety: 'Safety',
};

const RESULT_ENTRIES = Object.entries(COMMISSIONING_RESULT_META);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function attachmentExt(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? 'FILE' : fileName.slice(dot + 1).toUpperCase().slice(0, 4);
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function TestGroup({ title, tests, canWrite, onChange, savingKey }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {tests.map((t, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13, gap: 10 }}>
          <span>{t.test}</span>
          {canWrite ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {savingKey === `${t.category}:${t.test}` && <Spinner size={12} />}
              <select
                value={t.resultKey}
                onChange={(e) => onChange(t.category, t.test, e.target.value)}
                style={{ border: '1px solid #D7E4E1', borderRadius: 6, padding: '4px 6px', fontSize: 12, fontFamily: 'inherit' }}
              >
                {RESULT_ENTRIES.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
            </div>
          ) : (
            <Chip label={t.result} tone={t.tone} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Commissioning({ currentUser }) {
  const canWrite = canAccess(currentUser?.role, 'plants', 'write');

  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState(null);
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [testsError, setTestsError] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  const [nonConformities, setNonConformities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlants(), getNonConformities()])
      .then(([plantDtos, ncDtos]) => {
        const plantViews = plantDtos.map(toPlantView);
        setPlants(plantViews);
        setPlantId(plantViews[0]?.id ?? null);
        setNonConformities(ncDtos.map(toNonConformityView));
      })
      .catch((err) => setError(err.message || 'Failed to load commissioning data.'))
      .finally(() => setLoading(false));
  }, []);

  const loadTests = (id) => {
    setTestsLoading(true);
    setTestsError('');
    getCommissioningTests(id)
      .then((dtos) => {
        const recorded = new Map(dtos.map((d) => [`${d.category}:${d.testName}`, d]));
        const merged = Object.entries(COMMISSIONING_CHECKLIST).flatMap(([category, names]) =>
          names.map((name) => {
            const rec = recorded.get(`${category}:${name}`);
            return {
              category,
              ...toCommissioningTestView(rec || { category, testName: name, result: 'Pending', notes: null }),
            };
          })
        );
        setTests(merged);
      })
      .catch((err) => setTestsError(err.message || 'Failed to load test results.'))
      .finally(() => setTestsLoading(false));
  };

  const loadAttachments = (id) => {
    setAttachmentsLoading(true);
    getPlantAttachments(id)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  };

  useEffect(() => {
    if (!plantId) return;
    loadTests(plantId);
    loadAttachments(plantId);
  }, [plantId]);

  const handleTestChange = async (category, testName, result) => {
    setSavingKey(`${category}:${testName}`);
    setTestsError('');
    try {
      await recordCommissioningTest(plantId, category, testName, result, null);
      loadTests(plantId);
    } catch (err) {
      setTestsError(err.message || 'Failed to save test result.');
    } finally {
      setSavingKey(null);
    }
  };

  const uploadHandoverFiles = async (files) => {
    await uploadPlantAttachments(plantId, files, files[0].name.replace(/\.[^/.]+$/, ''));
    loadAttachments(plantId);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading commissioning…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;
  if (plants.length === 0) return <div style={{ padding: 20, color: '#52685F' }}>No plants yet — add a plant before recording commissioning tests.</div>;

  const byCategory = (cat) => tests.filter((t) => t.category === cat);

  const handoverItems = attachments.map((a) => ({
    id: a.id,
    name: a.title,
    meta: `${a.fileName.split('.').pop().toUpperCase()} · v${a.version} · ${formatBytes(a.sizeBytes)} · ${a.uploadedByName}`,
    ext: attachmentExt(a.fileName),
    fileName: a.fileName,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#52685F' }}>Plant</span>
        <select value={plantId ?? ''} onChange={(e) => setPlantId(e.target.value)} style={{ border: '1px solid #D7E4E1', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit' }}>
          {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {testsError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{testsError}</div>}

      {testsLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A' }}><Spinner size={14} />Loading test results…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {Object.entries(CATEGORY_TITLES).map(([cat, title]) => (
            <TestGroup key={cat} title={title} tests={byCategory(cat)} canWrite={canWrite} onChange={handleTestChange} savingKey={savingKey} />
          ))}
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Non-conformity tracker</div>
        {nonConformities.length === 0 && <div style={{ fontSize: 13, color: '#78908A' }}>No non-conformities logged.</div>}
        {nonConformities.map((nc) => (
          <div key={nc.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div>
              <span style={{ fontFamily: 'SF Mono, Consolas, monospace', color: '#78908A', fontSize: 11 }}>{nc.id}</span> {nc.desc} <span style={{ color: '#78908A' }}>— {nc.plant}</span>
            </div>
            <Chip label={nc.status} tone={nc.tone} />
          </div>
        ))}
      </div>

      {attachmentsLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A' }}><Spinner size={14} />Loading handover bundle…</div>
      ) : (
        <HandoverBundle
          items={handoverItems}
          generatedDate={handoverItems.length ? formatDate(attachments[0].created) : '—'}
          onDownload={(item) => downloadPlantAttachment(plantId, item.id, item.fileName)}
          onUpload={canWrite ? uploadHandoverFiles : undefined}
          canUpload={canWrite}
          emptyLabel="No handover documents uploaded yet."
        />
      )}
    </div>
  );
}
