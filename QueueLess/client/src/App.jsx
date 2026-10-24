import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  Command,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Ticket,
  Users,
  X
} from 'lucide-react';
import api from './api';
import { SERVICES, SERVICE_META } from './constants';
import ServiceCard from './components/ServiceCard';
import StatCard from './components/StatCard';
import StatusBadge from './components/StatusBadge';
import EmptyState from './components/EmptyState';
import HelpModal from './components/HelpModal';

function getServiceQueueInfo(token, allTokensList, avgMinutes = 5) {
  if (!token) return { position: 0, peopleAhead: 0, waitMinutes: 0, isFirst: false, servingToken: null };
  const sameServiceTokens = allTokensList.filter(t => t.service === token.service);
  const servingToken = sameServiceTokens.find(t => t.status === 'serving') || null;

  if (token.status === 'serving') {
    return { position: 1, peopleAhead: 0, waitMinutes: 0, isFirst: true, servingToken };
  }

  if (token.status === 'waiting') {
    const waitingAhead = sameServiceTokens.filter(
      t => t.status === 'waiting' && new Date(t.createdAt) < new Date(token.createdAt)
    ).length;
    const peopleAhead = (servingToken ? 1 : 0) + waitingAhead;
    const position = peopleAhead + 1;
    let waitMinutes = 0;
    if (waitingAhead === 0 && !servingToken) {
      waitMinutes = 0;
    } else {
      let servingRemaining = 0;
      if (servingToken) {
        if (servingToken.calledAt) {
          const elapsed = Math.floor((Date.now() - new Date(servingToken.calledAt).getTime()) / 60000);
          servingRemaining = Math.max(1, avgMinutes - Math.max(0, elapsed));
        } else {
          servingRemaining = avgMinutes;
        }
      }
      waitMinutes = Math.max(0, servingRemaining + waitingAhead * avgMinutes);
    }
    return { position, peopleAhead, waitMinutes, isFirst: position === 1, servingToken };
  }

  return { position: 0, peopleAhead: 0, waitMinutes: 0, isFirst: false, servingToken: null };
}

