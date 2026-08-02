import { useEffect, useState } from 'react';
import Chip from '../../components/Chip';
import Spinner from '../../components/Spinner';
import { getIntegrationSettings, updateIntegrationSetting } from '../../lib/api';
import { inputStyle, primaryBtnStyle, secondaryBtnStyle, cardStyle, sectionHeaderStyle, errorBannerStyle, TabStrip } from './shared';

export default function AdminIntegrations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  const [providerEndpoint, setProviderEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    getIntegrationSettings()
      .then((rows) => {
        setItems(rows);
        if (rows.length > 0) setActive(rows[0].key);
      })
      .catch((err) => setError(err.message || 'Failed to load integrations.'))
      .finally(() => setLoading(false));
  }, []);

  const current = items.find((i) => i.key === active);

  // Re-sync the form whenever the selected tab changes — the API key field
  // always starts blank (the server never returns the real value, only
  // whether one is set), so switching tabs can't leak one integration's
  // in-progress edit into another's.
  useEffect(() => {
    if (!current) return;
    setProviderEndpoint(current.providerEndpoint || '');
    setApiKey('');
    setClearApiKey(false);
    setNotes(current.notes || '');
    setSaveError('');
    setSaveMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key]);

  const tabs = items.map((i) => [i.key, i.name]);

  const handleSelectTab = (key) => {
    setActive(key);
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const updated = await updateIntegrationSetting(current.key, {
        providerEndpoint: providerEndpoint.trim() || null,
        apiKey: clearApiKey ? '' : apiKey || null,
        clearApiKey,
        notes: notes.trim() || null,
      });
      setItems((prev) => prev.map((i) => (i.key === current.key ? updated : i)));
      setApiKey('');
      setClearApiKey(false);
      setSaveMessage('Saved.');
    } catch (err) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    setSaveError('');
    setSaveMessage("This only stores configuration values — nothing in this app actually calls the SMS/WhatsApp/weather/tariff providers yet, so there's no live connection to test.");
  };

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Integrations</div>
          <div style={{ fontSize: 12.5, color: '#9AA0A6', marginTop: 2 }}>Connect and configure the services this tenant relies on.</div>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6', padding: '8px 0' }}><Spinner size={14} />Loading…</div>}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {!loading && !error && (
        <>
          <TabStrip tabs={tabs} active={active} onChange={handleSelectTab} />

          {current && (
            <div style={{ ...cardStyle, marginTop: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{current.name}</div>
                <Chip label={current.status} tone={current.status === 'Connected' ? 'green' : 'slate'} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Provider / endpoint</div>
                <input
                  value={providerEndpoint}
                  onChange={(e) => setProviderEndpoint(e.target.value)}
                  placeholder="Not set"
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>API key or credential</div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); if (e.target.value) setClearApiKey(false); }}
                  disabled={clearApiKey}
                  placeholder={current.hasApiKey ? '•••••••• (set — leave blank to keep it)' : 'Not set'}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', opacity: clearApiKey ? 0.5 : 1 }}
                />
                {current.hasApiKey && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#6A7178' }}>
                    <input type="checkbox" checked={clearApiKey} onChange={(e) => { setClearApiKey(e.target.checked); if (e.target.checked) setApiKey(''); }} />
                    Remove the saved key
                  </label>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Notes</div>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Not set"
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {saveError && <div style={{ ...errorBannerStyle, marginBottom: 12 }}>{saveError}</div>}
              {saveMessage && (
                <div style={{ marginBottom: 12, padding: '9px 11px', background: '#F0F2F4', borderRadius: 8, fontSize: 12, color: '#334155' }}>
                  {saveMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving && <Spinner size={11} color="#fff" />}Save changes
                </button>
                <button type="button" onClick={handleTest} style={secondaryBtnStyle}>Test connection</button>
              </div>

              {current.lastModified && (
                <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 12 }}>
                  Last updated {new Date(current.lastModified).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
