
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, TrendingUp, Star, Activity, DollarSign } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

export const DashboardStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_admin_dashboard_stats");
      return data;
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats?.total_users || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "إجمالي الإعلانات",
      value: stats?.total_ads || 0,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "الإعلانات النشطة",
      value: stats?.active_ads || 0,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "المستخدمين المميزين",
      value: stats?.premium_users || 0,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "الترقيات النشطة",
      value: stats?.total_boosts || 0,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "إجمالي الإيرادات",
      value: stats?.total_revenue || 0,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "مستخدمين جدد اليوم",
      value: stats?.new_users_today || 0,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "إعلانات اليوم",
      value: stats?.ads_today || 0,
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer
              config={{
                users: {
                  label: "المستخدمين",
                  color: "hsl(var(--chart-1))",
                },
                ads: {
                  label: "الإعلانات",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "اليوم",
                      users: stats?.new_users_today || 0,
                      ads: stats?.ads_today || 0,
                    },
                    {
                      name: "الإجمالي",
                      users: stats?.total_users || 0,
                      ads: stats?.total_ads || 0,
                    },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="var(--color-users)" />
                  <Bar dataKey="ads" fill="var(--color-ads)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
