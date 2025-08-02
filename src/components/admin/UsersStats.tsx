
import { Card, CardContent } from '@/components/ui/card';
import { Users, Crown, Calendar, CreditCard } from 'lucide-react';

interface StatsProps {
  totalUsers: number;
  premiumUsers: number;
  totalAds: number;
  activeAds: number;
  totalBoosts: number;
  newUsersThisMonth: number;
}

export const UsersStats = ({ 
  totalUsers, 
  premiumUsers, 
  totalAds, 
  activeAds, 
  totalBoosts, 
  newUsersThisMonth 
}: StatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-2xl font-bold">{premiumUsers}</p>
          <p className="text-sm text-gray-600">مستخدمين مميزين</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{totalAds}</p>
          <p className="text-sm text-gray-600">إجمالي الإعلانات</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold">{activeAds}</p>
          <p className="text-sm text-gray-600">إعلانات نشطة</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="h-8 w-8 mx-auto mb-2 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
            ↗️
          </div>
          <p className="text-2xl font-bold">{totalBoosts}</p>
          <p className="text-sm text-gray-600">تعزيزات نشطة</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="h-8 w-8 mx-auto mb-2 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            📊
          </div>
          <p className="text-2xl font-bold">{newUsersThisMonth}</p>
          <p className="text-sm text-gray-600">مستخدمين جدد هذا الشهر</p>
        </CardContent>
      </Card>
    </div>
  );
};
