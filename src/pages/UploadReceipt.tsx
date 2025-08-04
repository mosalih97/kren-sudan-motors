
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Receipt } from "lucide-react";

const UploadReceipt = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle receipt upload logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto card-gradient border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">رفع إيصال الدفع</CardTitle>
            <p className="text-muted-foreground">ارفع إيصال دفعتك لتفعيل الخدمة</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="receipt">ملف الإيصال</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ المدفوع</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="أدخل المبلغ"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reference">رقم المرجع (اختياري)</Label>
                <Input
                  id="reference"
                  placeholder="رقم العملية أو المرجع"
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                رفع الإيصال
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
