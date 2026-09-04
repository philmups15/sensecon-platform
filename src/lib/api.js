const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080';
const TOKEN_KEY = 'sencecon_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const payload = await res.json();
      detail = payload.title || JSON.stringify(payload.errors) || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined;
  return res.json();
}

async function uploadFiles(path, files, title) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (title) formData.append('title', title);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: formData });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const payload = await res.json();
      detail = payload.title || JSON.stringify(payload.errors) || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function downloadFile(path, fileName) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error('Failed to download file.');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// For displaying an image inline (<img src={...}>) rather than triggering a
// download — every API route requires a Bearer token, which a plain <img src>
// can't send, so this fetches the bytes and hands back an object URL instead.
// Returns null if the resource doesn't exist (e.g. no avatar set) rather than
// throwing, since "no avatar" is an expected, common case.
export async function fetchBlobUrl(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) return null;

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---- Auth ----
export async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
  setToken(result.token);
  return result;
}

export async function register(email, password, displayName, profile = {}) {
  const result = await request('/api/auth/register', { method: 'POST', auth: false, body: { email, password, displayName, ...profile } });
  setToken(result.token);
  return result;
}

// Same endpoint as register(), but for an admin creating another user's account —
// it must NOT store the returned token, or it would replace the admin's own session.
export const adminCreateUser = (email, password, displayName, profile = {}) =>
  request('/api/auth/register', { method: 'POST', body: { email, password, displayName, ...profile } });

// ---- Plants ----
export const getPlants = () => request('/api/plants');
export const getPlant = (id) => request(`/api/plants/${id}`);
export const createPlant = (data) => request('/api/plants', { method: 'POST', body: data });
export const updatePlant = (id, data) => request(`/api/plants/${id}`, { method: 'PUT', body: data });
export const deletePlant = (id) => request(`/api/plants/${id}`, { method: 'DELETE' });

// ---- Work orders ----
export const getWorkOrders = () => request('/api/workorders');
export const getWorkOrder = (id) => request(`/api/workorders/${id}`);
export const createWorkOrder = (data) => request('/api/workorders', { method: 'POST', body: data });
export const updateWorkOrder = (id, data) => request(`/api/workorders/${id}`, { method: 'PUT', body: data });
export const deleteWorkOrder = (id) => request(`/api/workorders/${id}`, { method: 'DELETE' });

// ---- Plant handover attachments ----
export const getPlantAttachments = (id) => request(`/api/plants/${id}/attachments`);
export const uploadPlantAttachments = (id, files, title) => uploadFiles(`/api/plants/${id}/attachments`, files, title);
export const downloadPlantAttachment = (id, attachmentId, fileName) =>
  downloadFile(`/api/plants/${id}/attachments/${attachmentId}`, fileName);

// ---- Commissioning test results ----
// Fixed checklist per category — test names must match what's already been
// recorded in the backend for a plant (upsert key is plant + category + name).
export const COMMISSIONING_CHECKLIST = {
  Dc: ['Insulation resistance', 'Open circuit voltage per string'],
  Ac: ['Earth loop impedance', 'RCD trip time'],
  Monitoring: ['Gateway comms link'],
  Safety: ['Arc flash labelling', 'Lockout/tagout points'],
};

export const getCommissioningTests = (plantId) => request(`/api/plants/${plantId}/commissioning-tests`);
export const recordCommissioningTest = (plantId, category, testName, result, notes) =>
  request(`/api/plants/${plantId}/commissioning-tests`, { method: 'PUT', body: { category, testName, result, notes: notes || null } });

// ---- Projects ----
export const getProjects = () => request('/api/projects');
export const getProject = (id) => request(`/api/projects/${id}`);
export const createProject = (data) => request('/api/projects', { method: 'POST', body: data });
export const updateProject = (id, data) => request(`/api/projects/${id}`, { method: 'PUT', body: data });
export const deleteProject = (id) => request(`/api/projects/${id}`, { method: 'DELETE' });

