import React from 'react';
import {
  HelpCircle,
  GraduationCap,
  CreditCard,
  BookOpen,
  Utensils,
  Lightbulb,
  Layers,
  ArrowRight,
  Clock,
  Users
} from 'lucide-react';
import { SERVICE_META } from '../constants';

const ICON_MAP = {
  'General Enquiry': HelpCircle,
  'Exam Section': GraduationCap,
  'Accounts': CreditCard,
  'Library': BookOpen,
  'College Canteen': Utensils,
  'Idea Lab': Lightbulb
};

export default function ServiceCard({
  serviceName,
  waitingCount = 0,
  servingToken = null,
  avgMinutes = 5,
  onGetToken,
  onViewQueue
}) {
  const meta = SERVICE_META[serviceName] || {
    code: 'SVC',
    description: 'Campus service desk',
    color: 'indigo'
  };
  const Icon = ICON_MAP[serviceName] || Layers;

  const hasServing = !!servingToken;
  const isIdle = !hasServing && waitingCount === 0;
  const waitMinutes = isIdle ? 0 : (waitingCount + (hasServing ? 1 : 0)) * avgMinutes;

  return (
    <div className={`service-card service-card-${meta.color}`}>
      <div className="service-card-top">
        <div className={`service-icon-wrap icon-wrap-${meta.color}`}>
          <Icon size={20} />
        </div>
        <span className="service-code-pill">{meta.code}</span>
      </div>

      <div className="service-card-body">
        <h3 className="service-title">{serviceName}</h3>
        <p className="service-desc">{meta.description}</p>

        <div className="service-status-row">
          {hasServing ? (
            <div className="serving-chip">
              <span className="live-dot-pulse" />
              <span>Serving: <b>{servingToken.tokenNumber}</b></span>
              <span className="serving-name-truncate">({servingToken.visitorName})</span>
            </div>
          ) : (
            <div className="idle-chip">
              <span className="idle-dot" />
              <span>Desk Ready · No Active Queue</span>
            </div>
          )}
        </div>

        <div className="service-metrics-row">
          <div className="service-metric-item">
            <Users size={14} className="metric-icon" />
            <span><b>{waitingCount}</b> waiting</span>
          </div>
          <div className="service-metric-divider" />
          <div className="service-metric-item">
            <Clock size={14} className="metric-icon" />
            <span>
              {waitMinutes === 0 ? (
                <b className="zero-wait-text">No wait (0 min)</b>
              ) : (
                <>Est. <b>{waitMinutes}m</b></>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="service-card-actions">
        <button
          className="btn btn-primary btn-small full-btn"
          onClick={() => onGetToken && onGetToken(serviceName)}
          title={`Generate queue token for ${serviceName}`}
        >
          <span>Get Token</span>
          <ArrowRight size={14} />
        </button>
        <button
          className="btn-text-subtle"
          onClick={() => onViewQueue && onViewQueue(serviceName)}
          title={`View live queue for ${serviceName}`}
        >
          View Desk Queue
        </button>
      </div>
    </div>
  );
}
