import React from 'react';
import { X, CheckCircle, Shield, Clock, Users, ArrowRight } from 'lucide-react';
import { SERVICES, SERVICE_META } from '../constants';

export default function HelpModal({ isOpen, onClose, onSelectService }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="help-modal">
        <button className="modal-close icon-btn" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="help-modal-header">
          <div className="form-title-icon">
            <Shield size={24} />
          </div>
          <h2>Campus Queue Architecture</h2>
          <p className="subheading">
            How QueueLess manages independent service desks across your institution.
          </p>
        </div>

        <div className="help-modal-body">
          <div className="help-feature-grid">
            <div className="help-feature-card">
              <div className="help-feature-icon">
                <Users size={18} />
              </div>
              <h4>Independent Queues</h4>
              <p>
                Each of the 6 campus departments maintains a fully isolated queue. Waiting in Accounts
                does not impact waiting time or queue position in the Canteen or Library.
              </p>
            </div>
            <div className="help-feature-card">
              <div className="help-feature-icon">
                <Clock size={18} />
              </div>
              <h4>Accurate Estimations</h4>
              <p>
                If a service desk has no active visitor, new arrivals receive an estimated wait time
                of 0 minutes and queue position #1.
              </p>
            </div>
          </div>

          <h3 className="help-subheading">Available Campus Departments</h3>
          <div className="help-service-list">
            {SERVICES.map(s => {
              const meta = SERVICE_META[s];
              return (
                <div key={s} className="help-service-item">
                  <div>
                    <span className="help-code">{meta?.code || 'SVC'}</span>
                    <strong>{s}</strong>
                    <p>{meta?.description}</p>
                  </div>
                  {onSelectService && (
                    <button
                      className="btn btn-small btn-outline"
                      onClick={() => {
                        onSelectService(s);
                        onClose();
                      }}
                    >
                      Get Token <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="help-modal-footer">
          <button className="btn btn-primary full-btn" onClick={onClose}>
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
}
