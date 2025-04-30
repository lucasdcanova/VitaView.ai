import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getNotifications, markNotificationAsRead } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: getNotifications,
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m atrás`;
    } else if (diffMinutes < 24 * 60) {
      return `${Math.floor(diffMinutes / 60)}h atrás`;
    } else if (diffMinutes < 48 * 60) {
      return 'Ontem';
    } else {
      return notifDate.toLocaleDateString('pt-BR');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 bg-primary-50 border-b border-gray-200">
          <h3 className="font-medium">Notificações</h3>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Nenhuma notificação
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-96">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                    !notification.read && "bg-blue-50"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </ScrollArea>
            
            <div className="p-2 text-center border-t border-gray-100">
              <Button variant="link" size="sm" className="text-primary-600">
                Ver todas
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
