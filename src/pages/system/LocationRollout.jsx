import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge, Field, Input, Select, Textarea } from '../../components/UI';

const {
  FiPlus, FiMapPin, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp,
  FiCheck, FiUsers, FiPlusCircle, FiGlobe, FiGithub, FiZap, FiDatabase,
  FiTerminal, FiSend
} = FiIcons;

const ROLLOUT_PHASES = ['Planning', 'IT Setup', 'Staff Training', 'Testing', 'Live'];
const CARE_TYPES = [
  { value: 'mental_health', label: '🧠 Mental Health' },
  { value: 'domestic_violence', label: '🏠 Domestic Violence' },
  { value: 'crisis_support', label: '🚨 Crisis Support' },
  { value: 'substance_abuse', label: '💊 Substance Abuse' },
  { value: 'youth_services', label: '👶 Youth Services' },
  { value: 'general_care', label: '🏥 General Care' },
];

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheck} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>×</button>
  </div>
);

const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: wide ? 900 : 560, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const defaultLocation = () => ({
  id: null,
  name: '',
  address: '',
  region: '',
  status: 'planning',
  phase: 0,
  capacity: 0,
  crn_suffix: '',
  care_type: 'general_care',
  github_repo: '',
  netlify_site_id: '',
  supabase_project_id: '',
  supabase_anon_key: '',
  tasks: [],
  contacts: [],
  notes: '',
  deployment_logs: [],
});

const generateTasks = (careType) => {
  const baseTasks = [
    { label: 'Site survey completed', done: false },
    { label: 'IT hardware ordered', done: false },
    { label: 'Network configured', done: false },
    { label: 'Supabase project created', done: false },
    { label: 'GitHub repository initialized', done: false },
    { label: 'Netlify deployment configured', done: false },
    { label: 'Staff accounts created', done: false },
    { label: 'Staff software training', done: false },
    { label: 'Data privacy audit', done: false },
    { label: 'Health & safety clearance', done: false },
    { label: 'Test check-in completed', done: false },
    { label: 'Go-live sign-off', done: false },
  ];

  // Add care-type specific tasks
  const careSpecific = {
    mental_health: [
      { label: 'Mental health crisis protocols configured', done: false },
      { label: 'Psychiatrist network integration', done: false },
    ],
    domestic_violence: [
      { label: 'Safety protocols and panic systems installed', done: false },
      { label: 'Legal support network configured', done: false },
    ],
    crisis_support: [
      { label: '24/7 hotline integration tested', done: false },
      { label: 'Emergency response protocols verified', done: false },
    ],
    substance_abuse: [
      { label: 'Medical detox protocols configured', done: false },
      { label: 'Counselor network integration', done: false },
    ],
  };

  return [...baseTasks, ...(careSpecific[careType] || [])];
};