// ---- Opportunities ----
export const getOpportunities = () => request('/api/opportunities');
export const getOpportunity = (id) => request(`/api/opportunities/${id}`);
export const createOpportunity = (data) => request('/api/opportunities', { method: 'POST', body: data });
export const updateOpportunity = (id, data) => request(`/api/opportunities/${id}`, { method: 'PUT', body: data });
export const deleteOpportunity = (id) => request(`/api/opportunities/${id}`, { method: 'DELETE' });
export const uploadOpportunityAttachments = (id, files, title) => uploadFiles(`/api/opportunities/${id}/attachments`, files, title);
export const downloadOpportunityAttachment = (id, attachmentId, fileName) =>
  downloadFile(`/api/opportunities/${id}/attachments/${attachmentId}`, fileName);
export const changeOpportunityStage = (id, stage, note) =>
  request(`/api/opportunities/${id}/stage`, { method: 'PUT', body: { stage, note: note || null } });
export const updateOpportunityStageData = (id, fields) =>
  request(`/api/opportunities/${id}/stage-data`, { method: 'PUT', body: { fields } });
export const addOpportunityNote = (id, text) =>
  request(`/api/opportunities/${id}/notes`, { method: 'POST', body: { text } });
export const convertOpportunityToProject = (id) =>
  request(`/api/opportunities/${id}/convert`, { method: 'POST' });

// ---- Surveys ----
export const getSurveys = () => request('/api/surveys');
export const getSurvey = (id) => request(`/api/surveys/${id}`);
export const createSurvey = (data) => request('/api/surveys', { method: 'POST', body: data });
export const updateSurvey = (id, data) => request(`/api/surveys/${id}`, { method: 'PUT', body: data });
export const deleteSurvey = (id) => request(`/api/surveys/${id}`, { method: 'DELETE' });

// ---- Designs ----
export const getDesigns = () => request('/api/designs');
export const getDesign = (id) => request(`/api/designs/${id}`);
export const createDesign = (data) => request('/api/designs', { method: 'POST', body: data });
export const updateDesign = (id, data) => request(`/api/designs/${id}`, { method: 'PUT', body: data });
export const deleteDesign = (id) => request(`/api/designs/${id}`, { method: 'DELETE' });

// ---- BOM items ----
export const getBomItems = () => request('/api/bomitems');
export const getBomItem = (id) => request(`/api/bomitems/${id}`);
export const createBomItem = (data) => request('/api/bomitems', { method: 'POST', body: data });
export const updateBomItem = (id, data) => request(`/api/bomitems/${id}`, { method: 'PUT', body: data });
export const deleteBomItem = (id) => request(`/api/bomitems/${id}`, { method: 'DELETE' });

// ---- Non-conformities ----
export const getNonConformities = () => request('/api/nonconformities');
export const createNonConformity = (data) => request('/api/nonconformities', { method: 'POST', body: data });
export const updateNonConformity = (id, data) => request(`/api/nonconformities/${id}`, { method: 'PUT', body: data });
export const deleteNonConformity = (id) => request(`/api/nonconformities/${id}`, { method: 'DELETE' });

// ---- Reports ----
export const getReports = () => request('/api/reports');
export const createReport = (data) => request('/api/reports', { method: 'POST', body: data });
export const deleteReport = (id) => request(`/api/reports/${id}`, { method: 'DELETE' });

// ---- Users ----
export const getUsers = () => request('/api/users');
export const getCurrentUser = () => request('/api/users/me');
// data: { displayName, username, phoneNumber, address, jobDescription }
export const updateProfile = (data) => request('/api/users/me', { method: 'PUT', body: data });
export const changePassword = (currentPassword, newPassword) =>
  request('/api/users/me/password', { method: 'PUT', body: { currentPassword, newPassword } });
