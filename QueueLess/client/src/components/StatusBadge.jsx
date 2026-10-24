import React from 'react';

const pretty = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase() || 'waiting';
  return (
    <span className={`status-badge status-${normalized}`}>
      <span className="badge-dot" />
      {pretty(normalized)}
    </span>
  );
}
