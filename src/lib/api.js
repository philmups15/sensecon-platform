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

// ---- Auth ----
export async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
  setToken(result.token);
  return result;
}

export async function register(email, password, displayName) {
  const result = await request('/api/auth/register', { method: 'POST', auth: false, body: { email, password, displayName } });
  setToken(result.token);
  return result;
}

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

export function toOpportunityView(dto) {
  const stageMeta = OPPORTUNITY_STAGE_META[dto.stage] || OPPORTUNITY_STAGE_META.Qualifying;
  return {
    id: dto.code,
    entityId: dto.id,
    customer: dto.customer,
    capacity: dto.capacity,
    stage: stageMeta.label,
    tone: stageMeta.tone,
    location: dto.location,
    next: dto.nextAction,
    owner: dto.owner,
    value: `$${Number(dto.value).toLocaleString()}`,
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
  };
}

export function toDesignView(dto) {
  const statusMeta = DESIGN_STATUS_META[dto.status] || DESIGN_STATUS_META.InReview;
  return {
    id: dto.code,
    entityId: dto.id,
    project: dto.projectName,
    status: statusMeta.label,
    tone: statusMeta.tone,
    rev: dto.revision,
    survey: dto.surveyCode || '—',
    surveyId: dto.surveyId,
  };
}

export function toBomView(dto) {
  const statusMeta = BOM_STATUS_META[dto.status] || BOM_STATUS_META.Ordered;
  return {
    entityId: dto.id,
    component: dto.component,
    qty: dto.quantity,
    unit: `$${Number(dto.unitCost).toLocaleString()}`,
    supplier: dto.supplier,
    status: statusMeta.label,
    tone: statusMeta.tone,
  };
}

export const NON_CONFORMITY_STATUS_META = {
  Open: { label: 'Open', tone: 'red' },
  Closed: { label: 'Closed', tone: 'green' },
};

export const USER_ROLE_META = {
  User: { label: 'User', tone: 'blue' },
  Admin: { label: 'Admin', tone: 'violet' },
};

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
    tone: roleMeta.tone,
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
    pm: dto.projectManager,
    budget: `$${Number(dto.budget).toLocaleString()}`,
    actual: `$${Number(dto.actual).toLocaleString()}`,
  };
}
