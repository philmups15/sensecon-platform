import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import { getSurveys, toSurveyView } from '../lib/api';
import { surveyPhotos, measurements, obstructions } from '../lib/mockData';

export default function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getSurveys()
      .then((dtos) => {
        const views = dtos.map(toSurveyView);
        setSurveys(views);
        if (views.length > 0) setSelectedId(views[0].entityId);
      })
      .catch((err) => setError(err.message || 'Failed to load surveys.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20, color: '#6A7178' }}>Loading surveys…</div>;
  if (error) return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;
  if (surveys.length === 0) return <div style={{ padding: 20, color: '#6A7178' }}>No surveys yet.</div>;

  const detail = surveys.find((s) => s.entityId === selectedId) || surveys[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        {surveys.map((sv) => (
          <div key={sv.entityId} onClick={() => setSelectedId(sv.entityId)} style={{ padding: '13px 16px', borderBottom: '1px solid #F0F2F4', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sv.plant}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9AA0A6', fontFamily: 'SF Mono, Consolas, monospace', margin: '3px 0 7px' }}>
              {sv.id} · {sv.date}
            </div>
            <Chip label={sv.status} tone={sv.tone} />
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.plant}</div>
          <Chip label={detail.status} tone={detail.tone} />
        </div>
        <div style={{ fontSize: 12, color: '#9AA0A6', marginTop: 4 }}>Surveyor {detail.surveyor} · {detail.date}</div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6A7178', marginBottom: 5 }}>
            <span>Checklist progress</span><span>{detail.progress}%</span>
          </div>
          <div style={{ height: 8, background: '#F0F2F4', borderRadius: 999 }}>
            <div style={{ height: 8, width: `${detail.progress}%`, background: '#2563EB', borderRadius: 999 }} />
          </div>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Photo capture</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {surveyPhotos.map((p) => (
            <div key={p.id} style={{ aspectRatio: '1', background: '#F4F6F8', border: '1px dashed #D2D8DC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, color: '#9AA0A6', textAlign: 'center', padding: 4 }}>
              {p.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Measurements</div>
            {measurements.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F0F2F4', fontSize: 12.5 }}>
                <span style={{ color: '#6A7178' }}>{m.field}</span>
                <span style={{ fontWeight: 600, color: '#141719' }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Obstructions & shading</div>
            {obstructions.map((ob, i) => (
              <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid #F0F2F4', fontSize: 12.5 }}>
                <div style={{ fontWeight: 600, color: '#141719' }}>{ob.item}</div>
                <div style={{ color: '#9AA0A6' }}>{ob.impact}</div>
              </div>
            ))}
          </div>
        </div>
        <button style={{ marginTop: 20, padding: '10px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Sign off survey
        </button>
      </div>
    </div>
  );
}
