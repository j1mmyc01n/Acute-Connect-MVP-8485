import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Card, Button, Badge, StatusBadge } from '../components/UI';

const { FiServer, FiActivity, FiDatabase, FiShield, FiUsers, FiSettings, FiMap } = FiIcons;

export const SuperAdminPage = () => {
  const [stats, setStats] = useState({ users: 0, checkins: 0, crns: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [u, c, cr] = await Promise.all([
        supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('crns_1740395000').select('*', { count: 'exact', head: true })
      ]);
      setStats({
        users: u.count || 0,
        checkins: c.count || 0,
        crns: cr.count || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="ac-stack">
      <h1 className="ac-h1">System Dashboard</h1>
      <div className="ac-grid-3">
        <Card title="Total Patients">
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.users}</div>
        </Card>
        <Card title="Active CRNs">
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.crns}</div>
        </Card>
        <Card title="Check-ins">
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.checkins}</div>
        </Card>
      </div>
    </div>
  );
};

export const UsersPage = () => {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    supabase.from('admin_users_1777025000000').select('*').then(({ data }) => setAdmins(data || []));
  }, []);

  return (
    <div className="ac-stack">
      <h1 className="ac-h1">Staff Management</h1>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td>{a.email}</td>
                  <td><Badge>{a.role}</Badge></td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const HeatMapPage = () => {
  return (
    <div className="ac-stack" style={{ height: 'calc(100vh - 120px)' }}>
      <h1 className="ac-h1">Geospatial Distribution</h1>
      <Card style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <iframe 
          title="Heat Map"
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d10000!2d-0.1276!3d51.5072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </Card>
    </div>
  );
};

// --- Restored System Layout Pages ---

export const SysDashPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">System Overview</h1>
    <Card><p className="ac-muted">Real-time system health and overview metrics will be displayed here.</p></Card>
  </div>
);

export const LogsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">System Logs</h1>
    <Card><p className="ac-muted">Application runtime and security logs.</p></Card>
  </div>
);

export const IntegrationPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Integrations</h1>
    <Card><p className="ac-muted">Manage API configurations and third-party integrations.</p></Card>
  </div>
);

export const RegressionPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Regression Testing</h1>
    <Card><p className="ac-muted">Automated regression testing suites environment.</p></Card>
  </div>
);

export const SettingsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">System Settings</h1>
    <Card><p className="ac-muted">Global application configuration and defaults.</p></Card>
  </div>
);

export const ModuleAccessPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Module Access</h1>
    <Card><p className="ac-muted">Role-based access control and module permissions management.</p></Card>
  </div>
);

export const SiteMapPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Site Map</h1>
    <Card><p className="ac-muted">Application routing and directory overview.</p></Card>
  </div>
);

export const OfficesPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Offices</h1>
    <Card><p className="ac-muted">Manage physical office locations and service regions.</p></Card>
  </div>
);