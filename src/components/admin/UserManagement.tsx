
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Search, Calendar, Phone, MapPin } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/contexts/AuthContext';

export const UserManagement = () => {
  const { user } = useAuth();
  const {
    users,
    loading,
    searchTerm,
    searchUsers,
    upgradeUserToPremium,
    downgradeUserToFree
  } = useAdminUsers();

  const handleUpgrade = async (userId: string) => {
    if (!user?.id) return;
    await upgradeUserToPremium(userId, user.id);
  };

  const handleDowngrade = async (userId: string) => {
    if (!user?.id) return;
    await downgradeUserToFree(userId, user.id);
  };

  return (
    <div className="space-y-6">
      {/* شريط البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="البحث بالاسم، الهاتف، المدينة، أو معرف المستخدم..."
              value={searchTerm}
              onChange={(e) => searchUsers(e.target.value)}
              className="pr-12 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد نتائج للبحث</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.user_id} className="border rounded-lg p-4 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{user.display_name}</h3>
                        <Badge className="text-xs px-2 py-1">
                          #{user.user_id.slice(0, 8)}
                        </Badge>
                        {user.membership_type === 'premium' && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            مميز
                          </Badge>
                        )}
                        {user.membership_type === 'admin' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            مدير
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>{user.phone || 'غير محدد'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span>{user.city || 'غير محدد'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>انضم: {new Date(user.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>

                        <div className="text-gray-600">
                          🔢 نقاط: <span className="font-medium">{user.points}</span>
                        </div>

                        <div className="text-gray-600">
                          💳 كريديت: <span className="font-medium">{user.credits}</span>
                        </div>

                        <div className="text-gray-600">
                          📝 إعلانات: <span className="font-medium">{user.ads_count}</span>
                        </div>

                        {user.premium_expires_at && (
                          <div className={`${user.days_remaining < 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            ⏰ باقي: {user.days_remaining} يوم
                          </div>
                        )}

                        {user.upgraded_at && (
                          <div className="text-gray-600">
                            ⬆️ ترقية: {new Date(user.upgraded_at).toLocaleDateString('ar-SA')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user.membership_type !== 'premium' && user.membership_type !== 'admin' && (
                        <Button
                          onClick={() => handleUpgrade(user.user_id)}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <UserPlus className="h-4 w-4 ml-1" />
                          ترقية (30 يوم)
                        </Button>
                      )}
                      
                      {user.membership_type === 'premium' && (
                        <Button
                          onClick={() => handleDowngrade(user.user_id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4 ml-1" />
                          إرجاع للعادية
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
