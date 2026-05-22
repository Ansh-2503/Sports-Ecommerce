import { useApp } from '../context/AppContext';
import { Dashboard } from '../components/Dashboard';

export default function DashboardPage() {
  const { user, isAdmin } = useApp();

  return (
    <main className="flex-1">
      <Dashboard adminId={isAdmin ? user?._id : undefined} />
    </main>
  );
}
