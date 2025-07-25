
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, FileText, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Ad {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  top_spot: boolean;
  created_at: string;
  user_id: string;
  display_name: string;
}

interface AdsManagementProps {
  ads: Ad[];
  onDeleteAd: (adId: string) => Promise<boolean>;
}

const AdsManagement: React.FC<AdsManagementProps> = ({ ads, onDeleteAd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredAds = ads.filter(ad => 
    ad.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (adId: string) => {
    setLoading(adId);
    await onDeleteAd(adId);
    setLoading(null);
  };

  const getStatusBadge = (ad: Ad) => {
    const badges = [];
    
    if (ad.status === 'active') {
      badges.push(<Badge key="active" className="bg-green-500">نشط</Badge>);
    } else {
      badges.push(<Badge key="inactive" variant="destructive">غير نشط</Badge>);
    }
    
    if (ad.is_premium) {
      badges.push(<Badge key="premium" className="bg-yellow-500">مميز</Badge>);
    }
    
    if (ad.is_featured) {
      badges.push(<Badge key="featured" className="bg-blue-500">مُروج</Badge>);
    }
    
    if (ad.top_spot) {
      badges.push(<Badge key="top" className="bg-purple-500">أعلى الصفحة</Badge>);
    }
    
    return badges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          إدارة الإعلانات
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع الإعلانات في المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث بـ ID الإعلان أو العنوان أو الماركة..."
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
                <TableHead>العنوان</TableHead>
                <TableHead>الماركة/الموديل</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ النشر</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-mono text-xs">
                    {ad.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate" title={ad.title}>
                      {ad.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{ad.brand}</div>
                      <div className="text-gray-500">{ad.model}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatPrice(ad.price)} ريال
                  </TableCell>
                  <TableCell>{ad.display_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getStatusBadge(ad)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(ad.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/ad/${ad.id}`, '_blank')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        عرض
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading === ad.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ad.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف نهائي
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد نتائج للبحث
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdsManagement;
