import { Routes, Route, Navigate } from 'react-router-dom';
import ManagementLayout from '../../modules/management/layouts/ManagementLayout.jsx';
import Dashboard from '../../modules/management/pages/Dashboard';
import Employees from '../../modules/management/pages/Employees';
import Teams from '../../modules/management/pages/Teams';
import Attendance from '../../modules/management/pages/Attendance';
import LeaveRequests from '../../modules/management/pages/LeaveRequests';
import PerformanceReviews from '../../modules/management/pages/PerformanceReviews';
import Notifications from '../../modules/management/pages/Notifications';
import Reports from '../../modules/management/pages/Reports';
import ProfileSettings from '../../modules/management/pages/ProfileSettings';
import Settings from '../../modules/management/pages/Settings';
import Approvals from '../../modules/management/pages/Approvals';
import Projects from '../../modules/management/pages/Projects';
import Meetings from '../../modules/management/pages/Meetings';
import DepartmentReports from '../../modules/management/pages/DepartmentReports';
import TeamAnalytics from '../../modules/management/pages/TeamAnalytics';
import '../../modules/management/styles/corporate-design-system.css';
import '../../modules/management/styles/portal-center.css';

export default function ManagementShell() {
  return (
    <ManagementLayout pageTitle="Management Dashboard">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="teams" element={<Teams />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="performance-reviews" element={<PerformanceReviews />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile-settings" element={<ProfileSettings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="projects" element={<Projects />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="department-reports" element={<DepartmentReports />} />
        <Route path="team-analytics" element={<TeamAnalytics />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ManagementLayout>
  );
}
