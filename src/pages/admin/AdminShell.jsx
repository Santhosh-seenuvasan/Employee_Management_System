import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../../modules/admin/shared/Layout.jsx';
import DashboardPage from '../../modules/admin/pages/hr/dashboard/DashboardPage.jsx';
import EmployeeDirectoryPage from '../../modules/admin/pages/hr/employee-directory/EmployeeDirectoryPage.jsx';
import DepartmentsPage from '../../modules/admin/pages/hr/departments/DepartmentsPage.jsx';
import RecruitmentPage from '../../modules/admin/pages/hr/recruitment/RecruitmentPage.jsx';
import PersonalDetailsStep from '../../modules/admin/pages/hr/onboarding/personal-details/PersonalDetailsStep.jsx';
import JobRoleStep from '../../modules/admin/pages/hr/onboarding/job-role/JobRoleStep.jsx';
import PayrollBenefitsStep from '../../modules/admin/pages/hr/onboarding/payroll-benefits/PayrollBenefitsStep.jsx';
import DocumentsStep from '../../modules/admin/pages/hr/onboarding/documents/DocumentsStep.jsx';
import ReviewConfirmationStep from '../../modules/admin/pages/hr/onboarding/review-confirmation/ReviewConfirmationStep.jsx';
import OnboardingTrackingPage from '../../modules/admin/pages/hr/onboarding-tracking/OnboardingTrackingPage.jsx';
import AttendancePage from '../../modules/admin/pages/hr/attendance/AttendancePage.jsx';
import LeavePage from '../../modules/admin/pages/hr/leave/LeavePage.jsx';
import TrainingPage from '../../modules/admin/pages/hr/training/TrainingPage.jsx';
import PayrollPage from '../../modules/admin/pages/hr/payroll/PayrollPage.jsx';
import PerformancePage from '../../modules/admin/pages/hr/performance/PerformancePage.jsx';
import DocumentsPage from '../../modules/admin/pages/hr/documents/DocumentsPage.jsx';
import AssetsPage from '../../modules/admin/pages/hr/assets/AssetsPage.jsx';
import ReportsPage from '../../modules/admin/pages/hr/reports/ReportsPage.jsx';
import ProfilePage from '../../modules/admin/pages/hr/profile-settings/ProfilePage.jsx';
import NotificationsPage from '../../modules/admin/pages/hr/notifications/NotificationsPage.jsx';
import SettingsPage from '../../modules/admin/pages/hr/settings/SettingsPage.jsx';

const pageRoutes = [
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'employees', element: <EmployeeDirectoryPage /> },
  { path: 'departments', element: <DepartmentsPage /> },
  { path: 'recruitment', element: <RecruitmentPage /> },
  { path: 'onboarding', element: <PersonalDetailsStep /> },
  { path: 'onboarding/personal-details', element: <PersonalDetailsStep /> },
  { path: 'onboarding/job-role', element: <JobRoleStep /> },
  { path: 'onboarding/payroll-benefits', element: <PayrollBenefitsStep /> },
  { path: 'onboarding/documents', element: <DocumentsStep /> },
  { path: 'onboarding/review', element: <ReviewConfirmationStep /> },
  { path: 'onboarding-tracking', element: <OnboardingTrackingPage /> },
  { path: 'attendance', element: <AttendancePage /> },
  { path: 'leave', element: <LeavePage /> },
  { path: 'training', element: <TrainingPage /> },
  { path: 'payroll', element: <PayrollPage /> },
  { path: 'performance', element: <PerformancePage /> },
  { path: 'documents', element: <DocumentsPage /> },
  { path: 'assets', element: <AssetsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'notifications', element: <NotificationsPage /> },
  { path: 'settings', element: <SettingsPage /> },
];

export default function AdminShell() {
  return (
    <Layout title="HR Admin Dashboard">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        {pageRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
