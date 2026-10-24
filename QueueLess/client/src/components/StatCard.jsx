import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, note, tone = 'indigo', badge }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon stat-icon-${tone}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {badge ? (
          <span className="stat-badge">{badge}</span>
        ) : (
          <span className="stat-note">
            <span className={`stat-note-dot dot-${tone}`} />
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
