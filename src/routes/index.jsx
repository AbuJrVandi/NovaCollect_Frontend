import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoadingScreen from '../components/ui/LoadingScreen';

const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Notifications = lazy(() => import('../pages/dashboard/Notifications'));
const FormList = lazy(() => import('../pages/forms/FormList'));
const FormBuilder = lazy(() => import('../pages/forms/FormBuilder'));
const SubmissionList = lazy(() => import('../pages/submissions/SubmissionList'));
const SubmissionView = lazy(() => import('../pages/submissions/SubmissionView'));
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const ProjectList = lazy(() => import('../pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('../pages/projects/ProjectDetail'));
const ReportList = lazy(() => import('../pages/reports/ReportList'));

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
      <Route path="/register" element={<SuspenseWrapper><Register /></SuspenseWrapper>} />
      <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPassword /></SuspenseWrapper>} />

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
        <Route path="notifications" element={<SuspenseWrapper><Notifications /></SuspenseWrapper>} />
        <Route path="forms" element={<SuspenseWrapper><FormList /></SuspenseWrapper>} />
        <Route path="forms/new" element={<SuspenseWrapper><FormBuilder /></SuspenseWrapper>} />
        <Route path="forms/:id/edit" element={<SuspenseWrapper><FormBuilder /></SuspenseWrapper>} />
        <Route path="submissions" element={<SuspenseWrapper><SubmissionList /></SuspenseWrapper>} />
        <Route path="submissions/:id" element={<SuspenseWrapper><SubmissionView /></SuspenseWrapper>} />
        <Route path="analytics" element={<SuspenseWrapper><Analytics /></SuspenseWrapper>} />
        <Route path="projects" element={<SuspenseWrapper><ProjectList /></SuspenseWrapper>} />
        <Route path="projects/:id" element={<SuspenseWrapper><ProjectDetail /></SuspenseWrapper>} />
        <Route path="reports" element={<SuspenseWrapper><ReportList /></SuspenseWrapper>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
