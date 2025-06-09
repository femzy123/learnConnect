import DashboardLayout from '@/components/DashboardLayout'

const menu = [
  { label: 'Dashboard', href: '/dashboard/teacher' },
  { label: 'Session Tracker', href: '/dashboard/teacher/sessions' },
  { label: 'Earnings', href: '/dashboard/teacher/earnings' },
]

export default function TeacherLayout({ children }) {
  return <DashboardLayout role="teacher" menu={menu}>{children}</DashboardLayout>
}
