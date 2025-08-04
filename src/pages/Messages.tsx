
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="card-gradient border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">الرسائل</CardTitle>
            <p className="text-muted-foreground">تواصل مع البائعين والمشترين</p>
          </CardHeader>
          
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              لا توجد رسائل حالياً
            </p>
            <p className="text-sm text-muted-foreground">
              ستظهر هنا رسائلك مع المستخدمين الآخرين
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