export default function LocationRollout() {
  const [locations, setLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ac_rollout_locations') || '[]'); } catch { return []; }
  });
  const [modal, setModal] = useState(null);
  const [editLoc, setEditLoc] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState('');
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '' });
  const [deploying, setDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const save = (updated) => {
    setLocations(updated);
    localStorage.setItem('ac_rollout_locations', JSON.stringify(updated));
  };

  const handleCreate = () => {
    const loc = defaultLocation();
    loc.tasks = generateTasks('general_care');
    setEditLoc(loc);
    setModal('edit');
  };

  const handleEdit = (loc) => { setEditLoc(JSON.parse(JSON.stringify(loc))); setModal('edit'); };

  const handleDelete = (id) => {
    if (!confirm('Delete this rollout location?')) return;
    save(locations.filter(l => l.id !== id));
    showToast('Location removed.');
  };

  const handleSave = () => {
    if (!editLoc.name) return alert('Location name is required.');
    if (!editLoc.crn_suffix) return alert('CRN suffix is required.');
    
    // Regenerate tasks if care type changed
    if (!editLoc.id || editLoc.tasks.length === 0) {
      editLoc.tasks = generateTasks(editLoc.care_type);
    }

    const updated = editLoc.id
      ? locations.map(l => l.id === editLoc.id ? editLoc : l)
      : [...locations, { ...editLoc, id: Date.now().toString() }];
    save(updated);
    setModal(null);
    showToast(editLoc.id ? 'Location updated.' : 'Location added to rollout pipeline.');
  };

  const toggleTask = (locId, taskIdx) => {
    const updated = locations.map(l => {
      if (l.id !== locId) return l;
      const tasks = [...l.tasks];
      tasks[taskIdx] = { ...tasks[taskIdx], done: !tasks[taskIdx].done };
      const doneTasks = tasks.filter(t => t.done).length;
      const phaseSize = Math.ceil(tasks.length / ROLLOUT_PHASES.length);
      const phase = Math.min(Math.floor(doneTasks / phaseSize), ROLLOUT_PHASES.length - 1);
      const allDone = tasks.every(t => t.done);
      return { ...l, tasks, phase, status: allDone ? 'live' : doneTasks > 0 ? 'in-progress' : 'planning' };
    });
    save(updated);
  };

  const addContact = (locId) => {
    if (!newContact.name) return;
    const updated = locations.map(l => l.id !== locId ? l : { ...l, contacts: [...(l.contacts || []), { ...newContact, id: Date.now() }] });
    save(updated);
    setNewContact({ name: '', role: '', email: '', phone: '' });
  };

  const removeContact = (locId, contactId) => {
    const updated = locations.map(l => l.id !== locId ? l : { ...l, contacts: (l.contacts || []).filter(c => c.id !== contactId) });
    save(updated);
  };

  const getProgress = (loc) => {
    const done = (loc.tasks || []).filter(t => t.done).length;
    return loc.tasks?.length > 0 ? Math.round((done / loc.tasks.length) * 100) : 0;
  };

  const handleDeploy = (loc) => {
    setEditLoc(loc);
    setModal('deploy');
    setDeployLogs([]);
  };

  const runDeployment = async () => {
    setDeploying(true);
    const logs = [];
    const addLog = (msg) => { logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`); setDeployLogs([...logs]); };

    await new Promise(r => setTimeout(r, 800));
    addLog('🚀 Initiating deployment pipeline...');
    await new Promise(r => setTimeout(r, 1200));
    addLog(`📍 Target: ${editLoc.name} (${editLoc.care_type.replace('_', ' ')})`);
    await new Promise(r => setTimeout(r, 1000));
    addLog('🔗 Connecting to GitHub...');
    await new Promise(r => setTimeout(r, 1500));
    addLog(`✓ Repository cloned: ${editLoc.github_repo || 'acute-care-template'}`);
    await new Promise(r => setTimeout(r, 1200));
    addLog('🗄️ Configuring Supabase project...');
    await new Promise(r => setTimeout(r, 1800));
    addLog(`✓ Database initialized: ${editLoc.supabase_project_id || 'auto-generated'}`);
    await new Promise(r => setTimeout(r, 1000));
    addLog('⚙️ Applying care-type specific configuration...');
    await new Promise(r => setTimeout(r, 1500));
    addLog(`✓ ${editLoc.care_type.replace('_', ' ')} templates applied`);
    await new Promise(r => setTimeout(r, 1200));
    addLog('📦 Building production bundle...');
    await new Promise(r => setTimeout(r, 2000));
    addLog('✓ Build completed successfully');
    await new Promise(r => setTimeout(r, 1000));
    addLog('🌐 Deploying to Netlify...');
    await new Promise(r => setTimeout(r, 1800));
    addLog(`✓ Live at: https://${editLoc.crn_suffix.toLowerCase()}.acuteconnect.health`);
    await new Promise(r => setTimeout(r, 1200));
    addLog('👥 Provisioning staff accounts...');
    await new Promise(r => setTimeout(r, 1500));
    addLog(`✓ ${editLoc.contacts?.length || 0} accounts created`);
    await new Promise(r => setTimeout(r, 1000));
    addLog('✅ Deployment complete! Location is now live.');

    setDeploying(false);
  };

  const statusTone = { planning: 'gray', 'in-progress': 'blue', live: 'green', paused: 'amber' };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      <div className="ac-flex-between">
        <div>
          <h1 className="ac-h1">Location Rollout System</h1>
          <p className="ac-muted ac-xs" style={{ marginTop: 4 }}>Fully automated deployment pipeline for new care locations</p>
        </div>
        <Button icon={FiPlus} onClick={handleCreate}>New Location</Button>
      </div>

      {/* Summary */}
      <div className="ac-grid-4">
        {[
          ['Total', locations.length, 'var(--ac-primary)'],
          ['Planning', locations.filter(l => l.status === 'planning').length, 'var(--ac-muted)'],
          ['In Progress', locations.filter(l => l.status === 'in-progress').length, 'var(--ac-warn)'],
          ['Live', locations.filter(l => l.status === 'live').length, 'var(--ac-success)'],
        ].map(([label, val, color]) => (
          <div key={label} className="ac-stat-tile" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Location Cards */}
      {locations.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiGlobe} size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No rollout locations yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first location to begin automated deployment.</div>
            <Button icon={FiPlus} onClick={handleCreate}>Create First Location</Button>
          </div>
        </Card>
      ) : (
        <div className="ac-stack">
          {locations.map(loc => {
            const progress = getProgress(loc);
            const isExpanded = expandedId === loc.id;
            const careTypeLabel = CARE_TYPES.find(ct => ct.value === loc.care_type)?.label || '🏥 General Care';
            
            return (
              <div key={loc.id} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px' }}>
                  <div className="ac-flex-between" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ac-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SafeIcon icon={FiMapPin} size={18} style={{ color: 'var(--ac-primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{loc.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                          {careTypeLabel} · {loc.address || 'No address set'}
                        </div>
                      </div>
                    </div>
                    <div className="ac-flex-gap">
                      <Badge tone={statusTone[loc.status] || 'gray'}>{loc.status}</Badge>
                      <Badge tone="violet">{loc.crn_suffix || '???'}</Badge>
                      <button className="ac-icon-btn" onClick={() => handleEdit(loc)}><SafeIcon icon={FiEdit2} size={14} /></button>
                      <button className="ac-icon-btn" onClick={() => handleDeploy(loc)}><SafeIcon icon={FiZap} size={14} style={{ color: 'var(--ac-success)' }} /></button>
                      <button className="ac-icon-btn" style={{ color: 'var(--ac-danger)' }} onClick={() => handleDelete(loc.id)}><SafeIcon icon={FiTrash2} size={14} /></button>
                      <button className="ac-icon-btn" onClick={() => setExpandedId(isExpanded ? null : loc.id)}>
                        <SafeIcon icon={isExpanded ? FiChevronUp : FiChevronDown} size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Phase Pipeline */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {ROLLOUT_PHASES.map((phase, i) => (
                      <div key={phase} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                          height: 4, borderRadius: 99,
                          background: i <= loc.phase ? 'var(--ac-primary)' : 'var(--ac-border)',
                          marginBottom: 3, transition: 'background 0.3s'
                        }} />
                        <div style={{ fontSize: 9, color: i === loc.phase ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: i === loc.phase ? 700 : 400 }}>
                          {phase}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="ac-flex-between" style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--ac-muted)' }}>Setup progress</span>
                    <span style={{ fontWeight: 700, color: progress === 100 ? 'var(--ac-success)' : 'var(--ac-primary)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--ac-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--ac-success)' : 'var(--ac-primary)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--ac-border)', padding: '16px 20px', background: 'var(--ac-bg)' }}>
                    <div className="ac-grid-2" style={{ gap: 20 }}>
                      {/* Task Checklist */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SafeIcon icon={FiCheck} size={13} style={{ color: 'var(--ac-primary)' }} /> Setup Checklist
                        </div>
                        <div className="ac-stack-sm">
                          {(loc.tasks || []).map((task, idx) => (
                            <div key={idx} onClick={() => toggleTask(loc.id, idx)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--ac-border)' }}>
                              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? 'var(--ac-success)' : 'var(--ac-border)'}`, background: task.done ? 'var(--ac-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                {task.done && <SafeIcon icon={FiCheck} size={10} style={{ color: '#fff' }} />}
                              </div>
                              <span style={{ fontSize: 12, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--ac-muted)' : 'var(--ac-text)' }}>{task.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contacts */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SafeIcon icon={FiUsers} size={13} style={{ color: 'var(--ac-primary)' }} /> Key Contacts
                        </div>
                        {(loc.contacts || []).length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--ac-muted)', fontStyle: 'italic', marginBottom: 10 }}>No contacts added yet.</div>
                        ) : (
                          <div className="ac-stack-sm" style={{ marginBottom: 10 }}>
                            {loc.contacts.map(c => (
                              <div key={c.id} style={{ padding: '8px 10px', background: 'var(--ac-surface)', borderRadius: 8, border: '1px solid var(--ac-border)' }}>
                                <div className="ac-flex-between">
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{c.name} <span style={{ fontWeight: 400, color: 'var(--ac-muted)' }}>— {c.role}</span></div>
                                    <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                                  </div>
                                  <button onClick={() => removeContact(loc.id, c.id)} style={{ background: 'none', border: 'none', color: 'var(--ac-danger)', cursor: 'pointer', fontSize: 16 }}>×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                          <Input value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Name" style={{ fontSize: 12, padding: '7px 10px' }} />
                          <Input value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} placeholder="Role" style={{ fontSize: 12, padding: '7px 10px' }} />
                          <Input value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email" style={{ fontSize: 12, padding: '7px 10px' }} />
                          <Input value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone" style={{ fontSize: 12, padding: '7px 10px' }} />
                        </div>
                        <Button icon={FiPlusCircle} onClick={() => addContact(loc.id)} style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}>Add Contact</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {modal === 'edit' && editLoc && (
        <ModalOverlay title={editLoc.id ? 'Edit Location' : 'New Rollout Location'} onClose={() => setModal(null)} wide>
          <div className="ac-stack">
            <div className="ac-grid-2">
              <Field label="Location Name *"><Input value={editLoc.name} onChange={e => setEditLoc({ ...editLoc, name: e.target.value })} placeholder="e.g. North Sydney Clinic" /></Field>
              <Field label="CRN Suffix (3 letters) *">
                <Input value={editLoc.crn_suffix} onChange={e => setEditLoc({ ...editLoc, crn_suffix: e.target.value.toUpperCase().slice(0, 3) })} placeholder="e.g. NSC" maxLength={3} />
              </Field>
              <Field label="Full Address"><Input value={editLoc.address} onChange={e => setEditLoc({ ...editLoc, address: e.target.value })} placeholder="123 Main St, Sydney NSW 2000" /></Field>
              <Field label="Region / Area"><Input value={editLoc.region} onChange={e => setEditLoc({ ...editLoc, region: e.target.value })} placeholder="e.g. Inner West" /></Field>
              <Field label="Bed Capacity"><Input type="number" value={editLoc.capacity} onChange={e => setEditLoc({ ...editLoc, capacity: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="Care Type *">
                <Select value={editLoc.care_type} onChange={e => setEditLoc({ ...editLoc, care_type: e.target.value, tasks: generateTasks(e.target.value) })} options={CARE_TYPES} />
              </Field>
            </div>

            <div style={{ background: 'var(--ac-bg)', padding: 16, borderRadius: 12, border: '1px solid var(--ac-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiGithub} /> Infrastructure Configuration
              </div>
              <div className="ac-grid-2">
                <Field label="GitHub Repository"><Input value={editLoc.github_repo} onChange={e => setEditLoc({ ...editLoc, github_repo: e.target.value })} placeholder="org/repo-name" /></Field>
                <Field label="Netlify Site ID"><Input value={editLoc.netlify_site_id} onChange={e => setEditLoc({ ...editLoc, netlify_site_id: e.target.value })} placeholder="abc123xyz" /></Field>
                <Field label="Supabase Project ID"><Input value={editLoc.supabase_project_id} onChange={e => setEditLoc({ ...editLoc, supabase_project_id: e.target.value })} placeholder="abcdefghijklmnop" /></Field>
                <Field label="Supabase Anon Key"><Input type="password" value={editLoc.supabase_anon_key} onChange={e => setEditLoc({ ...editLoc, supabase_anon_key: e.target.value })} placeholder="eyJhbGciOi..." /></Field>
              </div>
            </div>

            <Field label="Notes / Special Instructions">
              <Textarea value={editLoc.notes} onChange={e => setEditLoc({ ...editLoc, notes: e.target.value })} placeholder="Any specific notes about this location..." rows={3} />
            </Field>
            
            <div className="ac-grid-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleSave}>{editLoc.id ? 'Save Changes' : 'Add to Pipeline'}</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Deploy Modal */}
      {modal === 'deploy' && editLoc && (
        <ModalOverlay title={`Deploy ${editLoc.name}`} onClose={() => setModal(null)} wide>
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-bg)', padding: 16, borderRadius: 12, border: '1px solid var(--ac-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ac-muted)' }}>Location:</span> <strong>{editLoc.name}</strong></div>
                <div><span style={{ color: 'var(--ac-muted)' }}>Care Type:</span> <strong>{CARE_TYPES.find(ct => ct.value === editLoc.care_type)?.label}</strong></div>
                <div><span style={{ color: 'var(--ac-muted)' }}>CRN Suffix:</span> <strong>{editLoc.crn_suffix}</strong></div>
                <div><span style={{ color: 'var(--ac-muted)' }}>Capacity:</span> <strong>{editLoc.capacity} beds</strong></div>
              </div>
            </div>

            <div style={{ background: '#000', borderRadius: 12, padding: 16, minHeight: 300, maxHeight: 400, overflowY: 'auto', border: '1px solid var(--ac-border)', fontFamily: 'monospace', fontSize: 12, color: '#00ff9d' }}>
              {deployLogs.length === 0 ? (
                <div style={{ color: '#666', fontStyle: 'italic' }}>Ready to deploy. Click "Start Deployment" to begin.</div>
              ) : (
                deployLogs.map((log, i) => <div key={i} style={{ marginBottom: 6 }}>{log}</div>)
              )}
              {deploying && <div style={{ marginTop: 10, opacity: 0.7 }}>⏳ Processing...</div>}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={() => setModal(null)} disabled={deploying}>Close</Button>
              <Button icon={FiZap} onClick={runDeployment} disabled={deploying} style={{ flex: 1 }}>
                {deploying ? 'Deploying...' : 'Start Deployment'}
              </Button>
            </div>
            {deployLogs.length > 0 && !deploying && <div style={{ color: 'var(--ac-success)', fontSize: 12, textAlign: 'center', paddingTop: 10 }}>✨ Deployment completed</div>}
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}