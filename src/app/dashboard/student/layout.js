import DashboardLayout from '@/components/DashboardLayout'

const menu = [
  { label: 'Dashboard', href: '/dashboard/student' },
  { label: 'Submit Request', href: '/dashboard/student/request' },
  { label: 'Matched Teacher', href: '/dashboard/student/matches' },
]

export default function StudentLayout({ children }) {
  return <DashboardLayout role="student" menu={menu}>{children}</DashboardLayout>
}
