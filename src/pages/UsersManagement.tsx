
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  upgraded_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (!error && data) {
        setUsers(data);
      } else {
        console.error('Error fetching users:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل قائمة المستخدمين",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    try {
      const currentUser = localStorage.getItem('admin_token');
      if (!currentUser) return;

      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: currentUser
      });

      if (data?.success) {
        toast({
          title: "نجح",
          description: "تمت ترقية المستخدم بنجاح",
        });
        fetchUsers(); // Refresh the list
      } else {
        toast({
          title: "خطأ",
          description: data?.message || "فشل في ترقية المستخدم",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  const downgradeUser = async (userId: string) => {
    try {
      const currentUser = localStorage.getItem('admin_token');
      if (!currentUser) return;

      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: currentUser
      });

      if (data?.success) {
        toast({
          title: "نجح",
          description: "تم إرجاع المستخدم إلى العضوية العادية",
        });
        fetchUsers(); // Refresh the list
      } else {
        toast({
          title: "خطأ",
          description: data?.message || "فشل في إرجاع المستخدم",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرجاع المستخدم",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.user_id.includes(search.trim()) ||
    (user.display_name && user.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (user.phone && user.phone.includes(search.trim()))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جاري التحميل..." : "تحديث"}
        </button>
      </div>

      <input
        type="text"
        placeholder="ابحث برقم ID، الاسم، أو رقم الهاتف"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-right">ID</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">المدينة</th>
                <th className="p-3 text-right">العضوية</th>
                <th className="p-3 text-right">النقاط</th>
                <th className="p-3 text-right">الكريديت</th>
                <th className="p-3 text-right">الإعلانات</th>
                <th className="p-3 text-right">تاريخ التسجيل</th>
                <th className="p-3 text-right">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    جاري تحميل المستخدمين...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{user.user_id}</td>
                    <td className="p-3">{user.display_name || "—"}</td>
                    <td className="p-3">{user.phone || "—"}</td>
                    <td className="p-3">{user.city || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.membership_type === 'premium' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </span>
                    </td>
                    <td className="p-3">{user.points}</td>
                    <td className="p-3">{user.credits}</td>
                    <td className="p-3">{user.ads_count}</td>
                    <td className="p-3">{new Date(user.created_at).toLocaleDateString('ar')}</td>
                    <td className="p-3">
                      {user.membership_type === "premium" ? (
                        <button
                          onClick={() => downgradeUser(user.user_id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          إرجاع للعادية
                        </button>
                      ) : (
                        <button
                          onClick={() => upgradeUser(user.user_id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          ترقية
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          عرض {filteredUsers.length} من أصل {users.length} مستخدم
        </div>
      )}
    </div>
  );
}
