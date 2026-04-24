import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx, generateCRN, callClaudeAI } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge } from '../components/UI';

const { FiSearch, FiRefreshCw, FiPlus, FiTerminal, FiCheckCircle, FiAlertTriangle, FiDownload, FiUserPlus } = FiIcons;

export const AdminPage = () => {
  const [checkins, setCheckins] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [newCRN, setNewCRN] = useState('');
  const [generatingCRN, setGeneratingCRN] = useState(false);

  useEffect(() => {
    fetchCheckinsAndClients();
  }, []);

  const fetchCheckinsAndClients = async () => {
    setLoading(true);
    try {
      const [checkinsRes, clientsRes] = await Promise.all([
        supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }),
        supabase.from('clients_1777020684735').select('*')
      ]);
      if (checkinsRes.error) throw checkinsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      setCheckins(checkinsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error('Database Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCRN = async () => {
    setGeneratingCRN(true);
    try {
      const code = generateCRN();
      const { error } = await supabase
        .from('crns_1740395000')
        .insert([{ code, is_active: true }]);
      
      if (error) throw error;
      setNewCRN(code);
      fetchCheckinsAndClients();
    } catch (err) {
      alert(`CRN Generation Failed: ${err.message}`);
    } finally {
      setGeneratingCRN(false);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">Clinical Triage</h1>
        <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={fetchCheckinsAndClients}>Refresh</Button>
      </div>

      <div className="ac-grid-2">
        <Card title="Quick Actions">
          <Button variant="primary" style={{ width: '100%' }} icon={FiPlus} onClick={handleGenerateCRN} disabled={generatingCRN}>
            {generatingCRN ? "Syncing..." : "Generate New CRN"}
          </Button>
          {newCRN && (
            <div style={{ background: 'var(--ac-primary-soft)', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--ac-primary)', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--ac-primary)', fontWeight: 700 }}>NEW CRN</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>{newCRN}</div>
            </div>
          )}
        </Card>
        
        <Card title="Pulse">
          <div className="ac-grid-2">
            <div className="ac-stat-tile">
              <div className="ac-muted ac-xs">Pending</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{checkins.filter(c => c.status === 'pending').length}</div>
            </div>
            <div className="ac-stat-tile">
              <div className="ac-muted ac-xs">Mood Avg</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ac-primary)' }}>
                {checkins.length ? (checkins.reduce((a,b)=>a+b.mood,0)/checkins.length).toFixed(1) : '0'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>CRN</th><th>Patient</th><th>Mood</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Fetching real-time data...</td></tr>
              ) : checkins.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No records found.</td></tr>
              ) : checkins.map(c => {
                const client = clients.find(cl => cl.crn === c.crn);
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.crn}</td>
                    <td>{client?.name || <span className="ac-muted">Unlinked</span>}</td>
                    <td><Badge tone={c.mood < 4 ? 'red' : 'green'}>{c.mood}/10</Badge></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCheckin(c)}>View</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    setSubmitting(true);
    try {
      const crn = generateCRN();
      
      // Atomic multi-table insert
      const crnInsert = await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
      if (crnInsert.error) throw crnInsert.error;

      const clientInsert = await supabase.from('clients_1777020684735').insert([{ ...form, crn }]);
      if (clientInsert.error) throw clientInsert.error;
      
      setShowForm(false);
      setForm({ name: '', phone: '', email: '' });
      fetchClients();
    } catch (err) {
      alert(`Registration Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">Patient Registry</h1>
        <Button variant="primary" size="sm" icon={FiUserPlus} onClick={() => setShowForm(true)}>Register Patient</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Name</th><th>CRN</th><th>Contact</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Syncing Patient Data...</td></tr>
              ) : clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.crn}</td>
                  <td className="ac-muted ac-xs">{c.email}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card title="New Patient Registration" style={{ maxWidth: 400, width: '100%', margin: 20 }}>
            <div className="ac-stack">
              <Field label="Full Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" /></Field>
              <Field label="Email"><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 890" /></Field>
              <div className="ac-grid-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreateClient} disabled={submitting}>
                  {submitting ? "Processing..." : "Create Account"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const ReportsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">Clinical Reports</h1>
        <Button variant="outline" size="sm" icon={FiDownload} disabled={!data.length}>Export CSV</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Date</th><th>CRN</th><th>Mood Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading History...</td></tr> : 
               data.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace' }}>{d.crn}</td>
                  <td>{d.mood}/10</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const CRNPage = () => {
  const [crns, setCrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrns();
  }, []);

  const fetchCrns = async () => {
    const { data } = await supabase.from('crns_1740395000').select('*').order('created_at', { ascending: false });
    setCrns(data || []);
    setLoading(false);
  };

  return (
    <div className="ac-stack">
      <h1 className="ac-h1">CRN Registry</h1>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Reference Code</th><th>Status</th><th>Provisioned Date</th></tr>
            </thead>
            <tbody>
              {crns.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
                  <td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};