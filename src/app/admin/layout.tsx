import { AdminShell } from './admin-shell';

export const metadata = {
  title: 'Admin | Civic Dev Tracker',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
