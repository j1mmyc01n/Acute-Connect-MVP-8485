import * as FiIcons from 'react-icons/fi';

const { 
  FiClipboard, FiBookOpen, FiGrid, FiZap, FiUsers, FiHome, 
  FiBarChart2, FiSettings, FiUser, FiFileText, FiShield, 
  FiColumns, FiActivity, FiCpu, FiTerminal, FiMap, FiUserPlus,
  FiMessageSquare, FiAlertCircle, FiUserMinus, FiPieChart, FiTrendingUp
} = FiIcons;

export const MENU = [
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
    group: "ADMIN",
    items: [
      { id: "admin", label: "Triage Dashboard", icon: FiGrid, badge: "Main" },
      { id: "crm", label: "Client CRM", icon: FiUsers, badge: "Sync" },
      { id: "crisis", label: "Crisis Management", icon: FiAlertCircle, badge: "Alert" },
      { id: "crisis_analytics", label: "Crisis Event Analytics", icon: FiPieChart, badge: null },
      { id: "heatmap", label: "City Heat Map & Dispatch", icon: FiMap, badge: "Hot Spot" },
      { id: "reports", label: "Reports", icon: FiBarChart2, badge: "Updated" },
      { id: "invoicing", label: "Invoicing & Billing", icon: FiFileText, badge: "Finance" },
      { id: "feedback_dash", label: "User Feedback Dashboard", icon: FiMessageSquare, badge: "Issues" },
      { id: "features", label: "Feature Requests", icon: FiColumns, badge: "Vote" },
      { id: "bulk_offboard", label: "Bulk Client Offboarding", icon: FiUserMinus, badge: null },
    ],
  },
  {
    group: "SYSADMIN",
    items: [
      { id: "sysdash", label: "System Dashboard", icon: FiActivity, badge: null },
      { id: "provider_metrics", label: "Provider Performance Metrics", icon: FiTrendingUp, badge: null },
      { id: "offices", label: "Care Centre Management", icon: FiHome, badge: "Manage" },
      { id: "integrations", label: "Integrations", icon: FiZap, badge: "API" },
      { id: "users", label: "Staff Management", icon: FiUser, badge: "Access" },
      { id: "modaccess", label: "Module Access", icon: FiShield, badge: "Permissions" },
      { id: "regression", label: "Regression Tests", icon: FiCpu, badge: "QA" },
      { id: "settings", label: "Settings", icon: FiSettings, badge: "Config" },
      { id: "sitemap", label: "Site Map & Wireframes", icon: FiColumns, badge: "PDF" },
      { id: "logs", label: "System Logs", icon: FiFileText, badge: "Monitor" },
      { id: "superadmin", label: "⚡ Super Admin", icon: FiTerminal, badge: "System" },
    ],
  },
  {
    group: "PROVIDER",
    items: [
      { id: "join_provider", label: "Join as Provider", icon: FiUserPlus, badge: "$250/mo" },
    ]
  }
];

export const ALL_PAGES = MENU.flatMap((g) => g.items);
export const findPage = (id) => ALL_PAGES.find((p) => p.id === id);