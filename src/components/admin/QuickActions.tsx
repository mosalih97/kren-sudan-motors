
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Car, Settings, BarChart3 } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة حسابات المستخدمين',
      icon: Users,
      action: () => console.log('Navigate to users'),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'إدارة الإعلانات',
      description: 'مراجعة وإدارة الإعلانات المنشورة',
      icon: Car,
      action: () => console.log('Navigate to ads'),
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'التقارير والإحصائيات',
      description: 'عرض تقارير مفصلة عن أداء الموقع',
      icon: BarChart3,
      action: () => console.log('Navigate to reports'),
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'إعدادات النظام',
      description: 'تكوين إعدادات الموقع العامة',
      icon: Settings,
      action: () => console.log('Navigate to settings'),
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإجراءات السريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
