
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserMinus, Calendar, Award } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
  user_id_display: string;
}

interface UsersManagementProps {
  users: User[];
  onUpgradeUser: (userId: string) => Promise<boolean>;
  onDowngradeUser: (userId: string) => Promise<boolean>;
}

const UsersManagement: React.FC<UsersManagementProps> = ({ 
  users, 
  onUpgradeUser, 
  onDowngradeUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.user_id_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpgrade = async (userId: string) => {
    setLoading(userId);
    await onUpgradeUser(userId);
    setLoading(null);
  };

  const handleDowngrade = async (userId: string) => {
    setLoading(userId);
    await onDowngradeUser(userId);
    setLoading(null);
  };

  const getMembershipBadge = (membershipType: string, isPremium: boolean) => {
    if (membershipType === 'premium' || isPremium) {
      return <Badge className="bg-yellow-500 text-yellow-50">مميز</Badge>;
    }
    return <Badge variant="secondary">عادي</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          إدارة المستخدمين
        </CardTitle>
        <CardDescription>
          إدارة المستخدمين وترقية العضويات
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث بـ ID المستخدم أو الاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>العضوية</TableHead>
                <TableHead>النقاط</TableHead>
                <TableHead>الكريديت</TableHead>
                <TableHead>الإعلانات</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-mono text-sm">
                    {user.user_id_display}
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.display_name || 'غير محدد'}
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.city || '-'}</TableCell>
                  <TableCell>
                    {getMembershipBadge(user.membership_type, user.is_premium)}
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-600 font-medium">
                      {user.points?.toLocaleString() || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {user.credits?.toLocaleString() || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-purple-600 font-medium">
                      {user.ads_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.premium_expires_at ? (
                      <div className="text-sm">
                        <div>{formatDate(user.premium_expires_at)}</div>
                        {user.days_remaining > 0 && (
                          <div className="text-xs text-gray-500">
                            ({user.days_remaining} يوم متبقي)
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.membership_type === 'premium' || user.is_premium ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDowngrade(user.user_id)}
                          disabled={loading === user.user_id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          تخفيض
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpgrade(user.user_id)}
                          disabled={loading === user.user_id}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          ترقية
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد نتائج للبحث
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
