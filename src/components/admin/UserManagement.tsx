
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/contexts/AuthContext';
import { UsersTable } from './UsersTable';
import { UsersStats } from './UsersStats';

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

  // Calculate stats from users data
  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.membership_type === 'premium').length,
    totalAds: users.reduce((sum, u) => sum + u.ads_count, 0),
    activeAds: users.reduce((sum, u) => sum + u.ads_count, 0), // Assuming all ads are active for now
    totalBoosts: 0, // This would need additional data
    newUsersThisMonth: users.filter(u => {
      const userDate = new Date(u.created_at);
      const currentDate = new Date();
      return userDate.getMonth() === currentDate.getMonth() && 
             userDate.getFullYear() === currentDate.getFullYear();
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <UsersStats {...stats} />

      {/* Search Bar */}
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

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">جاري تحميل المستخدمين...</p>
            </div>
          ) : (
            <UsersTable
              users={users}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
