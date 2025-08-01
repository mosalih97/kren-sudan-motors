
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // إذا كان التحقق من المصادقة لا يزال جارياً، اعرض شاشة التحميل
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري التحقق من حالة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجلاً للدخول، وجهه لصفحة المصادقة
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // الآن نتحقق من صلاحيات الإدارة فقط بعد التأكد من تسجيل الدخول
  return <AdminAuthCheck user={user}>{children}</AdminAuthCheck>;
};

// مكون منفصل للتحقق من صلاحيات الإدارة
const AdminAuthCheck: React.FC<{ user: any; children: React.ReactNode }> = ({ user, children }) => {
  const { data: adminAuth, isLoading: adminLoading, error } = useAdminAuth();

  // التحقق من صلاحيات الإدارة
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري التحقق من صلاحيات الإدارة...</p>
        </div>
      </div>
    );
  }

  // خطأ في التحقق من الصلاحيات
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطأ في التحقق من الصلاحيات</h2>
            <p className="text-gray-600">حدث خطأ أثناء التحقق من صلاحيات الإدارة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // المستخدم ليس مديراً
  if (!adminAuth?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">غير مخول</h2>
            <p className="text-gray-600">لا تملك صلاحيات الوصول إلى لوحة الإدارة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
