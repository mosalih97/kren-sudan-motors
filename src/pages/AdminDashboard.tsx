import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import UserUpgradeDialog from '@/components/admin/UserUpgradeDialog';
import UserSearchBox from '@/components/admin/UserSearchBox';
import { Search, Users, Crown, BarChart3, RefreshCw } from 'lucide-react';

interface UserProfile {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
  user_id_display: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  
  const { 
    loading: hookLoading, 
    stats, 
    searchUsers, 
    upgradeUser, 
    getDashboardStats 
  } = useAdminDashboard();

  const { toast } = useToast();

  useEffect(() => {
    // تحميل جميع المستخدمين في البداية
    handleSearch();
    getDashboardStats();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchUsers(searchTerm, membershipFilter, 50);
      setUsers(results);
      console.log('Search results:', results); // للتصحيح
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId: string, targetMembership: string, notes: string): Promise<boolean> => {
    console.log('Upgrade request:', { userId, targetMembership, notes });
    const success = await upgradeUser(userId, targetMembership, notes);
    if (success) {
      // Refresh the users list
      await handleSearch();
      await getDashboardStats();
    }
    return success;
  };

  const handleUserFound = (user: UserProfile) => {
    setFoundUser(user);
    // إخفاء نتائج البحث العادية وإظهار المستخدم المطلوب فقط
    setUsers([user]);
  };

  const clearUserSearch = () => {
    setFoundUser(null);
    handleSearch(); // إعادة تحميل جميع المستخدمين
  };

  const openUpgradeDialog = (user: UserProfile) => {
    console.log('Opening upgrade dialog for user:', user); // للتصحيح
    setSelectedUser(user);
    setIsUpgradeDialogOpen(true);
  };

  const closeUpgradeDialog = () => {
    console.log('Closing upgrade dialog'); // للتصحيح
    setIsUpgradeDialogOpen(false);
    setSelectedUser(null);
  };

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium': return 'bg-yellow-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMembershipText = (membership: string) => {
    switch (membership) {
      case 'premium': return 'مميز';
      case 'admin': return 'إداري';
      default: return 'مجاني';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{stats.total_users}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">العضويات المميزة</p>
                    <p className="text-2xl font-bold">{stats.premium_users}</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">الإعلانات النشطة</p>
                    <p className="text-2xl font-bold">{stats.active_ads}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي النقاط</p>
                    <p className="text-2xl font-bold">{stats.total_points}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    P
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User ID Search Box */}
        <UserSearchBox
          onUserFound={handleUserFound}
          onSearchUsers={searchUsers}
          loading={loading}
        />

        {foundUser && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>نتيجة البحث بـ ID: {foundUser.user_id_display}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearUserSearch}
                >
                  مسح البحث
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              البحث العام في المستخدمين
            </CardTitle>
            <CardDescription>
              ابحث عن المستخدمين بالاسم، الهاتف، المدينة أو قم بإدارة عضوياتهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="ابحث بالاسم، الهاتف، المدينة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="نوع العضوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العضويات</SelectItem>
                  <SelectItem value="free">مجاني</SelectItem>
                  <SelectItem value="premium">مميز</SelectItem>
                  <SelectItem value="admin">إداري</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                بحث
              </Button>
              <Button onClick={() => { handleSearch(); getDashboardStats(); }} variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {foundUser 
                ? `المستخدم المطلوب` 
                : `نتائج البحث (${users.length} مستخدم)`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد نتائج للبحث المحدد
                </div>
              ) : (
                users.map((user) => (
                  <Card key={user.user_id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="md:col-span-2">
                          <h3 className="font-semibold text-lg">{user.display_name || 'غير محدد'}</h3>
                          <p className="text-sm text-gray-600">{user.phone || 'لا يوجد هاتف'}</p>
                          <p className="text-sm text-gray-600">{user.city || 'غير محدد'}</p>
                          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                            ID: {user.user_id_display}
                          </p>
                          <p className="text-xs text-gray-500">
                            انضم في: {new Date(user.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <Badge className={getMembershipBadgeColor(user.membership_type)}>
                            {getMembershipText(user.membership_type)}
                          </Badge>
                          {user.is_premium && (
                            <div className="text-xs mt-1">
                              {user.days_remaining > 0 ? 
                                `${user.days_remaining} يوم متبقي` : 
                                <span className="text-red-500">منتهية الصلاحية</span>}
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="text-sm space-y-1">
                            <div>النقاط: <span className="font-semibold">{user.points}</span></div>
                            <div>الأرصدة: <span className="font-semibold">{user.credits}</span></div>
                            <div>الإعلانات: <span className="font-semibold">{user.ads_count}</span></div>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openUpgradeDialog(user)}
                            className="flex items-center gap-2"
                            disabled={upgrading}
                          >
                            <Crown className="h-4 w-4" />
                            {upgrading ? 'جاري المعالجة...' : 'إدارة الترقية'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Dialog */}
        <UserUpgradeDialog
          user={selectedUser}
          isOpen={isUpgradeDialogOpen}
          onClose={closeUpgradeDialog}
          onUpgrade={handleUpgrade}
          loading={hookLoading}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
