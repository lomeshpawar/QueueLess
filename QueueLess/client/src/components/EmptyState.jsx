import React from 'react';
import { Ticket, ArrowRight } from 'lucide-react';

export default function EmptyState({ title, text, icon: Icon = Ticket, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={22} />
      </div>
      <b>{title}</b>
      <p>{text}</p>
      {actionLabel && onAction && (
        <button className="btn btn-outline btn-small empty-action" onClick={onAction}>
          {actionLabel} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
