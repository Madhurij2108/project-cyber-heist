import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './runtime/config';
import { validateLoginInput, validateRegisterInput, validateProjectInput } from './auth/validation';
import { verifyPassword, hashPassword } from './auth/password';
import { signToken } from './auth/jwt';
import { authenticate, authorize, AuthenticatedRequest } from './auth/middleware';
import { getRolePermissions } from './auth/rbac';
import { store } from './domain/store';
import { seedDatabase, resetDatabase, getSeedSummary } from './seed/seedRunner';
import { ProjectStatus, ApprovalStatus } from './domain/types';

export const app = express();

app.use(cors());
app.use(express.json());

// Initialize seed store
seedDatabase();

// 1. Interactive Reviewer Console & Demo Login UI (Root & /login)
function getReviewerConsoleHtml(): string {
  const summary = getSeedSummary();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Cyber Heist // Operations & Reviewer Console</title>
  <style>
    :root {
      --bg: #07090e;
      --card-bg: #0e131f;
      --border: #1e2640;
      --cyan: #00ffcc;
      --pink: #ff007f;
      --yellow: #ffd700;
      --text: #c8d3f5;
      --text-dim: #7982a9;
      --text-bright: #ffffff;
      --danger: #ff5370;
      --success: #c3e88d;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      line-height: 1.5;
      padding: 24px 16px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 {
      color: var(--cyan);
      font-size: 1.6rem;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-shadow: 0 0 10px rgba(0, 255, 204, 0.4);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-env { background: rgba(0, 255, 204, 0.15); color: var(--cyan); border: 1px solid var(--cyan); }
    .badge-role { background: rgba(255, 0, 127, 0.2); color: var(--pink); border: 1px solid var(--pink); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .card h2 {
      font-size: 1.1rem;
      color: var(--pink);
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .creds-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 12px; }
    .creds-table th, .creds-table td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border); }
    .creds-table th { color: var(--text-dim); }
    .code { font-family: 'Consolas', 'Courier New', monospace; color: var(--cyan); }
    .btn {
      display: inline-block;
      background: rgba(0, 255, 204, 0.15);
      color: var(--cyan);
      border: 1px solid var(--cyan);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn:hover {
      background: var(--cyan);
      color: #000;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
    }
    .btn-secondary {
      background: rgba(255, 0, 127, 0.15);
      color: var(--pink);
      border-color: var(--pink);
    }
    .btn-secondary:hover {
      background: var(--pink);
      color: #fff;
      box-shadow: 0 0 10px rgba(255, 0, 127, 0.6);
    }
    .input-group { margin-bottom: 12px; }
    .input-group label { display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px; }
    .input-group input, .input-group select {
      width: 100%;
      padding: 8px 10px;
      background: #080b14;
      border: 1px solid var(--border);
      color: var(--text-bright);
      border-radius: 4px;
      font-family: inherit;
    }
    .input-group input:focus, .input-group select:focus {
      outline: none;
      border-color: var(--cyan);
      box-shadow: 0 0 5px rgba(0, 255, 204, 0.5);
    }
    #auth-result {
      margin-top: 14px;
      padding: 12px;
      border-radius: 4px;
      background: #080b14;
      border: 1px solid var(--border);
      font-size: 0.85rem;
      display: none;
    }
    .links-bar { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; }
    pre { overflow-x: auto; font-family: 'Consolas', monospace; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Project Cyber Heist // Operations Terminal</h1>
        <p style="color: var(--text-dim); font-size: 0.85rem;">Containerized Heist Operations & Governance Engine</p>
      </div>
      <div>
        <span class="badge badge-env">${config.environment.toUpperCase()}</span>
        <span class="badge badge-role">v${config.version}</span>
      </div>
    </header>

    <div class="grid">
      <!-- Demo Credentials Card -->
      <div class="card">
        <h2>Reviewer & Demo Credentials</h2>
        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 12px;">
          Click "Select" to pre-fill the interactive terminal.
        </p>
        <table class="creds-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Email</th>
              <th>Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${summary.users
              .map(
                (u) => `
            <tr>
              <td><span class="badge badge-role">${u.role}</span></td>
              <td class="code">${u.email}</td>
              <td class="code">${u.password}</td>
              <td><button class="btn" onclick="fillForm('${u.email}', '${u.password}')">Select</button></td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="links-bar">
          <button class="btn btn-secondary" onclick="resetDb()">Reset Seed Data</button>
          <a class="btn" href="/health" target="_blank">Healthcheck</a>
          <a class="btn" href="/api/seed/summary" target="_blank">Seed JSON</a>
        </div>
      </div>

      <!-- Interactive Login Form Card -->
      <div class="card">
        <h2>Interactive Authentication Terminal</h2>
        <div class="input-group">
          <label>Email Address</label>
          <input type="email" id="email" value="admin@cyberheist.local" />
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="password" id="password" value="ChangeMe!12345" />
        </div>
        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button class="btn" onclick="handleLogin()">Authenticate</button>
          <button class="btn btn-secondary" onclick="handleLogout()">Clear Session</button>
        </div>
        <div id="auth-result"></div>
      </div>
    </div>

    <!-- Active Projects / Missions Card -->
    <div class="card">
      <h2>Active Heist Projects & Status Boundaries</h2>
      <div id="projects-list" style="font-size: 0.85rem; color: var(--text-dim);">
        Loading active missions...
      </div>
    </div>
  </div>

  <script>
    function fillForm(email, pwd) {
      document.getElementById('email').value = email;
      document.getElementById('password').value = pwd;
    }

    async function handleLogin() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const resultDiv = document.getElementById('auth-result');

      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<span style="color: var(--yellow)">Authenticating credentials...</span>';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('heist_token', data.token);
          resultDiv.innerHTML = \`
            <p style="color: var(--success); font-weight: bold; margin-bottom: 6px;">[✓] Authentication Successful</p>
            <p><strong>Identity:</strong> \${data.user.name} (\${data.user.email})</p>
            <p><strong>Role:</strong> <span class="badge badge-role">\${data.user.role}</span></p>
            <p><strong>Permissions:</strong> \${data.user.permissions.join(', ')}</p>
            <p style="margin-top: 8px;"><strong>Bearer Token:</strong></p>
            <pre style="color: var(--cyan); word-break: break-all;">\${data.token}</pre>
          \`;
          loadProjects();
        } else {
          resultDiv.innerHTML = \`<p style="color: var(--danger)">[✗] Error: \${data.message || 'Login failed'}</p>\`;
        }
      } catch (err) {
        resultDiv.innerHTML = \`<p style="color: var(--danger)">[✗] Request Error: \${err.message}</p>\`;
      }
    }

    function handleLogout() {
      localStorage.removeItem('heist_token');
      const resultDiv = document.getElementById('auth-result');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<p style="color: var(--text-dim)">Session cleared.</p>';
      loadProjects();
    }

    async function resetDb() {
      if (!confirm('Reset local seed database to initial state?')) return;
      try {
        const res = await fetch('/api/seed/reset', { method: 'POST' });
        const data = await res.json();
        alert('Seed database successfully reset!');
        location.reload();
      } catch (err) {
        alert('Reset failed: ' + err.message);
      }
    }

    async function loadProjects() {
      const pList = document.getElementById('projects-list');
      const token = localStorage.getItem('heist_token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

      try {
        const res = await fetch('/api/projects', { headers });
        if (res.ok) {
          const projects = await res.json();
          pList.innerHTML = \`
            <table class="creds-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title / Codename</th>
                  <th>Target</th>
                  <th>Take</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                \${projects.map(p => \`
                  <tr>
                    <td class="code">\${p.id}</td>
                    <td><strong>\${p.title}</strong> (\${p.codeName})</td>
                    <td>\${p.target}</td>
                    <td class="code">$\${p.estimatedTake.toLocaleString()}</td>
                    <td><span class="badge" style="background: rgba(255, 215, 0, 0.2); color: var(--yellow);">\${p.riskLevel}</span></td>
                    <td><span class="badge badge-env">\${p.status}</span></td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          \`;
        } else {
          pList.innerHTML = '<p style="color: var(--text-dim)">Authenticate to view protected heist mission manifests.</p>';
        }
      } catch {
        pList.innerHTML = '<p style="color: var(--danger)">Failed to load mission registry.</p>';
      }
    }

    loadProjects();
  </script>
</body>
</html>`;
}

app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getReviewerConsoleHtml());
});

app.get('/login', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getReviewerConsoleHtml());
});

