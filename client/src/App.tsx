import React, { useState, useEffect } from 'react';
import './App.css';
import { api, getToken } from './api';
import { User, Project, Approval, AuditEvent } from './types';

export const REVIEWER_CREDENTIALS = [
  { role: 'admin', email: 'admin@cyberheist.local', password: 'Password123!', title: 'Admin Reviewer' },
  { role: 'operator', email: 'operator@cyberheist.local', password: 'Password123!', title: 'Operator Reviewer' },
  { role: 'analyst', email: 'analyst@cyberheist.local', password: 'Password123!', title: 'Analyst Reviewer' }
];

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'approvals' | 'audit'>('projects');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@cyberheist.local');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [authError, setAuthError] = useState<string | null>(null);

  // App data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Project creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRisk, setNewRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newBudget, setNewBudget] = useState(100000);

  // Comment state
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    async function checkAuth() {
      if (getToken()) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } catch {
          api.logout();
          setCurrentUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, activeTab]);

  async function loadData() {
    try {
      if (activeTab === 'projects') {
        const p = await api.getProjects();
        setProjects(p);
      } else if (activeTab === 'approvals') {
        const a = await api.getApprovals();
        setApprovals(a);
      } else if (activeTab === 'audit') {
        const ev = await api.getAuditLog();
        setAuditEvents(ev);
      }
    } catch (err: any) {
      setStatusMessage(`Failed to load data: ${err.message}`);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setCurrentUser(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  }

  function handleQuickFill(email: string, pass: string) {
    setLoginEmail(email);
    setLoginPassword(pass);
  }

  async function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setSelectedProject(null);
  }

  async function handleReseed() {
    try {
      setStatusMessage('Reseeding database with deterministic demo data...');
      await api.reseedData();
      await loadData();
      if (selectedProject) {
        const refreshed = await api.getProject(selectedProject.id);
        setSelectedProject(refreshed);
      }
      setStatusMessage('Reseed complete!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Reseed failed: ${err.message}`);
    }
  }

  async function handleSelectProject(proj: Project) {
    try {
      const full = await api.getProject(proj.id);
      setSelectedProject(full);
    } catch (err: any) {
      setStatusMessage(`Error loading project details: ${err.message}`);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createProject({
        title: newTitle,
        target_system: newTarget,
        description: newDescription,
        risk_level: newRisk,
        budget: newBudget
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewTarget('');
      setNewDescription('');
      loadData();
      setStatusMessage('Project operation initialized successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Creation error: ${err.message}`);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !commentText.trim()) return;
    try {
      await api.addComment(selectedProject.id, commentText.trim());
      setCommentText('');
      const updated = await api.getProject(selectedProject.id);
      setSelectedProject(updated);
    } catch (err: any) {
      setStatusMessage(`Comment error: ${err.message}`);
    }
  }

  async function handleDecideApproval(approvalId: string, decision: 'approved' | 'rejected') {
    try {
      await api.decideApproval(approvalId, decision);
      loadData();
      if (selectedProject) {
        const updated = await api.getProject(selectedProject.id);
        setSelectedProject(updated);
      }
    } catch (err: any) {
      setStatusMessage(`Approval decision failed: ${err.message}`);
    }
  }

  if (loading) {
    return <div className="app-container"><div style={{ padding: '2rem' }}>Initializing security console...</div></div>;
  }

  if (!currentUser) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="brand">
            <span role="img" aria-label="shield" style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h1>Project Cyber Heist</h1>
            <span className="badge-env">LOCAL / DEV</span>
          </div>
        </header>

        <main className="main-content">
          <div className="login-wrapper">
            <h2>Console Authentication</h2>
            
            <div className="reviewer-credentials-box">
              <h4>Reviewer Quick-Access Credentials:</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Click any role below to populate credentials:</p>
              <div className="cred-buttons">
                {REVIEWER_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    className="cred-chip"
                    onClick={() => handleQuickFill(cred.email, cred.password)}
                  >
                    {cred.role.toUpperCase()} ({cred.email})
                  </button>
                ))}
              </div>
            </div>

            {authError && <div style={{ color: '#f43f5e', marginBottom: '1rem', fontSize: '0.875rem' }}>{authError}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Authenticate
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <span role="img" aria-label="shield" style={{ fontSize: '1.5rem' }}>🛡️</span>
          <h1>Project Cyber Heist</h1>
          <span className="badge-env">OPERATIONAL</span>
        </div>
        <div className="nav-user">
          <span className="user-tag">
            Agent: <strong>{currentUser.username}</strong> [{currentUser.role}]
          </span>
          <button onClick={handleReseed} className="btn-secondary" title="Reseed deterministic data">
            Reset Demo Data
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Disconnect
          </button>
        </div>
      </header>

      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => { setActiveTab('projects'); setSelectedProject(null); }}
        >
          Heist Operations
        </button>
        <button
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => { setActiveTab('approvals'); setSelectedProject(null); }}
        >
          Authorization Queue
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => { setActiveTab('audit'); setSelectedProject(null); }}
        >
          Audit Ledger
        </button>
      </nav>

      {statusMessage && (
        <div style={{ backgroundColor: '#1e293b', padding: '0.75rem 2rem', color: '#38bdf8', fontSize: '0.9rem' }}>
          {statusMessage}
        </div>
      )}

      <main className="main-content">
        {activeTab === 'projects' && !selectedProject && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Active Cyber Operations</h2>
              {(currentUser.role === 'admin' || currentUser.role === 'operator') && (
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Initialize Operation
                </button>
              )}
            </div>

            {showCreateModal && (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', margin: '1.5rem 0', border: '1px solid var(--border-color)' }}>
                <h3>Initialize Target Operation</h3>
                <form onSubmit={handleCreateProject} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Operation Title</label>
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Target System</label>
                    <input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Risk Level</label>
                      <select value={newRisk} onChange={(e: any) => setNewRisk(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Budget ($)</label>
                      <input type="number" value={newBudget} onChange={(e) => setNewBudget(Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary">Launch</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="projects-grid">
              {projects.map((proj) => (
                <div key={proj.id} className="project-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className={`badge badge-${proj.risk_level}`}>{proj.risk_level}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{proj.status}</span>
                    </div>
                    <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>{proj.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{proj.description}</p>
                    <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Target: {proj.target_system}</div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>${proj.budget.toLocaleString()}</span>
                    <button className="btn-secondary" onClick={() => handleSelectProject(proj)}>
                      Inspect Details &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && selectedProject && (
          <div>
            <button className="btn-secondary" onClick={() => setSelectedProject(null)} style={{ marginBottom: '1rem' }}>
              &larr; Back to Operations
            </button>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{selectedProject.title}</h2>
                <span className={`badge badge-${selectedProject.risk_level}`}>{selectedProject.risk_level} RISK</span>
              </div>
              <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>{selectedProject.description}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
                <div>Target: <strong>{selectedProject.target_system}</strong></div>
                <div>Status: <strong>{selectedProject.status}</strong></div>
                <div>Budget: <strong>${selectedProject.budget.toLocaleString()}</strong></div>
              </div>

              {/* Approvals */}
              <div style={{ marginTop: '2rem' }}>
                <h3>Authorizations</h3>
                {(!selectedProject.approvals || selectedProject.approvals.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>No authorization requests.</p>
                ) : (
                  <div style={{ marginTop: '0.5rem' }}>
                    {selectedProject.approvals.map((appr) => (
                      <div key={appr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div>
                          <div>Status: <span className={`badge badge-${appr.status}`}>{appr.status}</span></div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{appr.comments}</div>
                        </div>
                        {currentUser.role === 'admin' && appr.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-success" onClick={() => handleDecideApproval(appr.id, 'approved')}>Approve</button>
                            <button className="btn-danger" onClick={() => handleDecideApproval(appr.id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div style={{ marginTop: '2rem' }}>
                <h3>Mission Log & Comments</h3>
                <div style={{ marginTop: '0.5rem' }}>
                  {(selectedProject.comments || []).map((c) => (
                    <div key={c.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#38bdf8' }}>
                        <span>{c.author_name}</span>
                        <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{c.content}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Add operational log comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem', borderRadius: '4px' }}
                  />
                  <button type="submit" className="btn-primary">Post</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div>
            <h2>Mission Authorization Queue</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Approval ID</th>
                  <th>Project ID</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Comments</th>
                  {currentUser.role === 'admin' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{a.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{a.project_id}</td>
                    <td>{a.requested_by}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td>{a.comments || '-'}</td>
                    {currentUser.role === 'admin' && (
                      <td>
                        {a.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-success" onClick={() => handleDecideApproval(a.id, 'approved')}>Approve</button>
                            <button className="btn-danger" onClick={() => handleDecideApproval(a.id, 'rejected')}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Decided</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <h2>Security Audit Ledger</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(e.timestamp).toLocaleString()}</td>
                    <td><strong style={{ color: '#38bdf8' }}>{e.action}</strong></td>
                    <td>{e.actor_name || 'system'}</td>
                    <td>{e.target_type ? `${e.target_type}:${e.target_id || ''}` : '-'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{e.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
