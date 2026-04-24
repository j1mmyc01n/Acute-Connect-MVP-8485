import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { Badge, Button, Card, Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';

const { FiRefreshCw, FiEdit2, FiUserX, FiX, FiCheckCircle, FiCalendar, FiUserPlus, FiBell } = FiIcons;

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const ModalOverlay = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default function CRMPage() {
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
  const [offboardReason, setOffboardReason] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCentre, setFilterCentre] = useState('all');
  const [activeTab, setActiveTab] = useState('clients');

  useEffect(() => {
    fetchClients();
    fetchCentres();
    fetchPendingRequests();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const fetchCentres = async () => {
    const { data, error } = await supabase.from('care_centres_1777090000').select('*').order('name');
    if (!error && data) setCentres(data);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase.from('crn_requests_1777090006').select('*').order('created_at', { ascending: false });
    setPendingRequests(data || []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required.');
    const crn = generateCRN();
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    const { error } = await supabase.from('clients_1777020684735').insert([{
      ...form, crn, status: 'active', care_centre: form.care_centre || null
    }]);
    if (!error) {
      showToast(`Patient registered! CRN: ${crn}`);
      setModalMode(null);
      setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
      fetchClients();
    } else { alert(error.message); }
  };

  const handleEdit = async () => {
    const { error } = await supabase.from('clients_1777020684735').update({
      name: form.name, email: form.email, phone: form.phone,
      support_category: form.support_category, care_centre: form.care_centre || null
    }).eq('id', selectedClient.id);
    if (!error) { showToast('Client profile updated.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const handleOffboard = async () => {
    if (!offboardReason) return alert('Please provide a reason.');
    const { error } = await supabase.from('clients_1777020684735').update({
      status: 'offboarded', offboard_reason: offboardReason
    }).eq('id', selectedClient.id);
    if (!error) { showToast('Client offboarded.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const filteredClients = clients.filter(c => {
    const matchCat = filterCategory === 'all' || c.support_category === filterCategory;
    const matchCentre = filterCentre === 'all' || c.care_centre === filterCentre;
    return matchCat && matchCentre;
  });

  const categories = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const categoryOptions = categories.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  const filterCategoryOptions = [{ value: 'all', label: 'All Categories' }, ...categoryOptions];
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '-- Select Care Centre --' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '-- No Care Centres in DB --' }];
  const filterCentreOptions = [{ value: 'all', label: 'All Centres' }, ...centres.map(c => ({ value: c.name, label: c.name }))];

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      <div className="ac-flex-between">
        <h1 className="ac-h1">Client CRM</h1>
        <div className="ac-flex-gap">
          {pendingRequests.filter(r => r.status === 'pending').length > 0 && (
            <button className="ac-btn ac-btn-outline" style={{ position: 'relative' }} onClick={() => setActiveTab('requests')}>
              <SafeIcon icon={FiBell} size={15} />
              <span>CRN Requests</span>
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pendingRequests.filter(r => r.status === 'pending').length}
              </span>
            </button>
          )}
          <Button variant="outline" icon={FiCalendar} onClick={() => showToast('Calendar sync initiated.')}>Sync</Button>
          <Button icon={FiUserPlus} onClick={() => { setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' }); setModalMode('create'); }}>Register Patient</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--ac-border)', marginBottom: 8 }}>
        {['clients', 'requests'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid var(--ac-primary)' : '2px solid transparent', marginBottom: -2, fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? 'var(--ac-primary)' : 'var(--ac-muted)', cursor: 'pointer', fontSize: 14, textTransform: 'capitalize' }}>
            {t === 'requests' ? `CRN Requests (${pendingRequests.length})` : 'All Clients'}
          </button>
        ))}
      </div>

      {activeTab === 'clients' && (
        <>
          <div className="ac-grid-2" style={{ marginBottom: 8 }}>
            <Field label="Filter by Category">
              <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} options={filterCategoryOptions} />
            </Field>
            <Field label="Filter by Care Centre">
              <Select value={filterCentre} onChange={e => setFilterCentre(e.target.value)} options={filterCentreOptions} />
            </Field>
          </div>
          <Card>
            <div className="ac-table-container">
              <table className="ac-table">
                <thead>
                  <tr><th>Name</th><th>CRN</th><th>Category</th><th>Care Centre</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
                    : filteredClients.length === 0 ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No clients found.</td></tr>
                    : filteredClients.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td className="ac-mono ac-xs">{c.crn}</td>
                        <td>
                          <Badge tone={c.support_category === 'crisis' ? 'red' : c.support_category === 'mental_health' ? 'amber' : 'blue'}>
                            {c.support_category || 'general'}
                          </Badge>
                        </td>
                        <td>
                          {c.care_centre
                            ? <Badge tone="green">{c.care_centre}</Badge>
                            : <span className="ac-xs ac-muted">Not assigned</span>}
                        </td>
                        <td>
                          <div className="ac-xs">{c.email || '—'}</div>
                          <div className="ac-xs ac-muted">{c.phone || c.mobile || '—'}</div>
                        </td>
                        <td><StatusBadge status={c.status || 'active'} /></td>
                        <td>
                          {c.status !== 'offboarded' && (
                            <div className="ac-flex-gap">
                              <button className="ac-icon-btn" onClick={() => { setSelectedClient(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || c.mobile || '', support_category: c.support_category || 'general', care_centre: c.care_centre || '' }); setModalMode('edit'); }}>
                                <SafeIcon icon={FiEdit2} size={14} />
                              </button>
                              <button className="ac-icon-btn" style={{ color: 'var(--ac-danger)' }} onClick={() => { setSelectedClient(c); setOffboardReason(''); setModalMode('offboard'); }}>
                                <SafeIcon icon={FiUserX} size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'requests' && (
        <Card title="CRN Requests from Clients">
          <div className="ac-table-container">
            <table className="ac-table">
              <thead>
                <tr><th>Name</th><th>Mobile</th><th>Email</th><th>CRN Issued</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0
                  ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No CRN requests yet.</td></tr>
                  : pendingRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.first_name}</td>
                      <td className="ac-xs">{r.mobile}</td>
                      <td className="ac-xs">{r.email}</td>
                      <td className="ac-mono ac-xs">{r.crn_issued || '—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="ac-xs ac-muted">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modalMode === 'create' && (
        <ModalOverlay title="Register New Patient" onClose={() => setModalMode(null)}>
          <div className="ac-stack">
            <p className="ac-muted ac-xs">A CRN will be auto-generated upon registration.</p>
            <Field label="Full Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" /></Field>
            <Field label="Support Category">
              <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categoryOptions} />
            </Field>
            <Field label="Care Centre">
              <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button onClick={handleCreate}>Register & Generate CRN</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {modalMode === 'edit' && (
        <ModalOverlay title="Edit Client Profile" onClose={() => setModalMode(null)}>
          <div className="ac-stack">
            <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Support Category">
              <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categoryOptions} />
            </Field>
            <Field label="Care Centre">
              <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {modalMode === 'offboard' && (
        <ModalOverlay title="Offboard Client" onClose={() => setModalMode(null)}>
          <div className="ac-stack">
            <p className="ac-muted ac-xs">You are about to offboard <strong>{selectedClient?.name}</strong>.</p>
            <Field label="Reason for Offboarding">
              <Textarea value={offboardReason} onChange={e => setOffboardReason(e.target.value)} placeholder="e.g. Treatment completed, transferred..." />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }} onClick={handleOffboard}>Confirm Offboard</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}