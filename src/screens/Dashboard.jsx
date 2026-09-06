import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getDashboard, STAGE_META, HEALTH_META } from '../lib/api';

const HEALTH_COLOR = {
  Good: '#1C8A4E',
  Watch: '#6B8F87',
  AtRisk: '#C98A16',
  Critical: '#A6362E',
  Unknown: '#9AB0AA',
};
const STAGE_COLOR = {
  DesignSurvey: '#1F6E72',
  Deployment: '#C98A16',
  Commissioning: '#7A5EA8',
  Operating: '#1C8A4E',
};

const card = { background: '#FFFFFF', border: '1px solid #D7E4E1', borderRadius: 12, padding: 18 };
const cardTitle = { fontSize: 13.5, fontWeight: 700, marginBottom: 12 };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const money = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

function PlantMap({ locations }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    mapRef.current = L.map(elRef.current, { scrollWheelZoom: false }).setView([-13.13, 27.85], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!locations.length) return;
    const pts = [];
    locations.forEach((p) => {
      const color = HEALTH_COLOR[p.health] || HEALTH_COLOR.Unknown;
      L.circleMarker([p.latitude, p.longitude], {
        radius: 8, color: '#FFFFFF', weight: 2, fillColor: color, fillOpacity: 0.95,
      }).bindTooltip(`${p.name} — ${(HEALTH_META[p.health] || {}).label || p.health}`).addTo(layer);
      pts.push([p.latitude, p.longitude]);
    });
    if (pts.length === 1) map.setView(pts[0], 9);
    else map.fitBounds(pts, { padding: [30, 30] });
  }, [locations]);

  return (
    <div>
      <div ref={elRef} style={{ height: 300, borderRadius: 10, overflow: 'hidden', border: '1px solid #D7E4E1' }} />
      {locations.length === 0 && (
        <div style={{ fontSize: 12, color: '#78908A', marginTop: 8 }}>
          No plants have coordinates yet — add latitude / longitude on a plant to see it here.
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#52685F' }}><Spinner size={18} />Loading dashboard…</div>;
  if (error) return <div style={{ padding: 20, color: '#A6362E' }}>{error}</div>;

  const kpis = [
    { label: 'Operating plants', value: data.operatingPlants },
    { label: 'In delivery', value: data.inDelivery, sub: `${data.inCommissioning} commissioning` },
    { label: 'Open work orders', value: data.openWorkOrders, sub: data.slaBreaching ? `${data.slaBreaching} past due` : 'all on time', subTone: data.slaBreaching ? '#A6362E' : '#1C8A4E' },
    { label: 'Pipeline value', value: money(data.pipelineValue), sub: `${data.openOpportunities} open opportunities` },
  ];

  const stageTotal = data.stageDistribution.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#52685F', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 6, color: '#12201F' }}>{k.value}</div>
            <div style={{ fontSize: 11.5, marginTop: 6, color: k.subTone || '#78908A', fontWeight: 600 }}>{k.sub || ' '}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <div style={card}>
          <div style={cardTitle}>Plant portfolio</div>
          <PlantMap locations={data.plantLocations} />
        </div>

        <div style={card}>
          <div style={cardTitle}>Lifecycle stage distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.stageDistribution.map((s) => {
              const meta = STAGE_META[s.stage] || { label: s.stage };
              const pct = (s.count / stageTotal) * 100;
              return (
                <div key={s.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52685F', marginBottom: 4 }}>
                    <span>{meta.label}</span><span style={{ fontWeight: 700, color: '#12201F' }}>{s.count}</span>
                  </div>
                  <div style={{ height: 8, background: '#E9F1EF', borderRadius: 999 }}>
                    <div style={{ height: 8, width: `${pct}%`, background: STAGE_COLOR[s.stage] || '#1F6E72', borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <div style={{ ...cardTitle, marginBottom: 10 }}>Recent activity</div>
          {data.recentActivity.length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>No activity logged yet.</div>}
          {data.recentActivity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid #E9F1EF' }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: '#1F6E72', marginTop: 6, flex: 'none' }} />
              <div>
                <div style={{ fontSize: 12.5, color: '#12201F' }}><b>{a.who}</b> {a.action}</div>
                <div style={{ fontSize: 11, color: '#78908A', marginTop: 2 }}>{timeAgo(a.created)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ ...cardTitle, marginBottom: 10 }}>Plants needing attention</div>
          {data.attentionPlants.length === 0 && <div style={{ fontSize: 12.5, color: '#78908A' }}>Every plant is healthy.</div>}
          {data.attentionPlants.map((p) => {
            const meta = HEALTH_META[p.health] || HEALTH_META.Unknown;
            return (
              <div key={p.plantId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #E9F1EF' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#12201F' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#78908A' }}>{p.issue}</div>
                </div>
                <Chip label={meta.label} tone={meta.tone} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
