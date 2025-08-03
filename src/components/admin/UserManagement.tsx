
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
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
    downgradeUserToFree,
    refetch
  } = useAdminUsers();

  const handleUpgrade = async (userId: string) => {
    if (!user?.id) return;
    await upgradeUserToPremium(userId, user.id);
  };

  const handleDowngrade = async (userId: string) => {
    if (!user?.id) return;
    await downgradeUserToFree(userId, user.id);
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <UsersStats />

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="البحث بالاسم، الهاتف، المدينة، أو معرف المستخدم..."
                value={searchTerm}
                onChange={(e) => searchUsers(e.target.value)}
                className="pr-12 text-right"
              />
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إدارة المستخدمين ({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            onUpgrade={handleUpgrade}
            onDowngrade={handleDowngrade}
          />
        </CardContent>
      </Card>
    </div>
  );
};
