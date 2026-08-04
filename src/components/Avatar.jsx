import { useEffect, useState } from 'react';
import { getAvatarBlobUrl } from '../lib/api';

function initialsOf(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Avatar({ userId, name, hasAvatar, size = 32, fontSize }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!hasAvatar || !userId) {
      setUrl(null);
      return undefined;
    }
    let objectUrl;
    let cancelled = false;
    getAvatarBlobUrl(userId).then((u) => {
      if (cancelled) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      objectUrl = u;
      setUrl(u);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, hasAvatar]);

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Avatar'}
        style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', flex: 'none' }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: '#EAF0FE',
        color: '#1E4FC4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: fontSize || Math.round(size * 0.4),
        flex: 'none',
      }}
    >
      {initialsOf(name) || '…'}
    </div>
  );
}
