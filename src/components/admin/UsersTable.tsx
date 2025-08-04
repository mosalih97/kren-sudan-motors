
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Phone, MapPin, Calendar } from 'lucide-react';

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

interface UsersTableProps {
  users: User[];
  onUpgrade: (userId: string) => void;
  onDowngrade: (userId: string) => void;
}

export const UsersTable = ({ users, onUpgrade, onDowngrade }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">لا توجد نتائج للبحث</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-right p-4 border-b font-semibold">المستخدم</th>
            <th className="text-right p-4 border-b font-semibold">التواصل</th>
            <th className="text-right p-4 border-b font-semibold">العضوية</th>
            <th className="text-right p-4 border-b font-semibold">النقاط</th>
            <th className="text-right p-4 border-b font-semibold">الإحصائيات</th>
            <th className="text-center p-4 border-b font-semibold">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
              <td className="p-4 border-b">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{user.display_name || 'غير محدد'}</h3>
                    <Badge variant="secondary" className="text-xs">
                      #{user.user_id.slice(0, 8)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>انضم: {new Date(user.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </td>

              <td className="p-4 border-b">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>{user.phone || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{user.city || 'غير محدد'}</span>
                  </div>
                </div>
              </td>

              <td className="p-4 border-b">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {user.membership_type === 'premium' && (
                      <Badge className="bg-yellow-100 text-yellow-800">مميز</Badge>
                    )}
                    {user.membership_type === 'admin' && (
                      <Badge className="bg-red-100 text-red-800">مدير</Badge>
                    )}
                    {user.membership_type === 'free' && (
                      <Badge variant="outline">عادي</Badge>
                    )}
                  </div>
                  {user.premium_expires_at && (
                    <div className={`text-sm ${user.days_remaining < 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      ⏰ باقي: {user.days_remaining} يوم
                    </div>
                  )}
                  {user.upgraded_at && (
                    <div className="text-sm text-gray-600">
                      ⬆️ ترقية: {new Date(user.upgraded_at).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </div>
              </td>

              <td className="p-4 border-b">
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">
                    🔢 نقاط: <span className="font-medium">{user.points}</span>
                  </div>
                  <div className="text-gray-600">
                    💳 كريديت: <span className="font-medium">{user.credits}</span>
                  </div>
                </div>
              </td>

              <td className="p-4 border-b">
                <div className="text-sm text-gray-600">
                  📝 إعلانات: <span className="font-medium">{user.ads_count}</span>
                </div>
              </td>

              <td className="p-4 border-b text-center">
                <div className="flex justify-center gap-2">
                  {user.membership_type !== 'premium' && user.membership_type !== 'admin' && (
                    <Button
                      onClick={() => onUpgrade(user.user_id)}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 ml-1" />
                      ترقية (30 يوم)
                    </Button>
                  )}
                  
                  {user.membership_type === 'premium' && (
                    <Button
                      onClick={() => onDowngrade(user.user_id)}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 ml-1" />
                      إرجاع للعادية
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
