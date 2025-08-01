
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">لوحة التحكم</h2>
        <nav className="flex flex-col space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className={`text-left p-2 rounded ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            الإحصائيات
          </button>
          <button
            onClick={() => navigate('/dashboard/users')}
            className={`text-left p-2 rounded ${isActive('/dashboard/users') ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            المستخدمين
          </button>
          <button
            onClick={() => navigate('/dashboard/ads')}
            className={`text-left p-2 rounded ${isActive('/dashboard/ads') ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            الإعلانات
          </button>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className={`text-left p-2 rounded ${isActive('/dashboard/settings') ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            الإعدادات
          </button>
          <button
            onClick={handleLogout}
            className="text-left p-2 rounded text-red-600 hover:bg-red-50 mt-8"
          >
            تسجيل الخروج
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
