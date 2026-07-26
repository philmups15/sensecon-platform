export const navGroups = [
  { label: 'Overview', items: [['Dashboard', 'dashboard']] },
  {
    label: 'Pre-operations',
    items: [
      ['Opportunities', 'opportunities'],
      ['Site surveys', 'surveys'],
      ['Design', 'design'],
      ['BOM & procurement', 'bom'],
      ['Projects', 'projects'],
    ],
  },
  {
    label: 'Operations',
    items: [
      ['Plants', 'plants'],
      ['Work orders', 'workorders'],
      ['Commissioning & handover', 'commissioning'],
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
  commissioning: 'Commissioning & handover',
  reports: 'Reports',
  portal: 'Customer portal',
  admin: 'Administration',
  empty: 'Empty & error states',
  login: '',
};

export const notifications = [
  { title: 'Work order WO-2291 overdue', body: 'HVAC filter replacement — Lusaka Ridge C&I', channel: 'Email', time: '8m ago' },
  { title: 'Survey signed off', body: 'SRV-0148 for Kitwe Industrial Park', channel: 'WhatsApp', time: '1h ago' },
  { title: 'New opportunity', body: 'Mukuba Steel — 480kWp rooftop enquiry', channel: 'SMS', time: '3h ago' },
  { title: 'Non-conformity closed', body: 'NC-0032 on Ndola Cold Storage', channel: 'Email', time: 'Yesterday' },
];

export const kpis = [
  { label: 'Operating plants', value: '27', trend: '+2 this quarter', trendColor: '#15803D' },
  { label: 'In delivery', value: '9', trend: '3 in commissioning', trendColor: '#B45309' },
  { label: 'Open work orders', value: '46', trend: '6 breaching SLA', trendColor: '#B42318' },
  { label: 'Pipeline value', value: '$4.2M', trend: '14 open opportunities', trendColor: '#6A7178' },
];

export const mapPins = [
  { name: 'Lusaka Ridge C&I', x: '48%', y: '62%', color: '#2563EB' },
  { name: 'Kitwe Industrial Park', x: '58%', y: '22%', color: '#2563EB' },
  { name: 'Ndola Cold Storage', x: '66%', y: '26%', color: '#B45309' },
  { name: 'Livingstone Lodge', x: '40%', y: '88%', color: '#15803D' },
];

export const stageDist = [
  { label: 'Operating', count: 27, color: '#2563EB' },
  { label: 'Commissioning', count: 5, color: '#6D28D9' },
  { label: 'Deployment', count: 4, color: '#B45309' },
  { label: 'Design & survey', count: 9, color: '#15803D' },
];

export const activity = [
  { who: 'Mwansa B.', what: 'signed off survey SRV-0148', time: '42 min ago', color: '#15803D' },
  { who: 'Field team 3', what: 'closed WO-2288 at Kitwe Industrial Park', time: '2h ago', color: '#2563EB' },
  { who: 'Chanda K.', what: 'moved Mukuba Steel to Proposal', time: '3h ago', color: '#6D28D9' },
  { who: 'System', what: 'flagged inverter fault at Ndola Cold Storage', time: '5h ago', color: '#B42318' },
  { who: 'Temba N.', what: 'submitted commissioning test results — AC side', time: 'Yesterday', color: '#B45309' },
];

export const attentionPlants = [
  { name: 'Ndola Cold Storage', issue: 'Performance ratio down 11% week-on-week', healthLabel: 'Critical', healthTone: 'red' },
  { name: 'Chisamba Farms', issue: '2 SLA-breaching work orders open', healthLabel: 'At risk', healthTone: 'amber' },
  { name: 'Livingstone Lodge', issue: 'Comms offline 6 hours', healthLabel: 'At risk', healthTone: 'amber' },
  { name: 'Mazabuka Sugar Co.', issue: 'Monitoring data stale 2 days', healthLabel: 'Watch', healthTone: 'slate' },
];

// ---- Opportunities ----
export const oppStages = ['Qualifying', 'Site visit', 'Proposal', 'Negotiation', 'Won'];
export const oppStageTone = { Qualifying: 'slate', 'Site visit': 'blue', Proposal: 'violet', Negotiation: 'amber', Won: 'green' };
export const opportunities = [
  { id: 'OPP-1042', customer: 'Mukuba Steel', capacity: '480 kWp', stage: 'Proposal', location: 'Kitwe', next: 'Send proposal v2', owner: 'Chanda K.', value: '$612,000' },
  { id: 'OPP-1039', customer: 'Zamsun Retail Group', capacity: '220 kWp', stage: 'Site visit', location: 'Lusaka', next: 'Schedule survey', owner: 'Chanda K.', value: '$289,000' },
  { id: 'OPP-1035', customer: 'Copperbelt Cold Chain', capacity: '640 kWp', stage: 'Negotiation', location: 'Ndola', next: 'Contract redlines', owner: 'Bwalya M.', value: '$798,000' },
  { id: 'OPP-1028', customer: 'Livingstone Lodge Collective', capacity: '95 kWp', stage: 'Won', location: 'Livingstone', next: 'Kick off survey', owner: 'Chanda K.', value: '$121,000' },
  { id: 'OPP-1021', customer: 'Mazabuka Sugar Co.', capacity: '1.2 MWp', stage: 'Qualifying', location: 'Mazabuka', next: 'Qualify budget', owner: 'Bwalya M.', value: '$1,480,000' },
];

// ---- Surveys ----
export const surveys = [
  { id: 'SRV-0148', plant: 'Kitwe Industrial Park', status: 'Signed off', tone: 'green', progress: 100, surveyor: 'Mwansa B.', date: '18 Jun 2026' },
  { id: 'SRV-0151', plant: 'Mukuba Steel (proposed)', status: 'In progress', tone: 'blue', progress: 64, surveyor: 'Temba N.', date: '22 Jul 2026' },
  { id: 'SRV-0149', plant: 'Zamsun Retail — Manda Hill', status: 'Scheduled', tone: 'amber', progress: 0, surveyor: 'Mwansa B.', date: '2 Aug 2026' },
  { id: 'SRV-0140', plant: 'Livingstone Lodge', status: 'Complete', tone: 'slate', progress: 100, surveyor: 'Temba N.', date: '30 May 2026' },
];

export const surveyPhotos = [1, 2, 3, 4, 5, 6].map((i) => ({ id: i, label: 'IMG_' + (2200 + i), gps: '-12.82, 28.21' }));

export const measurements = [
  { field: 'Usable roof area', value: '2,140 m²' },
  { field: 'Roof pitch', value: '8°' },
  { field: 'Structural condition', value: 'Good — no reinforcement needed' },
  { field: 'Grid connection point', value: '480V, 3-phase, 25m from array' },
];

export const obstructions = [
  { item: 'HVAC unit, north-east corner', impact: 'Minor shading 9–10am' },
  { item: 'Water tank', impact: 'No shading impact' },
];

// ---- Design ----
export const designs = [
  { id: 'DSN-0091', project: 'Mukuba Steel — 480kWp rooftop', status: 'In review', tone: 'blue', rev: 'C', survey: 'SRV-0151' },
  { id: 'DSN-0087', project: 'Copperbelt Cold Chain — 640kWp', status: 'Approved', tone: 'green', rev: 'B', survey: 'SRV-0132' },
  { id: 'DSN-0079', project: 'Livingstone Lodge — 95kWp', status: 'Approved', tone: 'green', rev: 'A', survey: 'SRV-0140' },
];

export const designTabs = [
  ['array', 'PV array'],
  ['inverter', 'Inverter'],
  ['string', 'String design'],
  ['cabling', 'Cabling'],
  ['protection', 'Protection'],
  ['monitoring', 'Monitoring'],
];

export const designFieldsByTab = {
  array: [['Module', 'JA Solar 585W bifacial'], ['Array capacity', '480.6 kWp'], ['Tilt / azimuth', '8° / 4° W of N'], ['Row spacing', '2.4 m']],
  inverter: [['Model', 'Huawei SUN2000-100KTL-M2'], ['Quantity', '4'], ['AC capacity', '400 kW'], ['Topology', 'String, 4x transformerless']],
  string: [['Strings per inverter', '12'], ['Modules per string', '22'], ['String voltage (Voc)', '812 V']],
  cabling: [['DC cable', '6mm² double-insulated, UV-rated'], ['AC cable', '4-core XLPE, 95mm²'], ['Cable runs', 'Tray-mounted, 180m total']],
  protection: [['DC protection', 'String fuses + Type II SPD'], ['AC protection', '400A ACB + earth fault relay'], ['Arc fault', 'AFDD integrated, inverter-side']],
  monitoring: [['Platform', 'Sensecon monitoring gateway'], ['Metering', 'Class 0.5S revenue meter'], ['Comms', '4G primary, Ethernet fallback']],
};

export const revisions = [
  { rev: 'C', by: 'Design Eng. — S. Phiri', date: '20 Jul 2026', note: 'Reduced string count after shading re-check' },
  { rev: 'B', by: 'Design Eng. — S. Phiri', date: '8 Jul 2026', note: 'Switched to bifacial modules' },
  { rev: 'A', by: 'Design Eng. — S. Phiri', date: '1 Jul 2026', note: 'Initial design from survey SRV-0151' },
];

export const attachments = [
  { name: 'Single line diagram.pdf', ext: 'PDF' },
  { name: 'PVsyst report.pdf', ext: 'PDF' },
  { name: 'Layout drawing — Rev C.dwg', ext: 'DWG' },
];

// ---- BOM ----
export const bomRows = [
  { component: 'JA Solar 585W bifacial module', qty: 822, unit: '$142', supplier: 'SolarTech Africa', status: 'Ordered', tone: 'blue' },
  { component: 'Huawei SUN2000-100KTL-M2', qty: 4, unit: '$9,800', supplier: 'Huawei Zambia', status: 'Delivered', tone: 'green' },
  { component: 'Mounting rail system', qty: 1, unit: '$38,400', supplier: 'MetalWorks Zambia', status: 'In production', tone: 'amber' },
  { component: 'DC cable 6mm² (500m reels)', qty: 12, unit: '$610', supplier: 'Copperbelt Cable Co.', status: 'Delivered', tone: 'green' },
  { component: 'AC protection panel', qty: 1, unit: '$14,200', supplier: 'ElectroSupply Ltd', status: 'Backordered', tone: 'red' },
];

export const variance = [
  { label: 'Modules', budget: 60, actual: 64 },
  { label: 'Inverters', budget: 22, actual: 20 },
  { label: 'Structure', budget: 14, actual: 16 },
  { label: 'BOS & cabling', budget: 10, actual: 9 },
].map((v) => ({ ...v, budgetPct: v.budget, actualPct: v.actual, over: v.actual > v.budget }));

// ---- Projects ----
export const projects = [
  { id: 'PRJ-0032', name: 'Mukuba Steel rooftop', customer: 'Mukuba Steel', stage: 'Deployment', tone: 'amber', pm: 'Bwalya M.', budget: '$612,000', actual: '$398,000' },
  { id: 'PRJ-0029', name: 'Copperbelt Cold Chain', customer: 'Copperbelt Cold Chain', stage: 'Commissioning', tone: 'violet', pm: 'Mutale C.', budget: '$798,000', actual: '$761,000' },
  { id: 'PRJ-0021', name: 'Livingstone Lodge micro-grid', customer: 'Livingstone Lodge Collective', stage: 'Operating', tone: 'green', pm: 'Bwalya M.', budget: '$121,000', actual: '$117,500' },
];

export const projectTabsList = [
  ['tasks', 'Tasks'],
  ['subs', 'Subcontractors'],
  ['budget', 'Budget vs actual'],
  ['risk', 'Risk register'],
];

export const milestones = [
  { label: 'Design approved', state: 'done' },
  { label: 'Materials procured', state: 'done' },
  { label: 'Mechanical install', state: 'current' },
  { label: 'Electrical install', state: 'upcoming' },
  { label: 'Commissioning', state: 'upcoming' },
].map((m) => ({
  ...m,
  color: m.state === 'done' ? '#2563EB' : m.state === 'current' ? '#1E4FC4' : '#D2D8DC',
  bg: m.state === 'upcoming' ? '#FFFFFF' : m.state === 'current' ? '#EAF0FE' : '#2563EB',
}));

export const tasks = [
  { name: 'Racking installation — Zone A', owner: 'MetalWorks Zambia', due: '2 Aug 2026', status: 'In progress', tone: 'blue' },
  { name: 'Inverter mounting', owner: 'Sensecon field team', due: '6 Aug 2026', status: 'Blocked', tone: 'red' },
  { name: 'DC cabling', owner: 'Copperbelt Electrical', due: '10 Aug 2026', status: 'Not started', tone: 'slate' },
];

export const subs = [
  { name: 'MetalWorks Zambia', scope: 'Mounting structure', status: 'Active', tone: 'blue' },
  { name: 'Copperbelt Electrical', scope: 'DC/AC installation', status: 'Active', tone: 'blue' },
];

export const risks = [
  { risk: 'Import delay on AC protection panel', severity: 'High', tone: 'red', mitigation: 'Air freight sub-component; local sourcing backup' },
  { risk: 'Rainy season may delay roof access', severity: 'Medium', tone: 'amber', mitigation: 'Front-load mechanical works to Aug' },
];

export const budgetLines = [
  { label: 'Modules & inverters', budget: 395000, actual: 382000 },
  { label: 'Structure & BOS', budget: 98000, actual: 104000 },
  { label: 'Labour', budget: 74000, actual: 68000 },
  { label: 'Contingency', budget: 45000, actual: 12000 },
];

// ---- Plants ----
export const plants = [
  { id: 'PLT-011', name: 'Kitwe Industrial Park', stage: 'commissioning', stageLabel: 'Commissioning', tone: 'violet', capacity: '480 kWp', equip: '4× Huawei 100KTL', pr: 0.81, health: 'Watch', healthTone: 'slate' },
  { id: 'PLT-014', name: 'Ndola Cold Storage', stage: 'operating', stageLabel: 'Operating', tone: 'green', capacity: '640 kWp', equip: '2× SMA Sunny 320', pr: 0.68, health: 'Critical', healthTone: 'red' },
  { id: 'PLT-009', name: 'Livingstone Lodge', stage: 'operating', stageLabel: 'Operating', tone: 'green', capacity: '95 kWp', equip: '1× Huawei 100KTL', pr: 0.86, health: 'Good', healthTone: 'green' },
  { id: 'PLT-016', name: 'Mukuba Steel', stage: 'deployment', stageLabel: 'Deployment', tone: 'amber', capacity: '480 kWp', equip: '4× Huawei 100KTL', pr: null, health: '—', healthTone: 'slate' },
  { id: 'PLT-006', name: 'Mazabuka Sugar Co.', stage: 'operating', stageLabel: 'Operating', tone: 'green', capacity: '1.2 MWp', equip: '6× SMA Sunny 200', pr: 0.79, health: 'Watch', healthTone: 'slate' },
];

export const plantTabsList = [
  ['overview', 'Overview'],
  ['handover', 'Handover bundle'],
  ['work', 'Open work'],
  ['activity', 'Activity'],
];

export const plantOpenWork = [
  { id: 'WO-2291', title: 'HVAC filter replacement', priority: 'High', tone: 'red' },
  { id: 'WO-2276', title: 'String MC4 connector check — Row 4', priority: 'Medium', tone: 'amber' },
];

export const plantActivity = [
  { text: 'Performance ratio dropped below 70% threshold', time: '2 days ago' },
  { text: 'Quarterly inspection completed', time: '3 weeks ago' },
  { text: 'Handover signed off', time: '14 Mar 2026' },
];

// ---- Work orders ----
export const workOrders = [
  { id: 'WO-2291', title: 'HVAC filter replacement', plant: 'Ndola Cold Storage', type: 'O&M', tone: 'blue', priority: 'High', assignee: 'Temba N.', col: 'Open' },
  { id: 'WO-2288', title: 'Inverter firmware update', plant: 'Kitwe Industrial Park', type: 'O&M', tone: 'blue', priority: 'Low', assignee: 'Field team 3', col: 'Done' },
  { id: 'WO-2276', title: 'String connector check — Row 4', plant: 'Ndola Cold Storage', type: 'O&M', tone: 'blue', priority: 'Medium', assignee: 'Temba N.', col: 'In progress' },
  { id: 'DWO-0451', title: 'Mechanical install — racking Zone B', plant: 'Mukuba Steel', type: 'Deployment', tone: 'violet', priority: 'High', assignee: 'MetalWorks crew', col: 'In progress' },
  { id: 'DWO-0448', title: 'DC cabling pull-through', plant: 'Mukuba Steel', type: 'Deployment', tone: 'violet', priority: 'Medium', assignee: 'Copperbelt Electrical', col: 'Review' },
  { id: 'WO-2299', title: 'Vegetation clearance', plant: 'Mazabuka Sugar Co.', type: 'O&M', tone: 'blue', priority: 'Low', assignee: 'Field team 1', col: 'Open' },
];

export const woColumnsList = ['Open', 'In progress', 'Review', 'Done'];

export const woChecklist = [
  { item: 'Isolate string before work', done: true },
  { item: 'Replace filter media', done: true },
  { item: 'Function test airflow', done: false },
].map((c) => ({ ...c, boxColor: c.done ? '#2563EB' : '#FFFFFF' }));

export const woParts = [{ part: 'HVAC filter (20x20x1)', qty: 2 }];
export const woDeviations = [{ note: 'Filter housing bracket corroded — logged for replacement', tone: 'amber' }];

// ---- Commissioning ----
export const commTypes = [
  ['rooftop', 'Rooftop C&I'],
  ['ground', 'Ground-mounted'],
  ['hybrid', 'Hybrid'],
  ['minigrid', 'Mini-grid'],
];

export const dcTests = [
  { test: 'Insulation resistance', result: 'Pass', tone: 'green' },
  { test: 'Open circuit voltage per string', result: 'Pass', tone: 'green' },
];
export const acTests = [
  { test: 'Earth loop impedance', result: 'Pass', tone: 'green' },
  { test: 'RCD trip time', result: 'Fail — retest', tone: 'red' },
];
export const monTests = [{ test: 'Gateway comms link', result: 'Pass', tone: 'green' }];
export const safetyTests = [
  { test: 'Arc flash labelling', result: 'Pass', tone: 'green' },
  { test: 'Lockout/tagout points', result: 'Pass', tone: 'green' },
];
export const nonConformities = [
  { id: 'NC-0034', desc: 'RCD trip time out of spec on AC panel 2', plant: 'Mukuba Steel', status: 'Open', tone: 'red' },
  { id: 'NC-0032', desc: 'Missing arc flash label on DC combiner', plant: 'Copperbelt Cold Chain', status: 'Closed', tone: 'green' },
];

// ---- Reports ----
export const reportCatalogue = [
  { name: 'Monthly performance summary', desc: 'PR, yield, availability per plant' },
  { name: 'SLA compliance report', desc: 'Work order response & resolution times' },
  { name: 'Portfolio health report', desc: 'Cross-fleet health and attention flags' },
  { name: 'Handover audit report', desc: 'Commissioning artefacts by project' },
];

export const recentReports = [
  { name: 'Monthly performance summary — Jun 2026', by: 'Auto-scheduled', date: '1 Jul 2026' },
  { name: 'SLA compliance — Q2 2026', by: 'Bwalya M.', date: '4 Jul 2026' },
  { name: 'Handover audit — Livingstone Lodge', by: 'Mutale C.', date: '15 Mar 2026' },
];

// ---- Portal ----
export const portalPlants = [
  { name: 'Livingstone Lodge', capacity: '95 kWp', pr: '86%', health: 'Good', healthTone: 'green' },
];

export const portalHistory = [
  { id: 'WO-2201', title: 'Quarterly inspection', date: '12 Jun 2026', status: 'Closed', tone: 'green' },
  { id: 'WO-2150', title: 'Monitoring gateway swap', date: '2 Apr 2026', status: 'Closed', tone: 'green' },
];

// ---- Admin ----
export const tenants = [
  { name: 'Kariba Solar Services', plants: 27, users: 14, status: 'Active', tone: 'green' },
  { name: 'Zamsun Power Ltd', plants: 8, users: 6, status: 'Active', tone: 'green' },
  { name: 'Copperbelt Energy Co-op', plants: 3, users: 3, status: 'Trial', tone: 'amber' },
];

export const users = [
  { name: 'Bwalya Mumba', role: 'Project manager', tone: 'violet' },
  { name: 'Chanda Kunda', role: 'Sales & BD lead', tone: 'blue' },
  { name: 'Temba Ngoma', role: 'Field technician', tone: 'slate' },
  { name: 'Mwansa Banda', role: 'Site surveyor', tone: 'slate' },
];

export const templates = [
  { name: 'Rooftop C&I survey template', kind: 'Survey' },
  { name: 'Standard deployment project template', kind: 'Project' },
  { name: 'Commissioning checklist — ground mount', kind: 'Commissioning' },
];

export const integrations = [
  { name: 'SMS gateway', status: 'Connected', tone: 'green' },
  { name: 'WhatsApp Business API', status: 'Connected', tone: 'green' },
  { name: 'Weather data feed', status: 'Connected', tone: 'green' },
  { name: 'ZESCO tariff feed', status: 'Not configured', tone: 'slate' },
];

export const auditLog = [
  { who: 'Bwalya M.', action: 'Updated user role — Temba Ngoma', time: 'Today 09:14' },
  { who: 'Platform admin', action: 'Enabled WhatsApp integration for Kariba Solar Services', time: 'Yesterday' },
];
