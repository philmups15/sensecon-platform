import { useState } from 'react';
import Chip from '../../components/Chip';
import { integrations } from '../../lib/mockData';
import { inputStyle, primaryBtnStyle, secondaryBtnStyle, cardStyle, sectionHeaderStyle, TabStrip } from './shared';

// Generic placeholder fields — there's no per-integration schema anywhere
// (mockData.js only has name/status/tone), and no backend settings endpoint
// to fetch real field definitions from, so these are left empty rather than
// pre-filled with invented values.
const GENERIC_FIELDS = ['Provider / endpoint', 'API key or credential', 'Notes'];

export default function AdminIntegrations() {
  const [active, setActive] = useState(integrations[0]?.name);
  const [fieldValues, setFieldValues] = useState({});
  const [messages, setMessages] = useState({});

  const tabs = integrations.map((i) => [i.name, i.name]);
  const current = integrations.find((i) => i.name === active);

  const fieldKey = (field) => `${current.name}::${field}`;

  const handleSave = () => {
    setMessages((prev) => ({ ...prev, [current.name]: "Not saved — there's no backend settings endpoint for integrations yet (Phase 2). Nothing was persisted." }));
  };

  const handleTest = () => {
    setMessages((prev) => ({ ...prev, [current.name]: "Can't test a connection that isn't backed by anything — this integration has no backend settings endpoint yet (Phase 2)." }));
  };

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Integrations</div>
          <div style={{ fontSize: 12.5, color: '#9AA0A6', marginTop: 2 }}>Connect and configure the services this tenant relies on.</div>
        </div>
      </div>

      <TabStrip tabs={tabs} active={active} onChange={setActive} />

      {current && (
        <div style={{ ...cardStyle, marginTop: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{current.name}</div>
            <Chip label={current.status} tone={current.tone} />
          </div>

          <div style={{ marginBottom: 14, padding: '9px 11px', background: '#FBF0E2', border: '1px solid #F3DDB0', borderRadius: 8, fontSize: 12, color: '#8A5A0A' }}>
            Not yet persisted — this is a configuration UI only. There's no backend settings endpoint for integrations yet, so nothing entered here is saved.
          </div>

          {GENERIC_FIELDS.map((field) => (
            <div key={field} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{field}</div>
              <input
                value={fieldValues[fieldKey(field)] || ''}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [fieldKey(field)]: e.target.value }))}
                placeholder="Not set"
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          {messages[current.name] && (
            <div style={{ marginBottom: 12, padding: '9px 11px', background: '#F0F2F4', borderRadius: 8, fontSize: 12, color: '#334155' }}>
              {messages[current.name]}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleSave} style={primaryBtnStyle}>Save changes</button>
            <button type="button" onClick={handleTest} style={secondaryBtnStyle}>Test connection</button>
          </div>
        </div>
      )}
    </div>
  );
}
