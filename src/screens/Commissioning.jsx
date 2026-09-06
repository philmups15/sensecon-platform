import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import HandoverBundle from '../components/HandoverBundle';
import Spinner from '../components/Spinner';
import {
  getPlants,
  toPlantView,
  getProjects,
  toProjectView,
  getNonConformities,
  toNonConformityView,
  getCommissioningChecklist,
  recordCommissioningTest,
  getPlantAttachments,
  uploadPlantAttachments,
  downloadPlantAttachment,
  getHandover,
  upsertHandover,
  signOffHandover,
  uploadHandoverCertificate,
  downloadHandoverCertificate,
  COMMISSIONING_RESULT_META,
  HANDOVER_STATUS_META,
  canAccess,
} from '../lib/api';

const CATEGORY_TITLES = { Dc: 'DC side tests', Ac: 'AC side tests', Monitoring: 'Monitoring functional', Safety: 'Safety' };
const RESULT_ENTRIES = Object.entries(COMMISSIONING_RESULT_META);
const RESULT_TONE = { Pending: 'slate', Pass: 'green', Fail: 'red' };

function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function attachmentExt(fn) { const d = fn.lastIndexOf('.'); return d === -1 ? 'FILE' : fn.slice(d + 1).toUpperCase().slice(0, 4); }
function formatBytes(b) { if (!b) return '0 KB'; const kb = b / 1024; return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`; }

function TestGroup({ title, tests, canWrite, onSave, savingKey }) {
  if (tests.length === 0) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {tests.map((t) => (
        <div key={t.testName} style={{ padding: '8px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span>{t.testName}</span>
            {canWrite ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {savingKey === `${t.category}:${t.testName}` && <Spinner size={12} />}
                <select value={t.result} onChange={(e) => onSave(t.category, t.testName, { result: e.target.value })}
                  style={{ border: '1px solid #D7E4E1', borderRadius: 6, padding: '4px 6px', fontSize: 12, fontFamily: 'inherit' }}>
                  {RESULT_ENTRIES.map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
            ) : (
              <Chip label={(COMMISSIONING_RESULT_META[t.result] || {}).label || t.result} tone={RESULT_TONE[t.result]} />
            )}
          </div>
          {canWrite ? (
            <input defaultValue={t.notes || ''} placeholder="Notes…"
              onBlur={(e) => { if ((e.target.value || '') !== (t.notes || '')) onSave(t.category, t.testName, { notes: e.target.value }); }}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, border: '1px solid #E9F1EF', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit', color: '#52685F' }} />
          ) : t.notes ? (
            <div style={{ marginTop: 4, fontSize: 11.5, color: '#78908A' }}>{t.notes}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function Commissioning({ currentUser, projectScopeId, view }) {
  const canWrite = canAccess(currentUser?.role, 'plants', 'write');
  const scoped = !!projectScopeId;
  const showTests = !view || view === 'tests';
  const showHandover = !view || view === 'handover';

  const [plants, setPlants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [plantId, setPlantId] = useState(null);
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [testsError, setTestsError] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [handover, setHandover] = useState(null);
  const [hoDraft, setHoDraft] = useState({ acceptanceDate: '', notes: '' });
  const [hoSaving, setHoSaving] = useState(false);
  const [hoError, setHoError] = useState('');

  const [nonConformities, setNonConformities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlants(), getNonConformities(), scoped ? Promise.resolve([]) : getProjects()])
      .then(([plantDtos, ncDtos, projectDtos]) => {
        const pv = plantDtos.map(toPlantView).filter((p) => !projectScopeId || p.projectId === projectScopeId);
        setPlants(pv);
        setPlantId(pv[0]?.id ?? null);
        setProjects(projectDtos.map(toProjectView));
        setNonConformities(ncDtos.map(toNonConformityView));
      })
      .catch((err) => setError(err.message || 'Failed to load commissioning data.'))
      .finally(() => setLoading(false));
  }, []);

  // Narrow the plant list to the chosen project (top-level screen only).
  const visiblePlants = (!scoped && projectId) ? plants.filter((p) => p.projectId === projectId) : plants;

  const pickProject = (pid) => {
    setProjectId(pid);
    const pool = pid ? plants.filter((p) => p.projectId === pid) : plants;
    setPlantId(pool[0]?.id ?? null);
  };

  const loadTests = (id) => {
    setTestsLoading(true); setTestsError('');
    getCommissioningChecklist(id).then(setTests)
      .catch((err) => setTestsError(err.message || 'Failed to load checklist.'))
      .finally(() => setTestsLoading(false));
  };
  const loadAttachments = (id) => getPlantAttachments(id).then(setAttachments).catch(() => setAttachments([]));
  const loadHandover = (id) => getHandover(id).then((h) => {
    setHandover(h);
    setHoDraft({ acceptanceDate: h.acceptanceDate ? h.acceptanceDate.slice(0, 10) : '', notes: h.notes || '' });
  }).catch(() => setHandover(null));

  useEffect(() => {
    if (!plantId) return;
    loadTests(plantId); loadAttachments(plantId); loadHandover(plantId);
  }, [plantId]);

  const saveTest = async (category, testName, patch) => {
    const row = tests.find((t) => t.category === category && t.testName === testName) || {};
    setSavingKey(`${category}:${testName}`); setTestsError('');
    try {
      await recordCommissioningTest(
        plantId, category, testName,
        patch.result ?? row.result ?? 'Pending',
        patch.notes ?? row.notes ?? null,
      );
      loadTests(plantId); loadHandover(plantId);
    } catch (err) { setTestsError(err.message || 'Failed to save.'); }
    finally { setSavingKey(null); }
  };

  const saveHoDraft = async () => {
    setHoSaving(true); setHoError('');
    try {
      await upsertHandover(plantId, {
        acceptanceDate: hoDraft.acceptanceDate ? new Date(hoDraft.acceptanceDate).toISOString() : null,
        notes: hoDraft.notes || null,
      });
      await loadHandover(plantId);
    } catch (err) { setHoError(err.message || 'Failed to save handover.'); }
    finally { setHoSaving(false); }
  };

  const doSignOff = async () => {
    setHoSaving(true); setHoError('');
    try { await signOffHandover(plantId); await loadHandover(plantId); }
    catch (err) { setHoError(err.message || 'Sign-off failed.'); }
    finally { setHoSaving(false); }
  };

  const onCertFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setHoSaving(true); setHoError('');
    try { await uploadHandoverCertificate(plantId, file); await loadHandover(plantId); }
    catch (err) { setHoError(err.message || 'Certificate upload failed.'); }
    finally { setHoSaving(false); }
  };

  const uploadHandoverFiles = async (files) => {
    await uploadPlantAttachments(plantId, files, files[0].name.replace(/\.[^/.]+$/, ''));
    loadAttachments(plantId);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading commissioning…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;
  if (plants.length === 0) return <div style={{ padding: 20, color: '#52685F' }}>{scoped ? 'Add a plant to this project first — commissioning runs against the project’s plant.' : 'No plants yet — add a plant first.'}</div>;

  const plant = plants.find((p) => p.id === plantId);
  const plantNCs = nonConformities.filter((nc) => nc.plantId === plantId);
  const signedOff = handover?.status === 'SignedOff';
  const canSignOff = handover?.commissioningComplete;

  const handoverItems = attachments.map((a) => ({
    id: a.id, name: a.title, ext: attachmentExt(a.fileName), fileName: a.fileName,
    meta: `${a.fileName.split('.').pop().toUpperCase()} · v${a.version} · ${formatBytes(a.sizeBytes)} · ${a.uploadedByName}`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        {plant && <span style={{ fontSize: 12, color: '#78908A' }}>{plant.typeLabel}</span>}
        {!scoped && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#52685F' }}>Project</span>
            <select value={projectId} onChange={(e) => pickProject(e.target.value)} style={{ border: '1px solid #D7E4E1', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit' }}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.entityId} value={p.entityId}>{p.name}</option>)}
            </select>
          </>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#52685F' }}>Plant</span>
        {scoped && plants.length <= 1 ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#12201F' }}>{plant?.name}</span>
        ) : (
          <select value={plantId ?? ''} onChange={(e) => setPlantId(e.target.value)} style={{ border: '1px solid #D7E4E1', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit' }}>
            {visiblePlants.length === 0 && <option value="">No plants for this project</option>}
            {visiblePlants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {showTests && testsError && <div style={{ padding: '8px 12px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12.5 }}>{testsError}</div>}

      {showTests && !plantId && <div style={{ padding: 20, color: '#78908A', fontSize: 13 }}>No plant selected — this project has no plant yet.</div>}

      {showTests && plantId && (testsLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A' }}><Spinner size={14} />Loading checklist…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {Object.entries(CATEGORY_TITLES).map(([cat, title]) => (
            <TestGroup key={`${cat}-${plantId}`} title={title} tests={tests.filter((t) => t.category === cat)} canWrite={canWrite} onSave={saveTest} savingKey={savingKey} />
          ))}
        </div>
      ))}

      {/* Handover */}
      {showHandover && !plantId && <div style={{ padding: 20, color: '#78908A', fontSize: 13 }}>No plant selected — this project has no plant yet.</div>}
      {showHandover && plantId && (<>
      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Handover</div>
          {handover && <Chip label={(HANDOVER_STATUS_META[handover.status] || {}).label} tone={(HANDOVER_STATUS_META[handover.status] || {}).tone} />}
        </div>
        {hoError && <div style={{ marginBottom: 10, padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{hoError}</div>}

        {signedOff ? (
          <div style={{ fontSize: 13, color: '#52685F' }}>
            Signed off by <b>{handover.signedOffByName || '—'}</b> on {formatDate(handover.signedOffDate)}.
            {handover.acceptanceDate && <> Customer acceptance {formatDate(handover.acceptanceDate)}.</>}
            {handover.hasCertificate && (
              <> · <button type="button" onClick={() => downloadHandoverCertificate(plantId, `${plant?.code || 'handover'}-certificate`)} style={{ border: 'none', background: 'transparent', color: '#1F6E72', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Download certificate</button></>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Customer acceptance date</div>
                <input type="date" value={hoDraft.acceptanceDate} disabled={!canWrite}
                  onChange={(e) => setHoDraft((d) => ({ ...d, acceptanceDate: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', marginBottom: 5 }}>Certificate</div>
                {canWrite ? (
                  <label style={{ display: 'inline-block', padding: '7px 12px', border: '1px solid #D7E4E1', borderRadius: 6, fontSize: 12.5, cursor: 'pointer', background: '#F4F8F7' }}>
                    {handover?.hasCertificate ? 'Replace file' : 'Upload file'}
                    <input type="file" onChange={onCertFile} style={{ display: 'none' }} />
                  </label>
                ) : <span style={{ fontSize: 12.5, color: '#78908A' }}>{handover?.hasCertificate ? 'Uploaded' : 'None'}</span>}
              </div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#52685F', margin: '12px 0 5px' }}>Notes</div>
            <textarea value={hoDraft.notes} disabled={!canWrite} rows={2}
              onChange={(e) => setHoDraft((d) => ({ ...d, notes: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D7E4E1', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'inherit' }} />

            {canWrite && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                <button type="button" onClick={saveHoDraft} disabled={hoSaving}
                  style={{ padding: '8px 14px', background: '#FFFFFF', color: '#1F6E72', border: '1px solid #1F6E72', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  Save draft
                </button>
                <button type="button" onClick={doSignOff} disabled={hoSaving || !canSignOff}
                  title={canSignOff ? '' : `Outstanding: ${(handover?.outstandingTests || []).join(', ')}`}
                  style={{ padding: '8px 14px', background: canSignOff ? '#1F6E72' : '#D7E4E1', color: canSignOff ? '#fff' : '#78908A', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: canSignOff ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {hoSaving && <Spinner size={12} color="#fff" />}Sign off handover
                </button>
                {!canSignOff && <span style={{ fontSize: 11.5, color: '#8A5A16' }}>Blocked: {(handover?.outstandingTests || []).length} test(s) not passing</span>}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Non-conformities on this plant</div>
        {plantNCs.length === 0 && <div style={{ fontSize: 13, color: '#78908A' }}>None logged.</div>}
        {plantNCs.map((nc) => (
          <div key={nc.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #E9F1EF', fontSize: 13 }}>
            <div><span style={{ fontFamily: 'SF Mono, Consolas, monospace', color: '#78908A', fontSize: 11 }}>{nc.id}</span> {nc.desc}</div>
            <Chip label={nc.status} tone={nc.tone} />
          </div>
        ))}
      </div>

      <HandoverBundle
        items={handoverItems}
        generatedDate={handoverItems.length ? formatDate(attachments[0].created) : '—'}
        onDownload={(item) => downloadPlantAttachment(plantId, item.id, item.fileName)}
        onUpload={canWrite ? uploadHandoverFiles : undefined}
        canUpload={canWrite}
        emptyLabel="No handover documents uploaded yet."
      />
      </>
      )}
    </div>
  );
}
