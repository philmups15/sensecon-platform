import { useRef, useState } from 'react';
import Spinner from './Spinner';

export default function HandoverBundle({
  items = [],
  generatedDate = '—',
  onDownload,
  onUpload,
  canUpload = false,
  emptyLabel = 'No documents yet.',
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0 || !onUpload) return;
    setUploading(true);
    setError('');
    try {
      await onUpload(files);
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #D7E4E1', borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #D7E4E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#12201F' }}>Handover bundle</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#52685F' }}>Generated {generatedDate}</div>
          {canUpload && (
            <>
              <input ref={fileInput} type="file" multiple onChange={handleFiles} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                style={{ border: 'none', background: '#1F6E72', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.7 : 1 }}
              >
                {uploading && <Spinner size={11} color="#fff" />}Upload
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div style={{ margin: '10px 18px 0', padding: '7px 10px', background: '#FBE7E5', color: '#A6362E', borderRadius: 8, fontSize: 12 }}>{error}</div>}

      {items.length === 0 && <div style={{ padding: '18px', fontSize: 13, color: '#78908A' }}>{emptyLabel}</div>}

      {items.map((item, i) => (
        <div
          key={item.id ?? i}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 18px',
            borderBottom: '1px solid #E9F1EF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#F4F8F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#52685F',
              }}
            >
              {item.ext}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#12201F' }}>{item.name}</div>
              <div style={{ fontSize: 11.5, color: '#78908A' }}>{item.meta}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDownload && onDownload(item)}
            disabled={!onDownload}
            style={{
              border: '1px solid #D7E4E1',
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#52685F',
              cursor: onDownload ? 'pointer' : 'default',
            }}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
