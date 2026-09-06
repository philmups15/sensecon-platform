// Static UI scaffolding — navigation, page titles and a few admin-overview
// placeholders. All feature data now comes from the API (see src/lib/api.js).

export const navGroups = [
  { label: 'Overview', items: [['Dashboard', 'dashboard']] },
  {
    label: 'Pre-operations',
    items: [
      ['Opportunities', 'opportunities'],
      ['Projects', 'projects'],
    ],
  },
  {
    label: 'Operations',
    items: [
      ['Work orders', 'workorders'],
      ['Non-conformities', 'nonconformities'],
      ['Commissioning', 'commissioning'],
      ['Handover', 'handover'],
    ],
  },
  { label: 'Insight', items: [['Reports', 'reports'], ['Customer portal', 'portal']] },
  { label: 'System', items: [['Administration', 'admin']] },
  { label: 'Cross-cutting', items: [['Empty & error states', 'empty']] },
];

export const pageTitles = {
  dashboard: 'Dashboard',
  opportunities: 'Opportunity pipeline',
  surveys: 'Site surveys',
  design: 'Design workspace',
  bom: 'Bill of materials',
  projects: 'Projects',
  plants: 'Plants',
  workorders: 'Work orders',
  commissioning: 'Commissioning',
  handover: 'Handover',
  nonconformities: 'Non-conformities',
  reports: 'Reports',
  portal: 'Customer portal',
  admin: 'Administration',
  empty: 'Empty & error states',
  profile: 'My profile',
  login: '',
};

export const notifications = [
  { title: 'Work order WO-2291 overdue', body: 'HVAC filter replacement — Lusaka Ridge C&I', channel: 'Email', time: '8m ago' },
  { title: 'Survey signed off', body: 'SRV-0148 for Kitwe Industrial Park', channel: 'WhatsApp', time: '1h ago' },
  { title: 'New opportunity', body: 'Mukuba Steel — 480kWp rooftop enquiry', channel: 'SMS', time: '3h ago' },
  { title: 'Non-conformity closed', body: 'NC-0032 on Ndola Cold Storage', channel: 'Email', time: 'Yesterday' },
];

// ---- Design ----
export const designTabs = [
  ['array', 'PV array'],
  ['inverter', 'Inverter'],
  ['string', 'String design'],
  ['cabling', 'Cabling'],
  ['protection', 'Protection'],
  ['monitoring', 'Monitoring'],
];

// ---- Work orders ----
export const woColumnsList = ['Open', 'In progress', 'Review', 'Done'];

// ---- Admin overview placeholders ----
export const tenants = [
  { name: 'Kariba Solar Services', plants: 27, users: 14, status: 'Active', tone: 'green' },
  { name: 'Zamsun Power Ltd', plants: 8, users: 6, status: 'Active', tone: 'green' },
  { name: 'Copperbelt Energy Co-op', plants: 3, users: 3, status: 'Trial', tone: 'amber' },
];

export const templates = [
  { name: 'Rooftop C&I survey template', kind: 'Survey' },
  { name: 'Standard deployment project template', kind: 'Project' },
  { name: 'Commissioning checklist — ground mount', kind: 'Commissioning' },
];