// 2. Health Endpoint (autorun for Docker healthcheck)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: config.serviceName,
    version: config.version,
    environment: config.environment,
    timestamp: new Date().toISOString(),
  });
});

// 3. Seed & Review Data Endpoints
app.get('/api/seed/summary', (req: Request, res: Response) => {
  res.status(200).json(getSeedSummary());
});

app.post('/api/seed/reset', (req: Request, res: Response) => {
  resetDatabase();
  res.status(200).json({
    status: 'ok',
    message: 'Database reset and reseeded successfully',
    summary: getSeedSummary(),
  });
});

// 4. Authentication Endpoints
app.post('/api/auth/login', (req: Request, res: Response): void => {
  const validation = validateLoginInput(req.body);
  if (!validation.isValid) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed',
      errors: validation.errors,
    });
    return;
  }

  const { email, password } = req.body;
  const user = store.getUserByEmail(email);

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    return;
  }

  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    permissions: user.permissions,
  });

  store.logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'USER_LOGIN',
    resourceType: 'auth',
    resourceId: user.id,
    details: { role: user.role },
  });

  const { passwordHash, salt, ...safeUser } = user;
  res.status(200).json({
    token,
    user: safeUser,
    expiresIn: config.jwtExpiresIn,
  });
});

app.post('/api/auth/register', (req: Request, res: Response): void => {
  const validation = validateRegisterInput(req.body);
  if (!validation.isValid) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed',
      errors: validation.errors,
    });
    return;
  }

  const { email, password, name, role = 'operator', organizationId = 'ws-syndicate-01' } = req.body;
  const existing = store.getUserByEmail(email);

  if (existing) {
    res.status(409).json({
      error: 'Conflict',
      message: 'User with this email already exists',
    });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const permissions = getRolePermissions(role);
  const newUser = {
    id: `usr-${Date.now()}`,
    email: email.toLowerCase().trim(),
    name,
    role,
    organizationId,
    permissions,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addUser(newUser);

  store.logAudit({
    actorId: newUser.id,
    actorEmail: newUser.email,
    action: 'USER_REGISTER',
    resourceType: 'auth',
    resourceId: newUser.id,
    details: { role, organizationId },
  });

  const token = signToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    organizationId: newUser.organizationId,
    permissions: newUser.permissions,
  });

  const { passwordHash: _ph, salt: _s, ...safeUser } = newUser;
  res.status(201).json({
    token,
    user: safeUser,
    expiresIn: config.jwtExpiresIn,
  });
});

