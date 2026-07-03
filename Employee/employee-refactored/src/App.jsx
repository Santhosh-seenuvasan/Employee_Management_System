import { useEffect, useMemo } from "react";
import EmployeeDashboard from "./components/EmployeeDashboard.jsx";
import ApplyLeave from "./components/ApplyLeave.jsx";
import AttendanceView from "./components/AttendanceView.jsx";
import SalarySlips from "./components/SalarySlips.jsx";
import Performance from "./components/Performance.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import Notifications from "./components/Notifications.jsx";
import Documents from "./components/Documents.jsx";
import Settings from "./components/Settings.jsx";
import Training from "./components/Training.jsx";

const employeeRoles = ["EMPLOYEE", "HR", "ADMIN", "MANAGEMENT"];
const employeeOnlyRoles = ["EMPLOYEE"];

const routes = [
  { key: "dashboard", title: "Employee Dashboard", folder: "employee_dashboard", paths: ["/", "/dashboard", "/employee-dashboard"], roles: [...employeeRoles, "MANAGER"], Component: EmployeeDashboard },
  { key: "profile", title: "My Profile", folder: "profile_settings", paths: ["/profile", "/profile-settings"], roles: employeeRoles, Component: ProfileSettings },
  { key: "attendance", title: "Attendance", folder: "attendance_view", paths: ["/attendance", "/attendance-view"], roles: employeeRoles, Component: AttendanceView },
  { key: "leave", title: "Apply Leave", folder: "apply_leave", paths: ["/apply-leave", "/leave"], roles: employeeRoles, Component: ApplyLeave },
  { key: "salary", title: "Salary Slips", folder: "salary_slips", paths: ["/salary", "/salary-slips"], roles: employeeRoles, Component: SalarySlips },
  { key: "performance", title: "Performance", folder: "performance", paths: ["/performance"], roles: employeeRoles, Component: Performance },
  { key: "training", title: "Training", folder: "training", paths: ["/training"], roles: employeeOnlyRoles, Component: Training },
  { key: "notifications", title: "Notifications", folder: "notifications", paths: ["/notifications"], roles: employeeOnlyRoles, Component: Notifications },
  { key: "documents", title: "Documents", folder: "documents", paths: ["/documents"], roles: employeeOnlyRoles, Component: Documents },
  { key: "settings", title: "Settings", folder: "settings", paths: ["/settings"], roles: employeeOnlyRoles, Component: Settings }
];

function normalizePath(pathname) {
  return pathname.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase() || "/";
}

function findRoute(pathname) {
  const path = normalizePath(pathname);
  return routes.find((route) => {
    if (route.paths.includes(path)) return true;
    if (path === "/index.html" && route.key === "dashboard") return true;
    return path.includes("/employee/" + route.folder) || path.endsWith("/" + route.folder);
  }) || routes[0];
}

function initializeShell(route) {
  document.title = route.title + " | Corporate EMS";

  if (typeof window.guardPage === "function") {
    window.guardPage(route.roles);
  }

  window.requestAnimationFrame(() => {
    window.EMS_loadSidebar?.();
    window.EMS_Layout?.init?.();
    window.EMS_initHeader?.();
  });
}

export default function App() {
  const route = useMemo(() => findRoute(window.location.pathname), []);
  const Page = route.Component;

  useEffect(() => {
    initializeShell(route);
  }, [route]);

  return <Page />;
}
