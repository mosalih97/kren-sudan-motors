
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User } from 'lucide-react';

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

interface UserSearchBoxProps {
  onUserFound: (user: UserProfile) => void;
  onSearchUsers: (searchTerm: string, membershipFilter: string) => Promise<UserProfile[]>;
  loading: boolean;
}

const UserSearchBox = ({ onUserFound, onSearchUsers, loading }: UserSearchBoxProps) => {
  const [userId, setUserId] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleUserIdSearch = async () => {
    if (!userId.trim() || userId.trim().length !== 8) {
      return;
    }

    setSearching(true);
    setNotFound(false);

    try {
      const results = await onSearchUsers(userId.trim(), 'all');
      if (results.length > 0) {
        const foundUser = results.find(user => user.user_id_display === userId.trim());
        if (foundUser) {
          onUserFound(foundUser);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setUserId(value);
    setNotFound(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userId.length === 8) {
      handleUserIdSearch();
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          البحث السريع بـ ID المستخدم
        </CardTitle>
        <CardDescription>
          ابحث عن مستخدم محدد باستخدام ID المستخدم المكون من 8 أرقام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              placeholder="أدخل ID المستخدم (8 أرقام)"
              value={userId}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono"
              maxLength={8}
              dir="ltr"
            />
            {userId.length > 0 && userId.length < 8 && (
              <p className="text-sm text-gray-500 mt-1">
                {8 - userId.length} رقم متبقي
              </p>
            )}
            {notFound && (
              <p className="text-sm text-red-500 mt-1">
                لم يتم العثور على مستخدم بهذا الـ ID
              </p>
            )}
          </div>
          <Button 
            onClick={handleUserIdSearch}
            disabled={userId.length !== 8 || searching || loading}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {searching ? 'جاري البحث...' : 'بحث'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSearchBox;
