
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { QuickActions } from '@/components/admin/QuickActions';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

const Admin = () => {
  const { data: adminAuth, isLoading, error } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطأ في التحقق</h2>
            <p className="text-gray-600">حدث خطأ أثناء التحقق من الصلاحيات</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminAuth?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* الإحصائيات */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الإحصائيات العامة</h2>
            <AdminStats />
          </section>

          {/* الإجراءات السريعة */}
          <section>
            <QuickActions />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Admin;