app.post('/api/auth/logout', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    store.logAudit({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      action: 'USER_LOGOUT',
      resourceType: 'auth',
      resourceId: req.user.userId,
    });
  }

  res.status(200).json({
    status: 'ok',
    message: 'Logged out successfully',
  });
});

app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = store.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'Not Found', message: 'User not found' });
    return;
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.status(200).json({ user: safeUser });
});

app.get('/api/auth/verify', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
});

// 5. Projects (Heist Missions) Endpoints
app.get('/api/projects', authenticate, authorize('PROJECT_READ'), (req: AuthenticatedRequest, res: Response): void => {
  const status = req.query.status as ProjectStatus | undefined;
  const orgId = req.user?.role === 'admin' ? undefined : req.user?.organizationId;
  const projects = store.listProjects(orgId, status);
  res.status(200).json(projects);
});

app.post('/api/projects', authenticate, authorize('PROJECT_CREATE'), (req: AuthenticatedRequest, res: Response): void => {
  const validation = validateProjectInput(req.body);
  if (!validation.isValid) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed',
      errors: validation.errors,
    });
    return;
  }

  const newProject = {
    id: `PRJ-HEIST-${Date.now().toString().slice(-4)}`,
    title: req.body.title,
    codeName: req.body.codeName,
    target: req.body.target,
    estimatedTake: Number(req.body.estimatedTake) || 0,
    riskLevel: req.body.riskLevel || 'medium',
    status: 'draft' as ProjectStatus,
    organizationId: req.user!.organizationId,
    createdBy: req.user!.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addProject(newProject);

  store.logAudit({
    actorId: req.user!.userId,
    actorEmail: req.user!.email,
    action: 'PROJECT_CREATE',
    resourceType: 'project',
    resourceId: newProject.id,
    details: { title: newProject.title, target: newProject.target },
  });

  res.status(201).json(newProject);
});

app.get('/api/projects/:id', authenticate, authorize('PROJECT_READ'), (req: AuthenticatedRequest, res: Response): void => {
  const project = store.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' });
    return;
  }
  res.status(200).json(project);
});

app.patch('/api/projects/:id/status', authenticate, authorize('PROJECT_UPDATE'), (req: AuthenticatedRequest, res: Response): void => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Bad Request', message: 'Status is required' });
    return;
  }

  try {
    const updated = store.updateProjectStatus(req.params.id, status, req.user!.userId);
    store.logAudit({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      action: 'PROJECT_STATUS_UPDATE',
      resourceType: 'project',
      resourceId: req.params.id,
      details: { newStatus: status },
    });
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(400).json({ error: 'Bad Request', message: err.message });
  }
});

// 6. Approvals Endpoints
app.get('/api/approvals', authenticate, authorize('PROJECT_READ'), (req: AuthenticatedRequest, res: Response): void => {
  const projectId = req.query.projectId as string | undefined;
  const approvals = store.listApprovals(projectId);
  res.status(200).json(approvals);
});

