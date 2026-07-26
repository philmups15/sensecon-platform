import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getProjects, toProjectView } from '../lib/api';
import { projectTabsList, milestones, tasks, subs, risks, budgetLines } from '../lib/mockData';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('tasks');

  useEffect(() => {
    getProjects()
      .then((dtos) => {
        const views = dtos.map(toProjectView);
        setProjects(views);
        if (views.length > 0) setSelectedId(views[0].id);
      })
      .catch((err) => setError(err.message || 'Failed to load projects.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading projects…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;
  if (projects.length === 0) return <div style={{ padding: 20, color: '#6A7178' }}>No projects yet.</div>;

  const detail = projects.find((p) => p.id === selectedId) || projects[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9AA0A6', borderBottom: '1px solid #E4E8EB' }}>
          <div>Project</div><div>Stage</div><div>PM</div><div>Budget</div><div>Actual</div>
        </div>
        {projects.map((p) => (
          <div key={p.entityId} onClick={() => setSelectedId(p.id)} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F0F2F4', cursor: 'pointer', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#141719' }}>{p.name}</div>
            <div><Chip label={p.stage} tone={p.tone} /></div>
            <div>{p.pm}</div><div>{p.budget}</div><div>{p.actual}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.name}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', margin: '16px 0' }}>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, background: m.bg, border: `2px solid ${m.color}` }} />
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: '#334155', textAlign: 'center' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E4E8EB', marginBottom: 14 }}>
          {projectTabsList.map(([key, label]) => {
            const active = tab === key;
            const color = active ? '#1E4FC4' : '#9AA0A6';
            return (
              <div key={key} onClick={() => setTab(key)} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color, borderBottom: `2px solid ${color}` }}>
                {label}
              </div>
            );
          })}
        </div>

        {tab === 'tasks' && tasks.map((tk, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{tk.name}</div>
              <div style={{ fontSize: 11.5, color: '#9AA0A6' }}>{tk.owner} · due {tk.due}</div>
            </div>
            <Chip label={tk.status} tone={tk.tone} />
          </div>
        ))}

        {tab === 'subs' && subs.map((sb, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{sb.name}</div>
              <div style={{ fontSize: 11.5, color: '#9AA0A6' }}>{sb.scope}</div>
            </div>
            <Chip label={sb.status} tone={sb.tone} />
          </div>
        ))}

        {tab === 'budget' && budgetLines.map((bl, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155', marginBottom: 4 }}>
              <span>{bl.label}</span>
              <span>${bl.actual} / ${bl.budget}</span>
            </div>
            <div style={{ height: 7, background: '#F0F2F4', borderRadius: 999 }}>
              <div style={{ height: 7, width: '70%', background: '#2563EB', borderRadius: 999 }} />
            </div>
          </div>
        ))}

        {tab === 'risk' && risks.map((rk, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #F0F2F4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{rk.risk}</div>
              <Chip label={rk.severity} tone={rk.tone} />
            </div>
            <div style={{ fontSize: 11.5, color: '#9AA0A6', marginTop: 3 }}>{rk.mitigation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
