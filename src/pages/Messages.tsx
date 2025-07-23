import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Send, Loader2, AlertTriangle } from "lucide-react";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("seller");
  const adId = searchParams.get("ad");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [adDetails, setAdDetails] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!sellerId || !adId) {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد البائع أو الإعلان",
        variant: "destructive",
      });
      navigate('/cars');
      return;
    }

    fetchMessages();
    fetchSellerProfile();
    fetchAdDetails();
  }, [user, sellerId, adId, navigate, toast]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user?.id},sender_id.eq.${sellerId}`)
        .or(`receiver_id.eq.${user?.id},receiver_id.eq.${sellerId}`)
        .eq("ad_id", adId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sellerId)
        .single();

      if (error) throw error;
      setSellerProfile(data);
    } catch (error: any) {
      console.error("Error fetching seller profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch seller profile",
        variant: "destructive",
      });
    }
  };

  const fetchAdDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", adId)
        .single();

      if (error) throw error;
      setAdDetails(data);
    } catch (error: any) {
      console.error("Error fetching ad details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch ad details",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user?.id,
          receiver_id: sellerId,
          ad_id: adId,
          content: newMessage,
        })
        .single();

      if (error) throw error;

      setMessages((prevMessages) => [...prevMessages, data]);
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!sellerProfile || !adDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="card-gradient border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-warning mb-4" />
              <h3 className="text-xl font-bold mb-2">خطأ</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على البائع أو الإعلان
              </p>
              <Button onClick={() => navigate("/cars")}>
                العودة للسيارات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Card className="card-gradient border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={sellerProfile?.avatar_url} />
                <AvatarFallback>
                  <UserPlus className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span>{sellerProfile?.display_name || "اسم البائع"}</span>
                <Link to={`/ad/${adId}`} className="text-muted-foreground text-sm hover:underline">
                  عرض الإعلان
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] px-4">
              <div className="flex flex-col space-y-4 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"
                      }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${message.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                        }`}
                    >
                      {message.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4 flex items-center space-x-2">
              <Textarea
                placeholder="اكتب رسالتك..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                إرسال
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
