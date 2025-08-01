
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
  new_users_this_month: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_stats');
        
        if (!error && data) {
          setStats(data);
        } else {
          console.error('Error fetching stats:', error);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-red-600">فشل في تحميل الإحصائيات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">إجمالي المستخدمين</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_users}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">إجمالي الإعلانات</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.total_ads}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">الإعلانات النشطة</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.active_ads}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">المستخدمين المميزين</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.premium_users}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">التعزيزات النشطة</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.total_boosts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">مستخدمين جدد هذا الشهر</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.new_users_this_month}</p>
        </div>
      </div>
    </div>
  );
}