export const updateUserRole = (id, role) => request(`/api/users/${id}/role`, { method: 'PUT', body: { role } });

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/users/me/avatar`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const payload = await res.json();
      detail = payload.title || JSON.stringify(payload.errors) || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  return res.json();
}

export const deleteAvatar = () => request('/api/users/me/avatar', { method: 'DELETE' });
export const getAvatarBlobUrl = (userId) => fetchBlobUrl(`/api/users/${userId}/avatar`);

export const setUserStatus = (id, enabled) =>
  request(`/api/users/${id}/status`, { method: 'PUT', body: { enabled } });

// Distinct from changePassword() above, which requires the caller's own
// current password and only works for your own account — this is an admin
// setting *someone else's* password directly.
export const adminSetPassword = (id, newPassword) =>
  request(`/api/users/${id}/password`, { method: 'PUT', body: { newPassword } });

// Admin-triggered: emails the target user a reset link (24h expiry).
export const sendPasswordReset = (id) =>
  request(`/api/users/${id}/password-reset`, { method: 'POST' });

// Public — consumed by the reset-password link's token, not an authenticated call.
export const resetPassword = (token, newPassword) =>
  request('/api/auth/reset-password', { method: 'POST', auth: false, body: { token, newPassword } });

// ---- Integrations ----
export const getIntegrationSettings = () => request('/api/integrations');
export const updateIntegrationSetting = (key, data) =>
  request(`/api/integrations/${key}`, { method: 'PUT', body: data });

// ---- Audit log ----
export const getAuditLog = () => request('/api/auditlog');

// ---- Enum display metadata ----
// Maps the backend's PascalCase enum strings to the label/tone/timeline-key
// shapes the existing screens and shared components (Chip, LifecycleTimeline) expect.
export const STAGE_META = {
  DesignSurvey: { key: 'design', label: 'Design & survey', tone: 'green' },
  Deployment: { key: 'deployment', label: 'Deployment', tone: 'amber' },
  Commissioning: { key: 'commissioning', label: 'Commissioning', tone: 'violet' },
  Operating: { key: 'operating', label: 'Operating', tone: 'green' },
};

export const HEALTH_META = {
  Unknown: { label: '—', tone: 'slate' },
  Good: { label: 'Good', tone: 'green' },
  Watch: { label: 'Watch', tone: 'slate' },
  AtRisk: { label: 'At risk', tone: 'amber' },
  Critical: { label: 'Critical', tone: 'red' },
};

export const WORK_ORDER_TYPE_META = {
  OM: { label: 'O&M', tone: 'blue' },
  Deployment: { label: 'Deployment', tone: 'violet' },
};

export const PRIORITY_META = {
  Low: { label: 'Low', tone: 'blue' },
  Medium: { label: 'Medium', tone: 'amber' },
  High: { label: 'High', tone: 'red' },
};

export const WORK_ORDER_STATUS_META = {
  Open: { label: 'Open' },
  InProgress: { label: 'In progress' },
  Review: { label: 'Review' },
  Done: { label: 'Done' },
};

export const COMMISSIONING_RESULT_META = {
  Pending: { label: 'Pending', tone: 'slate' },
  Pass: { label: 'Pass', tone: 'green' },
  Fail: { label: 'Fail — retest', tone: 'red' },
};

export function toCommissioningTestView(dto) {
  const meta = COMMISSIONING_RESULT_META[dto.result] || COMMISSIONING_RESULT_META.Pending;
  return {
    category: dto.category,
    test: dto.testName,
    result: meta.label,
    resultKey: dto.result,
    tone: meta.tone,
    notes: dto.notes || '',
  };
}

export function toPlantView(dto) {
  const stageMeta = STAGE_META[dto.stage] || STAGE_META.Operating;
  const healthMeta = HEALTH_META[dto.health] || HEALTH_META.Unknown;
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    stage: stageMeta.key,
    stageLabel: stageMeta.label,
    tone: stageMeta.tone,
    capacity: dto.capacity,
    equip: dto.equipment,
    pr: dto.performanceRatio,
    health: healthMeta.label,
    healthTone: healthMeta.tone,
    projectId: dto.projectId || null,
    projectName: dto.projectName || '',
  };
}

export function toWorkOrderView(dto) {
  const typeMeta = WORK_ORDER_TYPE_META[dto.type] || WORK_ORDER_TYPE_META.OM;
  const priorityMeta = PRIORITY_META[dto.priority] || PRIORITY_META.Medium;
  const statusMeta = WORK_ORDER_STATUS_META[dto.status] || WORK_ORDER_STATUS_META.Open;
  return {
    id: dto.code,
    entityId: dto.id,
    title: dto.title,
    plant: dto.plantName,
    plantId: dto.plantId,
    type: typeMeta.label,
    tone: typeMeta.tone,
    priority: priorityMeta.label,
    priorityTone: priorityMeta.tone,
    assignee: dto.assignee,
    col: statusMeta.label,
  };
}

export const OPPORTUNITY_STAGE_META = {
  Qualifying: { label: 'Qualifying', tone: 'slate' },
  SiteVisit: { label: 'Site visit', tone: 'blue' },
  Proposal: { label: 'Proposal', tone: 'violet' },
  Negotiation: { label: 'Negotiation', tone: 'amber' },
  Won: { label: 'Won', tone: 'green' },
};

// Fields captured per pipeline stage, shown on the opportunity detail page.
// Field keys must match the backend's OpportunityStage.FieldLabel switch.
export const STAGE_FIELD_DEFS = {
  Qualifying: [
    { key: 'leadSource', label: 'Lead source', placeholder: 'e.g. Referral, inbound web' },
    { key: 'budgetConfirmed', label: 'Budget status', placeholder: 'Not yet / Verbal / Confirmed' },
    { key: 'decisionMaker', label: 'Decision maker', placeholder: 'Name / role' },
  ],
  SiteVisit: [
    { key: 'visitDate', label: 'Visit date', placeholder: 'e.g. 2026-07-18' },
    { key: 'roofCondition', label: 'Site condition', placeholder: 'Roof / ground assessment' },
    { key: 'siteContact', label: 'Site contact', placeholder: 'Name & phone' },
  ],
  Proposal: [
    { key: 'proposalVersion', label: 'Proposal version', placeholder: 'v1' },
    { key: 'systemSize', label: 'System size quoted', placeholder: 'e.g. 480 kWp' },
    { key: 'quotedPrice', label: 'Quoted price ($)', placeholder: 'e.g. 612000' },
  ],
  Negotiation: [
    { key: 'discountPct', label: 'Discount offered (%)', placeholder: 'e.g. 5' },
    { key: 'expectedClose', label: 'Expected close date', placeholder: 'e.g. 2026-08-20' },
    { key: 'termsNotes', label: 'Terms notes', placeholder: 'Payment terms, warranty asks…' },
  ],
  Won: [
    { key: 'contractDate', label: 'Contract signed date', placeholder: 'e.g. 2026-08-01' },
    { key: 'poNumber', label: 'PO number', placeholder: 'e.g. PO-4471' },
  ],
};

export const SURVEY_STATUS_META = {
  Scheduled: { label: 'Scheduled', tone: 'amber' },
  InProgress: { label: 'In progress', tone: 'blue' },
  Complete: { label: 'Complete', tone: 'slate' },
  SignedOff: { label: 'Signed off', tone: 'green' },
};

export const DESIGN_STATUS_META = {
  InReview: { label: 'In review', tone: 'blue' },
  Approved: { label: 'Approved', tone: 'green' },
};

export const BOM_STATUS_META = {
  Ordered: { label: 'Ordered', tone: 'blue' },
  Delivered: { label: 'Delivered', tone: 'green' },
  InProduction: { label: 'In production', tone: 'amber' },
  Backordered: { label: 'Backordered', tone: 'red' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

const ACTIVITY_DOT_COLOR = {
  stage: '#1F6E72',
  note: '#8A5A16',
  document: '#2E9E8F',
  created: '#1C8A4E',
  edit: '#78908A',
};

export function toOpportunityView(dto) {
  const stageMeta = OPPORTUNITY_STAGE_META[dto.stage] || OPPORTUNITY_STAGE_META.Qualifying;
  return {
    id: dto.code,
    entityId: dto.id,
    customer: dto.customer,
    capacity: dto.capacity,
    stage: stageMeta.label,
    stageKey: dto.stage,
    tone: stageMeta.tone,
    location: dto.location,
    next: dto.nextAction,
    owner: dto.owner,
    value: `$${Number(dto.value).toLocaleString()}`,
    rawValue: dto.value,
    converted: Boolean(dto.converted),
    createdByName: dto.createdByName,
    createdDate: formatDate(dto.created),
    stageData: dto.stageData || {},
    attachments: (dto.attachments || []).map((a) => ({
      id: a.id,
      title: a.title,
      version: a.version,
      fileName: a.fileName,
      sizeBytes: a.sizeBytes,
      uploadedByName: a.uploadedByName,
      date: formatDate(a.created),
    })),
    notes: (dto.notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      who: n.createdByName,
      tsLabel: formatRelative(n.created),
    })),
    activity: (dto.activity || []).map((a) => ({
      id: a.id,
      type: a.type,
      text: a.text,
      who: a.userName,
      tsLabel: formatRelative(a.created),
      dotColor: ACTIVITY_DOT_COLOR[a.type] || '#78908A',
    })),
  };
}

export function toSurveyView(dto) {
  const statusMeta = SURVEY_STATUS_META[dto.status] || SURVEY_STATUS_META.Scheduled;
  return {
    id: dto.code,
    entityId: dto.id,
    plant: dto.plantName,
    status: statusMeta.label,
    tone: statusMeta.tone,
    progress: dto.progress,
    surveyor: dto.surveyor,
    date: formatDate(dto.date),
    rawDate: dto.date,
    statusKey: dto.status,
    projectId: dto.projectId || null,
    projectName: dto.projectName || '',
    plantId: dto.plantId || null,
  };
}

export function toDesignView(dto) {
  const statusMeta = DESIGN_STATUS_META[dto.status] || DESIGN_STATUS_META.InReview;
  return {
    id: dto.code,
    entityId: dto.id,
    project: dto.projectName,
    projectId: dto.projectId || null,
    status: statusMeta.label,
    statusKey: dto.status,
    tone: statusMeta.tone,
    rev: dto.revision,
    survey: dto.surveyCode || '—',
    surveyId: dto.surveyId || null,
  };
}

export function toBomView(dto) {
  const statusMeta = BOM_STATUS_META[dto.status] || BOM_STATUS_META.Ordered;
  return {
    entityId: dto.id,
    component: dto.component,
    qty: dto.quantity,
    unit: `$${Number(dto.unitCost).toLocaleString()}`,
    rawUnitCost: dto.unitCost,
    supplier: dto.supplier,
    status: statusMeta.label,
    statusKey: dto.status,
    tone: statusMeta.tone,
    plantId: dto.plantId || null,
    plantName: dto.plantName || '',
  };
}

export const NON_CONFORMITY_STATUS_META = {
  Open: { label: 'Open', tone: 'red' },
  Closed: { label: 'Closed', tone: 'green' },
};

export const USER_ROLE_META = {
  User: { label: 'User', tone: 'blue' },
  Admin: { label: 'Admin', tone: 'violet' },
  Sales: { label: 'Sales', tone: 'green' },
  ProjectManager: { label: 'Project Manager', tone: 'amber' },
  DesignEngineer: { label: 'Design Engineer', tone: 'slate' },
};

// Every role that can log in, for populating the Admin role-change dropdown.
export const ALL_ROLES = ['Admin', 'User', 'Sales', 'ProjectManager', 'DesignEngineer'];

// ---- Role permissions (dynamic, DB-backed — editable from the Admin > Roles & Permissions page) ----
export const getRolePermissions = () => request('/api/rolepermissions');
export const updateRolePermission = (role, module, data) =>
  request(`/api/rolepermissions/${role}/${module}`, { method: 'PUT', body: data });

// Populated once at startup (see App.jsx) from getRolePermissions(). Until it
// loads, canAccess() defaults to "no access" rather than trusting stale data —
// the RolePermissions table on the backend is the single source of truth, and
// it's also enforced there for real, so this cache is only about what the UI
// shows, not what's actually allowed.
let moduleAccessCache = {};

export function setRolePermissionsCache(rows) {
  const matrix = {};
  for (const { role, module, canRead, canWrite } of rows) {
    if (!matrix[module]) matrix[module] = { read: [], write: [] };
    if (canRead) matrix[module].read.push(role);
    if (canWrite) matrix[module].write.push(role);
  }
  moduleAccessCache = matrix;
}

export function canAccess(role, module, mode = 'read') {
  return moduleAccessCache[module]?.[mode]?.includes(role) ?? false;
}

// Screen key -> module(s) it depends on. A screen that reads from more than one
// module (e.g. the customer Portal shows Plants + Work orders) is visible only
// if the role can read at least one of them.
const SCREEN_MODULES = {
  opportunities: ['opportunities'],
  surveys: ['surveys'],
  design: ['designs'],
  bom: ['bomItems'],
  projects: ['projects'],
  plants: ['plants'],
  workorders: ['workOrders'],
  commissioning: ['plants'],
  reports: ['reports'],
  portal: ['plants', 'workOrders'],
};

export function canViewScreen(role, screenKey) {
  if (screenKey === 'admin') return role === 'Admin';
  const modules = SCREEN_MODULES[screenKey];
  if (!modules) return true; // dashboard, empty-states, etc. — always visible
  return modules.some((m) => canAccess(role, m, 'read'));
}

export function toNonConformityView(dto) {
  const statusMeta = NON_CONFORMITY_STATUS_META[dto.status] || NON_CONFORMITY_STATUS_META.Open;
  return {
    entityId: dto.id,
    id: dto.code,
    desc: dto.description,
    plant: dto.plantName,
    status: statusMeta.label,
    tone: statusMeta.tone,
  };
}

export function toReportView(dto) {
  return {
    entityId: dto.id,
    name: dto.name,
    by: dto.generatedBy || 'You',
    date: formatDate(dto.generatedDate),
  };
}

export function toUserView(dto) {
  const roleMeta = USER_ROLE_META[dto.role] || USER_ROLE_META.User;
  return {
    entityId: dto.id,
    name: dto.displayName,
    email: dto.email,
    role: roleMeta.label,
    roleKey: dto.role,
    tone: roleMeta.tone,
    status: dto.isActive === false ? 'Disabled' : 'Active',
    username: dto.username || '',
    phoneNumber: dto.phoneNumber || '',
    address: dto.address || '',
    jobDescription: dto.jobDescription || '',
    hasAvatar: Boolean(dto.hasAvatar),
    created: dto.created,
  };
}

export function toAuditLogView(dto) {
  return {
    entityId: dto.id,
    who: dto.who,
    action: dto.action,
    time: new Date(dto.created).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

export function toProjectView(dto) {
  const stageMeta = STAGE_META[dto.stage] || STAGE_META.Operating;
  return {
    id: dto.code,
    entityId: dto.id,
    name: dto.name,
    customer: dto.customer,
    stage: stageMeta.label,
    tone: stageMeta.tone,
    stageKey: dto.stage,
    pm: dto.projectManager,
    budget: `$${Number(dto.budget).toLocaleString()}`,
    actual: `$${Number(dto.actual).toLocaleString()}`,
    rawBudget: dto.budget,
    rawActual: dto.actual,
  };
}
