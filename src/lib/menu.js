import * as FiIcons from 'react-icons/fi';

const { 
  FiClipboard, FiBookOpen, FiGrid, FiZap, FiUsers, FiHome, 
  FiBarChart2, FiSettings, FiUser, FiFileText, FiShield, 
  FiColumns, FiHash, FiActivity, FiCpu, FiTerminal, FiMap, FiUserPlus,
  FiMessageSquare, FiAlertCircle
} = FiIcons;

export const MENU = [
  {
    group: "ADMINISTRATOR",
    items: [
      { id: "crm", label: "Client CRM", icon: FiUsers, badge: "Sync" },
      { id: "crisis", label: "Crisis Management", icon: FiAlertCircle, badge: "Alert" },
      { id: "features", label: "Feature Requests", icon: FiColumns, badge: "Vote" },
      { id: "clients", label: "Patient Registry", icon: FiUsers, badge: "Active" },
      { id: "reports", label: "Reports", icon: FiBarChart2, badge: "Updated" },
      { id: "admin", label: "Triage Dashboard", icon: FiGrid, badge: "Main" },
    ],
  },
  {
    group: "CLIENT",
    items: [
      { id: "checkin", label: "Check-In", icon: FiClipboard, badge: null },
      { id: "feedback", label: "Feedback & Tickets", icon: FiMessageSquare, badge: "Issues" },
      { id: "professionals", label: "Professionals", icon: FiMap, badge: "New" },
      { id: "resources", label: "Resources", icon: FiBookOpen, badge: null },
    ],
  },
  {
    group: "PARTNERS",
    items: [
      { id: "join_provider", label: "Join as Provider", icon: FiUserPlus, badge: "$250/mo" },
    ]
  },
  {
    group: "SYSADMIN",
    items: [
      { id: "offices", label: "Care Centre Management", icon: FiHome, badge: "Manage" },
      { id: "heatmap", label: "City Heat Map", icon: FiMap, badge: "Live" },
      { id: "crn", label: "CRN Generator", icon: FiHash, badge: "System" },
      { id: "integrations", label: "Integrations", icon: FiZap, badge: "API" },
      { id: "invoicing", label: "Invoicing & Billing", icon: FiFileText, badge: "Finance" },
      { id: "modaccess", label: "Module Access", icon: FiShield, badge: "Permissions" },
      { id: "regression", label: "Regression Tests", icon: FiCpu, badge: "QA" },
      { id: "settings", label: "Settings", icon: FiSettings, badge: "Config" },
      { id: "sitemap", label: "Site Map & Wireframes", icon: FiColumns, badge: "PDF" },
      { id: "users", label: "Staff Management", icon: FiUser, badge: "Access" },
      { id: "superadmin", label: "⚡ Super Admin", icon: FiTerminal, badge: "System" },
      { id: "sysdash", label: "System Dashboard", icon: FiActivity, badge: null },
      { id: "logs", label: "System Logs", icon: FiFileText, badge: "Monitor" },
    ],
  }
];

export const ALL_PAGES = MENU.flatMap((g) => g.items);
export const findPage = (id) => ALL_PAGES.find((p) => p.id === id);