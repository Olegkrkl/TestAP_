import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { toggleTheme } from '@/app/slices/uiSlice'
import PublicLayout from '@/components/layout/PublicLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Public pages
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/public/LoginPage'
import RegisterPage from '@/pages/public/RegisterPage'
import ForgotPasswordPage from '@/pages/public/ForgotPasswordPage'
import VerifyEmailPage from '@/pages/public/VerifyEmailPage'
import TestPreviewPage from '@/pages/student/TestPreviewPage'
import MistakesReviewPage from '@/pages/student/MistakesReviewPage'

// Student pages
import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentTests from '@/pages/student/StudentTests'
import TakeTestPage from '@/pages/student/TakeTestPage'
import TestResultPage from '@/pages/student/TestResultPage'
import TestHistoryPage from '@/pages/student/TestHistoryPage'
import MyTrainingTests from '@/pages/student/MyTrainingTests'
import CreateTrainingTest from '@/pages/student/CreateTrainingTest'
import ProfilePage from '@/pages/student/ProfilePage'
import CalendarPage from '@/pages/student/CalendarPage'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/TeacherDashboard'
import TeacherTests from '@/pages/teacher/TeacherTests'
import CreateTestPage from '@/pages/teacher/CreateTestPage'
import EditTestPage from '@/pages/teacher/EditTestPage'
import TestResultsPage from '@/pages/teacher/TestResultsPage'
import TeacherGroups from '@/pages/teacher/TeacherGroups'
import GroupDetailPage from '@/pages/teacher/GroupDetailPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminGroups from '@/pages/admin/AdminGroups'

export default function App() {
  const theme = useAppSelector(s => s.ui.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')

    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = theme === 'dark' ? '#0c0a14' : '#f5f3ff'
  }, [theme])

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<AppLayout role="student" />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/tests" element={<StudentTests />} />
          <Route path="/history" element={<TestHistoryPage />} />
          <Route path="/my-tests" element={<MyTrainingTests />} />
          <Route path="/my-tests/create" element={<CreateTrainingTest />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/test/:id/preview" element={<TestPreviewPage />} />
          <Route path="/test/:id/review" element={<MistakesReviewPage />} />
        </Route>
        <Route path="/test/:id" element={<TakeTestPage />} />
        <Route path="/test/:id/result" element={<TestResultPage />} />
      </Route>

      {/* Teacher */}
      <Route element={<ProtectedRoute role="teacher" />}>
        <Route element={<AppLayout role="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/tests" element={<TeacherTests />} />
          <Route path="/teacher/tests/create" element={<CreateTestPage />} />
          <Route path="/teacher/tests/:id/edit" element={<EditTestPage />} />
          <Route path="/teacher/tests/:id/results" element={<TestResultsPage />} />
          <Route path="/teacher/groups" element={<TeacherGroups />} />
          <Route path="/teacher/groups/:id" element={<GroupDetailPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AppLayout role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
        </Route>
      </Route>

      {/* Redirect based on role */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
