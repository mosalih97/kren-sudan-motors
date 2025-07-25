
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Coins } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    total_users: number;
    premium_users: number;
    new_users_this_month: number;
    active_ads: number;
    deleted_ads: number;
    premium_ads: number;
    active_boosts: number;
    basic_boosts: number;
    premium_boosts: number;
    ultimate_boosts: number;
    total_points: number;
    total_credits: number;
  };
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const statsCards = [
    {
      title: "المستخدمون",
      icon: Users,
      items: [
        { label: "إجمالي المستخدمين", value: stats.total_users, color: "text-blue-600" },
        { label: "المستخدمون المميزون", value: stats.premium_users, color: "text-green-600" },
        { label: "مستخدمون جدد هذا الشهر", value: stats.new_users_this_month, color: "text-purple-600" }
      ]
    },
    {
      title: "الإعلانات",
      icon: FileText,
      items: [
        { label: "الإعلانات النشطة", value: stats.active_ads, color: "text-green-600" },
        { label: "الإعلانات المحذوفة", value: stats.deleted_ads, color: "text-red-600" },
        { label: "الإعلانات المميزة", value: stats.premium_ads, color: "text-yellow-600" }
      ]
    },
    {
      title: "التعزيزات",
      icon: TrendingUp,
      items: [
        { label: "التعزيزات النشطة", value: stats.active_boosts, color: "text-blue-600" },
        { label: "تعزيزات أساسية", value: stats.basic_boosts, color: "text-gray-600" },
        { label: "تعزيزات مميزة", value: stats.premium_boosts, color: "text-orange-600" },
        { label: "تعزيزات عالية", value: stats.ultimate_boosts, color: "text-red-600" }
      ]
    },
    {
      title: "النقاط",
      icon: Coins,
      items: [
        { label: "إجمالي النقاط", value: stats.total_points, color: "text-blue-600" },
        { label: "إجمالي الكريديت", value: stats.total_credits, color: "text-green-600" }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {card.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