app.post('/api/approvals', authenticate, authorize('APPROVAL_SUBMIT'), (req: AuthenticatedRequest, res: Response): void => {
  const { projectId, notes } = req.body;
  if (!projectId) {
    res.status(400).json({ error: 'Bad Request', message: 'projectId is required' });
    return;
  }

  const project = store.getProject(projectId);
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' });
    return;
  }

  const approval = {
    id: `appr-${Date.now().toString().slice(-4)}`,
    projectId,
    requestedBy: req.user!.userId,
    status: 'pending' as ApprovalStatus,
    notes,
    createdAt: new Date().toISOString(),
  };

  store.addApproval(approval);

  // Auto transition project status to 'in_review' if it was 'draft'
  if (project.status === 'draft') {
    store.updateProjectStatus(projectId, 'in_review', req.user!.userId);
  }

  store.logAudit({
    actorId: req.user!.userId,
    actorEmail: req.user!.email,
    action: 'APPROVAL_SUBMIT',
    resourceType: 'approval',
    resourceId: approval.id,
    details: { projectId },
  });

  res.status(201).json(approval);
});

app.patch('/api/approvals/:id', authenticate, authorize('APPROVAL_REVIEW'), (req: AuthenticatedRequest, res: Response): void => {
  const { status, notes } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({
      error: 'Bad Request',
      message: "Status must be either 'approved' or 'rejected'",
    });
    return;
  }

  try {
    const updated = store.reviewApproval(req.params.id, status, req.user!.userId, notes);
    store.logAudit({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      action: 'APPROVAL_REVIEW',
      resourceType: 'approval',
      resourceId: req.params.id,
      details: { status, notes },
    });
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(400).json({ error: 'Bad Request', message: err.message });
  }
});

// 7. Comments Endpoints
app.get('/api/projects/:id/comments', authenticate, authorize('PROJECT_READ'), (req: AuthenticatedRequest, res: Response): void => {
  const comments = store.listComments(req.params.id);
  res.status(200).json(comments);
});

app.post('/api/projects/:id/comments', authenticate, authorize('COMMENT_CREATE'), (req: AuthenticatedRequest, res: Response): void => {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'Bad Request', message: 'Comment content is required' });
    return;
  }

  const comment = {
    id: `cmt-${Date.now().toString().slice(-4)}`,
    projectId: req.params.id,
    authorId: req.user!.userId,
    authorName: req.user!.email.split('@')[0],
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  store.addComment(comment);
  res.status(201).json(comment);
});

// 8. Documents Endpoints
app.get('/api/projects/:id/documents', authenticate, authorize('DOCUMENT_READ'), (req: AuthenticatedRequest, res: Response): void => {
  const docs = store.listDocuments(req.params.id);
  res.status(200).json(docs);
});

app.post('/api/projects/:id/documents', authenticate, authorize('DOCUMENT_UPLOAD'), (req: AuthenticatedRequest, res: Response): void => {
  const { title, fileType, sizeBytes, checksum } = req.body;
  if (!title || !fileType) {
    res.status(400).json({ error: 'Bad Request', message: 'title and fileType are required' });
    return;
  }

  const doc = {
    id: `doc-${Date.now().toString().slice(-4)}`,
    projectId: req.params.id,
    title,
    fileType,
    sizeBytes: Number(sizeBytes) || 0,
    checksum: checksum || '00000000',
    uploadedBy: req.user!.userId,
    createdAt: new Date().toISOString(),
  };

  store.addDocument(doc);
  res.status(201).json(doc);
});

// 9. Audit Endpoints
app.get('/api/audit', authenticate, authorize('AUDIT_VIEW'), (req: AuthenticatedRequest, res: Response): void => {
  const resourceType = req.query.resourceType as string | undefined;
  const actorId = req.query.actorId as string | undefined;
  const events = store.listAuditEvents(resourceType, actorId);
  res.status(200).json(events);
});

// 10. Organization / Workspace Manage Endpoint
app.post('/api/workspaces', authenticate, authorize('WORKSPACE_MANAGE'), (req: AuthenticatedRequest, res: Response): void => {
  const { name, slug, tier } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Bad Request', message: 'name and slug are required' });
    return;
  }

  const ws = {
    id: `ws-${Date.now()}`,
    name,
    slug,
    tier: tier || 'syndicate_standard',
    createdAt: new Date().toISOString(),
  };

  store.addWorkspace(ws);
  res.status(201).json(ws);
});

// 11. Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Listen if run directly
if (require.main === module) {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[SERVER] ${config.serviceName} listening on port ${config.port} (${config.environment})`);
    console.log(`[SERVER] Reviewer UI available at http://localhost:${config.port}/`);
    console.log(`[SERVER] Health check at http://localhost:${config.port}/health`);
  });
}