function App() {
  const [page, setPage] = useState('overview');
  const [snapshot, setSnapshot] = useState({
    tokens: [],
    allTokens: [],
    waiting: [],
    serving: null,
    servingByService: {},
    queueByService: {},
    avgServiceMinutes: 5,
    activeServices: SERVICES
  });
  const [stats, setStats] = useState({ total: 0, waiting: 0, serving: 0, served: 0, skipped: 0, byService: {} });
  const [staff, setStaff] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('queueless_staff') || 'null');
    } catch {
      return null;
    }
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [login, setLogin] = useState({ email: 'staff@queueless.local', password: '' });
  const [visitor, setVisitor] = useState({ visitorName: '', service: SERVICES[0] });
  const [created, setCreated] = useState(null);
  const [lookup, setLookup] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [queueFilter, setQueueFilter] = useState('All');
  const [staffFilter, setStaffFilter] = useState(SERVICES[0]);

  const notify = msg => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3400);
  };

  const loadQueue = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await api.get('/tokens');
      setSnapshot(data);
      if (localStorage.getItem('queueless_staff_token')) {
        try {
          const s = await api.get('/tokens/stats');
          setStats(s.data);
        } catch {
          localStorage.removeItem('queueless_staff_token');
          localStorage.removeItem('queueless_staff');
          setStaff(null);
        }
      }
    } catch {
      /* Handled gracefully */
    } finally {
      if (isManual) {
        window.setTimeout(() => setRefreshing(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = window.setInterval(() => loadQueue(false), 5000);
    return () => window.clearInterval(timer);
  }, [loadQueue]);

  const doLogin = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', login);
      localStorage.setItem('queueless_staff_token', data.token);
      localStorage.setItem('queueless_staff', JSON.stringify(data.staff));
      setStaff(data.staff);
      setLoginOpen(false);
      setLogin(p => ({ ...p, password: '' }));
      setPage('overview');
      notify(`Welcome back, ${data.staff.name}`);
      await loadQueue();
    } catch (err) {
      notify(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('queueless_staff_token');
    localStorage.removeItem('queueless_staff');
    setStaff(null);
    setPage('overview');
    notify('You have signed out from staff console.');
  };

  const createToken = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setCreated(null);
    try {
      const { data } = await api.post('/tokens', visitor);
      setCreated(data);
      setVisitor(v => ({ ...v, visitorName: '' }));
      notify(`Token ${data.token.tokenNumber} generated successfully.`);
      await loadQueue();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not create token.');
    } finally {
      setBusy(false);
    }
  };

  const lookupToken = async e => {
    e.preventDefault();
    if (!lookup.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.get('/tokens/mine/' + encodeURIComponent(lookup.trim()));
      setLookupResult(data);
    } catch (err) {
      setLookupResult({ error: err.response?.data?.message || 'Token not found for today.' });
    } finally {
      setBusy(false);
    }
  };

  const action = async (id, kind) => {
    try {
      const { data } = await api.patch(`/tokens/${id}/${kind}`);
      notify(data.message);
      await loadQueue();
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed.');
    }
  };

  const callNextServiceToken = async serviceName => {
    try {
      const { data } = await api.post('/tokens/call-next', { service: serviceName });
      notify(data.message);
      await loadQueue();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not call next visitor.');
    }
  };

  const handleSelectServiceFromCard = serviceName => {
    setVisitor(v => ({ ...v, service: serviceName }));
    setPage('get-token');
    setCreated(null);
  };

  const handleViewQueueFromCard = serviceName => {
    setQueueFilter(serviceName);
    setPage('queue');
  };

  const allTokens = snapshot.allTokens || snapshot.tokens || [];
  const waiting = allTokens.filter(t => t.status === 'waiting');
  const serving = snapshot.serving;
  const average = snapshot.avgServiceMinutes || 5;
  const servingByService = snapshot.servingByService || {};

  // Count active serving desks out of 6
  const activeDesksCount = SERVICES.filter(s => !!servingByService[s]).length;

  // For the visitor token creation form preview
  const visitorSelectedServiceWaiting = waiting.filter(t => t.service === visitor.service);
  const visitorSelectedServiceServing =
    servingByService[visitor.service] || allTokens.find(t => t.service === visitor.service && t.status === 'serving');
  const visitorNewArrivalAhead =
    (visitorSelectedServiceServing ? 1 : 0) + visitorSelectedServiceWaiting.length;
  const visitorNewArrivalWait =
    visitorNewArrivalAhead === 0 ? 0 : visitorNewArrivalAhead * average;

  // Filtered list for the Live Queue page
  const liveQueueFiltered = useMemo(() => {
    return allTokens.filter(t => {
      const isStatusMatch = ['waiting', 'serving'].includes(t.status);
      const isServiceMatch = queueFilter === 'All' || t.service === queueFilter;
      const isSearchMatch = `${t.tokenNumber} ${t.visitorName} ${t.service}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return isStatusMatch && isServiceMatch && isSearchMatch;
    });
  }, [allTokens, queueFilter, query]);

  // Selected service tokens for the Staff Console
  const staffTargetService = staffFilter === 'All' ? null : staffFilter;
  const staffServing = staffTargetService
    ? servingByService[staffTargetService] || allTokens.find(t => t.service === staffTargetService && t.status === 'serving')
    : serving;
  const staffWaiting = allTokens.filter(
    t => t.status === 'waiting' && (!staffTargetService || t.service === staffTargetService)
  );

  const staffStats = useMemo(() => {
    if (!staffTargetService || !stats.byService || !stats.byService[staffTargetService]) {
      return stats;
    }
    return stats.byService[staffTargetService];
  }, [stats, staffTargetService]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Live queue', icon: Users },
    { id: 'get-token', label: 'Get a token', icon: Ticket },
    { id: 'track', label: 'Track token', icon: Search }
  ];

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="app-shell">
      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Command size={20} />
          </div>
          <div className="brand-info">
            <strong>QueueLess</strong>
            <span>CAMPUS QUEUE SYSTEM</span>
          </div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Workspace Card */}
        <button
          className="workspace-card"
          onClick={() => setHelpOpen(true)}
          title="Click to view campus service desk architecture"
        >
          <div className="workspace-icon">
            <Building2 size={16} />
          </div>
          <div className="workspace-copy">
            <b>Campus Services</b>
            <span>6 Active Queues</span>
          </div>
          <ChevronDown size={14} className="workspace-chevron" />
        </button>

        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                setPage(item.id);
                setMobileNav(false);
              }}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.id === 'queue' && <span className="nav-count">{waiting.length}</span>}
            </button>
          ))}
        </nav>

        {staff && (
          <>
            <p className="nav-caption space-top">STAFF TOOLS</p>
            <button
              className={`nav-item ${page === 'staff' ? 'active' : ''}`}
              onClick={() => {
                setPage('staff');
                setMobileNav(false);
              }}
            >
              <ShieldCheck size={17} />
              <span>Staff Console</span>
            </button>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-card-header">
              <HelpCircle size={15} />
              <b>Multi-Desk System</b>
            </div>
            <p>Each campus desk operates an independent queue with zero cross-delay.</p>
            <button onClick={() => setHelpOpen(true)}>
              System guide <ArrowRight size={12} />
            </button>
          </div>

          <div className="profile-row">
            <div className="avatar">{staff ? staff.name.slice(0, 1).toUpperCase() : 'G'}</div>
            <div className="profile-copy">
              <b>{staff?.name || 'Guest Visitor'}</b>
              <span>{staff ? 'Authorized Staff' : 'Student Access'}</span>
            </div>
            {staff ? (
              <button className="icon-btn" title="Sign out" onClick={logout} aria-label="Sign out">
                <LogOut size={16} />
              </button>
            ) : (
              <button className="icon-btn" title="Staff login" onClick={() => setLoginOpen(true)} aria-label="Staff sign in">
                <ShieldCheck size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      {/* --- MAIN AREA --- */}
      <main className="main-area">
        <header className="topbar">
          <div className="crumbs">
            <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <span>Workspace</span>
            <span className="crumb-sep">/</span>
            <b>{navItems.find(n => n.id === page)?.label || 'Staff Console'}</b>
          </div>

          <div className="top-actions">
            <div className="status-live-chip">
              <span className="live-dot-pulse" />
              <span>Live Campus Feed</span>
            </div>
            <div className="date-chip">
              <Clock size={13} />
              <span>{currentDate}</span>
            </div>
            <button
              className="icon-btn"
              title="Refresh queue data"
              onClick={() => loadQueue(true)}
              disabled={refreshing}
              aria-label="Refresh data"
            >
              <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            </button>
            <button
              className="icon-btn"
              title="Campus notifications"
              onClick={() => notify(`${waiting.length} visitors waiting across 6 campus desks.`)}
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
            <div
              className="avatar"
              style={{ width: 30, height: 30, cursor: 'pointer' }}
              onClick={() => (staff ? logout() : setLoginOpen(true))}
              title={staff ? `Logged in as ${staff.name} (Click to sign out)` : 'Click to sign in as staff'}
            >
              {staff ? staff.name.slice(0, 1).toUpperCase() : 'G'}
            </div>
          </div>
        </header>

        <div className="page-content">
          {/* ================= PAGE: OVERVIEW ================= */}
          {page === 'overview' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> CAMPUS SERVICE OVERVIEW
                  </div>
                  <h1>
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
                  </h1>
                  <p className="subheading">
                    Real-time queue tracking and token issuing across 6 campus departments.
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => loadQueue(true)} disabled={refreshing}>
                  <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
                  <span>{refreshing ? 'Refreshing…' : 'Refresh Snapshot'}</span>
                </button>
              </section>

              {/* Refined SaaS Hero Banner */}
              <section className="hero-banner">
                <div className="hero-copy">
                  <div className="hero-badge">
                    <Sparkles size={13} /> REAL-TIME QUEUE MANAGEMENT
                  </div>
                  <h2>Skip the guesswork.<br />Manage campus queues seamlessly.</h2>
                  <p>
                    Select any campus department to generate your token, track your live position on your phone,
                    and step up only when your number is called.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="btn btn-white"
                      onClick={() => {
                        setPage('get-token');
                        setCreated(null);
                      }}
                    >
                      <span>Generate Token</span>
                      <ArrowRight size={15} />
                    </button>
                    <button className="btn btn-glass" onClick={() => setPage('track')}>
                      <span>Track Existing Token</span>
                    </button>
                  </div>
                </div>

                <div className="hero-preview-cards">
                  <div className="hero-card">
                    <div className="hero-card-meta">
                      <span>Now Serving</span>
                      <span className="live-dot-pulse" />
                    </div>
                    <b>{serving?.tokenNumber || '—'}</b>
                    <span className="sub">
                      {serving ? `${serving.visitorName} (${serving.service})` : 'All Desks Ready'}
                    </span>
                  </div>

                  <div className="hero-card">
                    <div className="hero-card-meta">
                      <span>Next in Queue</span>
                      <span style={{ color: 'var(--amber-500)' }}>Waiting</span>
                    </div>
                    <b>{waiting[0]?.tokenNumber || 'Q—'}</b>
                    <span className="sub">
                      {waiting[0] ? `${waiting[0].visitorName} (${waiting[0].service})` : 'Queue Empty'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Dashboard Statistics Grid */}
              <section className="stats-grid">
                <StatCard
                  icon={Users}
                  label="Students Waiting"
                  value={waiting.length}
                  note="Across all desks"
                  tone="indigo"
                />
                <StatCard
                  icon={Activity}
                  label="Desks Active"
                  value={`${activeDesksCount} of 6`}
                  note={activeDesksCount > 0 ? `${activeDesksCount} departments serving` : 'All desks ready'}
                  tone="emerald"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Completed Today"
                  value={stats.totalServed || stats.served || 0}
                  note="Visitors attended"
                  tone="purple"
                />
                <StatCard
                  icon={Clock3}
                  label="Standard Pace"
                  value={`${average} min`}
                  note="Average desk duration"
                  tone="amber"
                />
              </section>

              {/* Campus Service Desks Grid (All 6 Services) */}
              <div className="section-header">
                <div>
                  <h3>Campus Service Desks</h3>
                  <p>Individual department queues running in complete isolation</p>
                </div>
                <button className="text-link" onClick={() => setPage('queue')}>
                  <span>Full Live Monitor</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="service-cards-grid">
                {SERVICES.map(s => {
                  const sWaiting = waiting.filter(t => t.service === s).length;
                  const sServing = servingByService[s] || allTokens.find(t => t.service === s && t.status === 'serving') || null;
                  return (
                    <ServiceCard
                      key={s}
                      serviceName={s}
                      waitingCount={sWaiting}
                      servingToken={sServing}
                      avgMinutes={average}
                      onGetToken={handleSelectServiceFromCard}
                      onViewQueue={handleViewQueueFromCard}
                    />
                  );
                })}
              </div>

              {/* Lower Grid: Live Queue snippet & Quick Actions */}
              <section className="lower-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Live Queue Preview</h3>
                      <p>Most recent waiting tokens across all departments</p>
                    </div>
                    <button className="text-link" onClick={() => setPage('queue')}>
                      <span>View all ({waiting.length})</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="now-serving-box">
                    <div>
                      <span className="small-label">CURRENT ACTIVE VISITOR</span>
                      <div className="current-number">{serving?.tokenNumber || '—'}</div>
                      <span className="current-name">
                        {serving ? `${serving.visitorName} · ${serving.service}` : 'All service counters ready for next student'}
                      </span>
                    </div>
                    <div className="serving-badge-icon">
                      <Ticket size={22} />
                    </div>
                  </div>

                  {waiting.slice(0, 5).map(t => {
                    const info = getServiceQueueInfo(t, allTokens, average);
                    return (
                      <div className="queue-row" key={t._id}>
                        <div className="queue-position-chip">#{info.position}</div>
                        <div className="queue-row-main">
                          <b>
                            {t.tokenNumber} <span>· {t.visitorName}</span>
                          </b>
                          <small>
                            {t.service} · {info.waitMinutes === 0 ? 'No wait' : `~${info.waitMinutes} min est.`}
                          </small>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    );
                  })}

                  {waiting.length === 0 && (
                    <EmptyState
                      title="Queue is Clear"
                      text="There are no students currently waiting. New tokens will appear here."
                    />
                  )}

                  <button
                    className="btn btn-outline full-btn"
                    style={{ marginTop: 16 }}
                    onClick={() => setPage('queue')}
                  >
                    <span>Open Live Queue Monitor</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick Actions</h3>
                      <p>Direct shortcuts</p>
                    </div>
                  </div>

                  <button
                    className="quick-action-item"
                    onClick={() => {
                      setPage('get-token');
                      setCreated(null);
                    }}
                  >
                    <div className="stat-icon stat-icon-indigo">
                      <Plus size={18} />
                    </div>
                    <div>
                      <b>Generate a Token</b>
                      <span>Take a place in line for any department</span>
                    </div>
                    <ArrowRight size={15} color="var(--slate-400)" />
                  </button>

                  <button className="quick-action-item" onClick={() => setPage('track')}>
                    <div className="stat-icon stat-icon-purple">
                      <Search size={18} />
                    </div>
                    <div>
                      <b>Track Your Token</b>
                      <span>Lookup queue status and real-time wait</span>
                    </div>
                    <ArrowRight size={15} color="var(--slate-400)" />
                  </button>

                  <button
                    className="quick-action-item"
                    onClick={() => (staff ? setPage('staff') : setLoginOpen(true))}
                  >
                    <div className="stat-icon stat-icon-emerald">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <b>Staff Console</b>
                      <span>Call visitors and update desk queues</span>
                    </div>
                    <ArrowRight size={15} color="var(--slate-400)" />
                  </button>

                  <button className="quick-action-item" onClick={() => setHelpOpen(true)}>
                    <div className="stat-icon stat-icon-amber">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <b>Architecture Guide</b>
                      <span>Understand queue isolation logic</span>
                    </div>
                    <ArrowRight size={15} color="var(--slate-400)" />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ================= PAGE: GET TOKEN ================= */}
          {page === 'get-token' && (
            <section className="form-page-layout">
              <div className="page-title">
                <div className="eyebrow">
                  <span className="eyebrow-dot" /> VISITOR SERVICES
                </div>
                <h1>Generate Queue Token</h1>
                <p className="subheading">
                  Select your campus department to receive your smart queue token.
                </p>
              </div>

              <div className="token-layout-grid">
                <div className="panel">
                  <div className="form-title-icon">
                    <Ticket size={22} />
                  </div>
                  <h3>New Visitor Token</h3>
                  <p className="subheading" style={{ marginBottom: 20 }}>
                    Enter your name and choose the desk you wish to visit.
                  </p>

                  <form onSubmit={createToken} className="stack-form">
                    <div className="form-group">
                      <label htmlFor="student-name">Your Full Name</label>
                      <input
                        id="student-name"
                        value={visitor.visitorName}
                        onChange={e => setVisitor({ ...visitor, visitorName: e.target.value })}
                        minLength={2}
                        maxLength={80}
                        placeholder="e.g. Aarav Sharma"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="service-select">Campus Department</label>
                      <select
                        id="service-select"
                        value={visitor.service}
                        onChange={e => setVisitor({ ...visitor, service: e.target.value })}
                      >
                        {SERVICES.map(s => (
                          <option key={s} value={s}>
                            {s} ({SERVICE_META[s]?.code || 'SVC'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="info-note">
                      <Clock3 size={18} />
                      <div>
                        <b>Estimated Wait for {visitor.service}:</b>{' '}
                        {visitorNewArrivalWait === 0 ? (
                          <span style={{ color: 'var(--emerald-600)', fontWeight: 700 }}>
                            No waiting time — You will be first in line!
                          </span>
                        ) : (
                          <span>About {visitorNewArrivalWait} minutes ({visitorNewArrivalAhead} person ahead).</span>
                        )}
                      </div>
                    </div>

                    <button className="btn btn-primary full-btn" disabled={busy} style={{ height: 44 }}>
                      <span>{busy ? 'Generating Token…' : 'Generate My Token'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  {/* Created Ticket Pass */}
                  {created && (
                    <div className="created-ticket">
                      <div className="ticket-success-icon">
                        <Check size={24} />
                      </div>
                      <span className="small-label">YOUR TOKEN IS READY</span>
                      <div className="token-large-number">{created.token.tokenNumber}</div>
                      <p style={{ margin: '4px 0 10px', fontSize: 13, color: 'var(--navy-800)' }}>
                        <b>{created.token.visitorName}</b> · <span className="service-badge-tag">{created.token.service}</span>
                      </p>

                      {created.queuePosition === 1 && (
                        <div className="first-badge">
                          <Sparkles size={14} /> You're first in the queue!
                        </div>
                      )}

                      <div className="token-metric-grid">
                        <div className="token-metric-card">
                          <span>Queue Position</span>
                          <b>#{created.queuePosition}</b>
                        </div>
                        <div className="token-metric-card">
                          <span>People Ahead</span>
                          <b>{created.peopleAhead}</b>
                        </div>
                        <div className="token-metric-card">
                          <span>Estimated Wait</span>
                          <b className={created.estimatedWaitMinutes === 0 ? 'zero-wait-badge' : ''}>
                            {created.estimatedWaitMinutes === 0 ? '0 min (No wait)' : `${created.estimatedWaitMinutes} min`}
                          </b>
                        </div>
                      </div>

                      <div className="ticket-dashed" />
                      <p className="ticket-hint">
                        Keep this number handy. Each department queue is independent, so delays in other services will not affect your wait time.
                      </p>

                      <button
                        className="btn btn-outline full-btn"
                        onClick={() => {
                          setLookup(created.token.tokenNumber);
                          setPage('track');
                        }}
                      >
                        <span>Track this Token Live</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Desk Side Panel */}
                <div className="desk-side-panel">
                  <div className="desk-status-card">
                    <span className="small-label">DESK STATUS · {visitor.service}</span>
                    <div className="desk-current-number">{visitorSelectedServiceServing?.tokenNumber || '—'}</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--slate-500)' }}>
                      {visitorSelectedServiceServing ? (
                        <>Currently Serving: <b>{visitorSelectedServiceServing.visitorName}</b></>
                      ) : (
                        'Desk is currently idle · Ready for next student'
                      )}
                    </p>

                    <div className="desk-divider" />

                    <div className="desk-meta-row">
                      <span>
                        <Users size={15} /> Waiting in {visitor.service}
                      </span>
                      <b>{visitorSelectedServiceWaiting.length} visitors</b>
                    </div>

                    <div className="desk-meta-row">
                      <span>
                        <Clock size={15} /> Estimated Wait for New Arrival
                      </span>
                      <b>
                        {visitorNewArrivalWait === 0 ? (
                          <span style={{ color: 'var(--emerald-600)' }}>0 min (No wait)</span>
                        ) : (
                          `${visitorNewArrivalWait} min`
                        )}
                      </b>
                    </div>
                  </div>

                  <div className="help-card">
                    <div className="help-card-header">
                      <HelpCircle size={15} />
                      <b>Department Info</b>
                    </div>
                    <p>{SERVICE_META[visitor.service]?.description}</p>
                    <button onClick={() => setHelpOpen(true)}>
                      View all departments <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= PAGE: TRACK TOKEN ================= */}
          {page === 'track' && (
            <section className="form-page-layout">
              <div className="page-title" style={{ textAlign: 'center' }}>
                <div className="eyebrow">
                  <span className="eyebrow-dot" /> LIVE QUEUE TRACKER
                </div>
                <h1>Track Your Place in Line</h1>
                <p className="subheading">
                  Check your queue position, people ahead, and estimated call time in real time.
                </p>
              </div>

              <div className="panel tracker-box">
                <div className="tracker-symbol-icon">
                  <Search size={26} />
                </div>
                <h3>Check Token Status</h3>
                <p className="subheading">Enter your assigned token number to get live status.</p>

                <form onSubmit={lookupToken} className="tracker-form-row">
                  <input
                    value={lookup}
                    onChange={e => setLookup(e.target.value.toUpperCase())}
                    placeholder="e.g. Q001"
                    required
                    autoFocus
                  />
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    <span>Track</span>
                    <ArrowRight size={15} />
                  </button>
                </form>

                {lookupResult && (
                  lookupResult.error ? (
                    <div className="alert-error">{lookupResult.error}</div>
                  ) : (
                    <div className="track-result-panel">
                      <div className="track-result-header">
                        <span className="small-label">TOKEN DETAILS</span>
                        <StatusBadge status={lookupResult.token.status} />
                      </div>

                      <div className="track-token-title">{lookupResult.token.tokenNumber}</div>
                      <h4 className="track-visitor-name">{lookupResult.token.visitorName}</h4>
                      <div style={{ marginBottom: 14 }}>
                        <span className="service-badge-tag">{lookupResult.token.service}</span>
                      </div>

                      {lookupResult.token.status === 'waiting' && (
                        <>
                          {lookupResult.queuePosition === 1 && (
                            <div className="first-badge">
                              <Sparkles size={14} /> You're first in the queue!
                            </div>
                          )}

                          <div className="token-metric-grid">
                            <div className="token-metric-card">
                              <span>Queue Position</span>
                              <b>#{lookupResult.queuePosition}</b>
                            </div>
                            <div className="token-metric-card">
                              <span>People Ahead</span>
                              <b>{lookupResult.peopleAhead}</b>
                            </div>
                            <div className="token-metric-card">
                              <span>Estimated Wait</span>
                              <b className={lookupResult.estimatedWaitMinutes === 0 ? 'zero-wait-badge' : ''}>
                                {lookupResult.estimatedWaitMinutes === 0 ? 'No wait (0m)' : `${lookupResult.estimatedWaitMinutes} min`}
                              </b>
                            </div>
                          </div>

                          <div className="wait-highlight-box">
                            <Clock3 size={20} />
                            <div>
                              <b>
                                {lookupResult.queuePosition === 1
                                  ? "You're first in line for this desk"
                                  : `${lookupResult.peopleAhead} people ahead in ${lookupResult.token.service}`}
                              </b>
                              <span>
                                {lookupResult.estimatedWaitMinutes === 0
                                  ? 'No waiting time — please stay close to the counter.'
                                  : `Estimated wait time: about ${lookupResult.estimatedWaitMinutes} minutes.`}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {lookupResult.token.status === 'serving' && (
                        <div className="wait-highlight-box" style={{ background: 'var(--emerald-50)', borderColor: 'var(--emerald-border)' }}>
                          <CheckCircle2 size={20} color="var(--emerald-600)" />
                          <div>
                            <b style={{ color: 'var(--emerald-600)' }}>It is your turn!</b>
                            <span>Please proceed immediately to the {lookupResult.token.service} desk.</span>
                          </div>
                        </div>
                      )}

                      {lookupResult.token.status === 'served' && (
                        <div className="wait-highlight-box" style={{ background: 'var(--emerald-50)', borderColor: 'var(--emerald-border)' }}>
                          <CheckCircle2 size={20} color="var(--emerald-600)" />
                          <div>
                            <b style={{ color: 'var(--emerald-600)' }}>Visit Completed</b>
                            <span>Your visit has been successfully completed today.</span>
                          </div>
                        </div>
                      )}

                      {lookupResult.token.status === 'skipped' && (
                        <div className="wait-highlight-box" style={{ background: 'var(--slate-100)' }}>
                          <SkipForward size={20} color="var(--slate-500)" />
                          <div>
                            <b>Token Was Skipped</b>
                            <span>Please speak with staff at the {lookupResult.token.service} desk to be recalled.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* ================= PAGE: LIVE QUEUE ================= */}
          {page === 'queue' && (
            <section>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> LIVE QUEUE MONITOR
                  </div>
                  <h1>Campus Live Queues</h1>
                  <p className="subheading">
                    Real-time view of all active waiting and serving visitors across departments.
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => loadQueue(true)} disabled={refreshing}>
                  <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
                  <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                </button>
              </div>

              {/* Department Filter Pills */}
              <div className="service-filter-bar">
                {['All', ...SERVICES].map(s => {
                  const count = s === 'All' ? waiting.length : waiting.filter(t => t.service === s).length;
                  return (
                    <button
                      key={s}
                      className={`service-pill ${queueFilter === s ? 'active' : ''}`}
                      onClick={() => setQueueFilter(s)}
                    >
                      <span>{s}</span>
                      <span className="service-pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter-Specific Stats */}
              <section className="stats-grid" style={{ marginBottom: 20 }}>
                <StatCard
                  icon={Users}
                  label={queueFilter === 'All' ? 'Waiting Overall' : `Waiting in ${queueFilter}`}
                  value={queueFilter === 'All' ? waiting.length : waiting.filter(t => t.service === queueFilter).length}
                  note="In line"
                  tone="indigo"
                />
                <StatCard
                  icon={Activity}
                  label="Now Serving"
                  value={
                    queueFilter === 'All'
                      ? serving?.tokenNumber || '—'
                      : servingByService[queueFilter]?.tokenNumber || '—'
                  }
                  note={
                    queueFilter === 'All'
                      ? serving ? `${serving.visitorName} (${serving.service})` : 'All desks ready'
                      : servingByService[queueFilter] ? servingByService[queueFilter].visitorName : 'Desk ready'
                  }
                  tone="purple"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Completed Today"
                  value={
                    queueFilter === 'All'
                      ? stats.totalServed || stats.served || 0
                      : stats.byService?.[queueFilter]?.served || 0
                  }
                  note="Attended"
                  tone="emerald"
                />
                <StatCard
                  icon={Clock3}
                  label="Average Duration"
                  value={`${average} min`}
                  note="Per visitor"
                  tone="amber"
                />
              </section>

              {/* Waiting List Table */}
              <div className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Active Tokens · {queueFilter}</h3>
                    <p>Ordered by token creation time with isolated queue metrics</p>
                  </div>
                  <div className="search-box">
                    <Search size={15} />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search token, name, or service…"
                    />
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Student / Visitor</th>
                        <th>Department</th>
                        <th>Queue Position</th>
                        <th>Wait Estimate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveQueueFiltered.map(t => {
                        const info = getServiceQueueInfo(t, allTokens, average);
                        return (
                          <tr key={t._id}>
                            <td>
                              <b className="table-token">{t.tokenNumber}</b>
                            </td>
                            <td>
                              <div className="visitor-cell">
                                <span className="mini-avatar">{t.visitorName.slice(0, 1).toUpperCase()}</span>
                                <span>{t.visitorName}</span>
                              </div>
                            </td>
                            <td>
                              <span className="service-badge-tag">{t.service}</span>
                            </td>
                            <td>
                              {t.status === 'waiting' ? (
                                <b>#{info.position}</b>
                              ) : t.status === 'serving' ? (
                                <span className="zero-wait-badge">At Desk</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {t.status === 'waiting' ? (
                                info.waitMinutes === 0 ? (
                                  <span className="zero-wait-badge">No wait (0 min)</span>
                                ) : (
                                  `${info.waitMinutes} min`
                                )
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <StatusBadge status={t.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {liveQueueFiltered.length === 0 && (
                    <EmptyState
                      title="No Active Tokens"
                      text={`There are no waiting or serving visitors for ${queueFilter === 'All' ? 'any department' : queueFilter} right now.`}
                      actionLabel="Generate a Token"
                      onAction={() => {
                        if (queueFilter !== 'All') {
                          setVisitor(v => ({ ...v, service: queueFilter }));
                        }
                        setPage('get-token');
                      }}
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================= PAGE: STAFF CONSOLE ================= */}
          {page === 'staff' && (
            <section>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> STAFF QUEUE CONSOLE
                  </div>
                  <h1>Service Desk Controls</h1>
                  <p className="subheading">
                    Call next visitors, serve tokens, and manage queues independently for each department.
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => loadQueue(true)} disabled={refreshing}>
                  <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
                  <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                </button>
              </div>

              {!staff ? (
                <div className="panel" style={{ maxWidth: 440, margin: '40px auto', textAlign: 'center' }}>
                  <div className="form-title-icon" style={{ margin: '0 auto 16px' }}>
                    <ShieldCheck size={26} />
                  </div>
                  <h2>Staff Authentication Required</h2>
                  <p className="subheading" style={{ margin: '8px 0 24px' }}>
                    Sign in to call next tokens, serve visitors, and manage campus desk queues.
                  </p>
                  <button className="btn btn-primary full-btn" onClick={() => setLoginOpen(true)}>
                    <span>Staff Sign In</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Department Tabs */}
                  <div className="service-filter-bar">
                    {SERVICES.map(s => {
                      const count = waiting.filter(t => t.service === s).length;
                      const isServing = !!servingByService[s];
                      return (
                        <button
                          key={s}
                          className={`service-pill ${staffFilter === s ? 'active' : ''}`}
                          onClick={() => setStaffFilter(s)}
                        >
                          <span>{s}</span>
                          <span className="service-pill-count">{count}</span>
                          {isServing && <span className="live-dot-pulse" title="Active visitor at desk" />}
                        </button>
                      );
                    })}
                  </div>

                  <section className="stats-grid">
                    <StatCard
                      icon={Users}
                      label={`Waiting (${staffFilter})`}
                      value={staffWaiting.length}
                      note="In department queue"
                      tone="indigo"
                    />
                    <StatCard
                      icon={Activity}
                      label={`Serving (${staffFilter})`}
                      value={staffServing?.tokenNumber || '—'}
                      note={staffServing ? staffServing.visitorName : 'Desk idle'}
                      tone="purple"
                    />
                    <StatCard
                      icon={CheckCircle2}
                      label={`Completed (${staffFilter})`}
                      value={staffStats?.served || 0}
                      note="Attended today"
                      tone="emerald"
                    />
                    <StatCard
                      icon={SkipForward}
                      label={`Skipped (${staffFilter})`}
                      value={staffStats?.skipped || 0}
                      note="Skipped today"
                      tone="amber"
                    />
                  </section>

                  <div className="staff-grid">
                    {/* Active Desk Panel */}
                    <div className="panel">
                      <div className="panel-heading">
                        <div>
                          <h3>Active Desk · {staffFilter}</h3>
                          <p>Current student being attended at the counter</p>
                        </div>
                        <span className="status-live-chip">
                          <span className="live-dot-pulse" />
                          <span>LIVE DESK</span>
                        </span>
                      </div>

                      {staffServing ? (
                        <>
                          <div className="active-token-card">
                            <span className="small-label">NOW SERVING AT COUNTER</span>
                            <strong>{staffServing.tokenNumber}</strong>
                            <h3>{staffServing.visitorName}</h3>
                            <p>{staffServing.service}</p>
                          </div>
                          <button
                            className="btn btn-success full-btn"
                            onClick={() => action(staffServing._id, 'serve')}
                          >
                            <CheckCircle2 size={16} />
                            <span>Mark as Served</span>
                          </button>
                          <button
                            className="btn btn-outline full-btn action-gap"
                            onClick={() => action(staffServing._id, 'skip')}
                          >
                            <SkipForward size={15} />
                            <span>Skip Token</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <EmptyState
                            title={`Desk is Ready for ${staffFilter}`}
                            text={`There is no active visitor at the ${staffFilter} counter. Call the next waiting student to begin.`}
                          />
                          <button
                            className="btn btn-primary full-btn"
                            disabled={staffWaiting.length === 0}
                            onClick={() => callNextServiceToken(staffFilter)}
                          >
                            <span>Call Next {staffFilter} Token</span>
                            <ArrowRight size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Waiting List for this Department */}
                    <div className="panel">
                      <div className="panel-heading">
                        <div>
                          <h3>Waiting Queue · {staffFilter}</h3>
                          <p>{staffWaiting.length} students waiting for this desk</p>
                        </div>
                      </div>

                      {staffWaiting.slice(0, 10).map((t, i) => {
                        const isDeskBusy = !!servingByService[t.service];
                        return (
                          <div className="staff-token-row" key={t._id}>
                            <div className="queue-position-chip">#{String(i + 1).padStart(2, '0')}</div>
                            <div className="staff-token-copy">
                              <b>{t.tokenNumber} · {t.visitorName}</b>
                              <span>
                                {t.service} · {i === 0 && !isDeskBusy ? 'Ready for call' : `${(i + (isDeskBusy ? 1 : 0)) * average} min wait`}
                              </span>
                            </div>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => action(t._id, 'call')}
                              disabled={isDeskBusy}
                              title={isDeskBusy ? `${t.service} is already serving a visitor` : 'Call this visitor'}
                            >
                              Call
                            </button>
                            <button
                              className="icon-btn"
                              title="Skip token"
                              onClick={() => action(t._id, 'skip')}
                              aria-label="Skip visitor"
                            >
                              <SkipForward size={15} />
                            </button>
                          </div>
                        );
                      })}

                      {staffWaiting.length === 0 && (
                        <EmptyState
                          title="No Waiting Visitors"
                          text={`No students are waiting for ${staffFilter} right now.`}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* --- FOOTER --- */}
          <footer className="footer">
            <span>© {new Date().getFullYear()} QueueLess — Smart Token Management System</span>
            <span>
              <span className="footer-dot" /> Academic MCA Micro Project
              <span className="footer-dot" /> Multi-Desk Service Architecture
            </span>
          </footer>
        </div>
      </main>

      {/* --- STAFF LOGIN MODAL --- */}
      {loginOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
        >
          <div className="login-modal">
            <button className="modal-close icon-btn" onClick={() => setLoginOpen(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="form-title-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> AUTHORIZED ACCESS
            </div>
            <h2>Staff Console Sign In</h2>
            <p className="subheading" style={{ marginBottom: 20 }}>
              Enter staff credentials to manage campus queues.
            </p>

            <form onSubmit={doLogin} className="stack-form">
              <div className="form-group">
                <label htmlFor="staff-email">Staff Email</label>
                <input
                  id="staff-email"
                  type="email"
                  value={login.email}
                  onChange={e => setLogin({ ...login, email: e.target.value })}
                  required
                  autoComplete="username"
                  placeholder="e.g. staff@queueless.local"
                />
              </div>

              <div className="form-group">
                <label htmlFor="staff-password">Password</label>
                <input
                  id="staff-password"
                  type="password"
                  value={login.password}
                  onChange={e => setLogin({ ...login, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  placeholder="Enter staff password"
                />
              </div>

              <button className="btn btn-primary full-btn" disabled={busy} style={{ height: 42 }}>
                <span>{busy ? 'Signing in…' : 'Sign In Securely'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="secure-note">
              <ShieldCheck size={14} color="var(--emerald-600)" />
              <span>Protected staff session · JWT authentication</span>
            </div>
          </div>
        </div>
      )}

      {/* --- ARCHITECTURE & CAMPUS DESKS HELP MODAL --- */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        onSelectService={handleSelectServiceFromCard}
      />

      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default App;
