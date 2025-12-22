import React, { useState } from 'react';
import { Bell, Check, X, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: number;
    title: string;
    message: string;
    read: boolean;
    date: string;
    type?: 'checkup' | 'exam' | 'appointment' | 'info';
}

const getNotificationIcon = (type?: string) => {
    switch (type) {
        case 'checkup':
            return <AlertCircle className="h-4 w-4 text-orange-500" />;
        case 'exam':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'appointment':
            return <Calendar className="h-4 w-4 text-green-500" />;
        default:
            return <Bell className="h-4 w-4 text-gray-500" />;
    }
};

export function NotificationBell() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // Fetch notifications
    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ['/api/notifications'],
        queryFn: async () => {
            try {
                const res = await fetch('/api/notifications', { credentials: 'include' });
                if (!res.ok) return [];
                return res.json();
            } catch {
                return [];
            }
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                credentials: 'include',
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notifications/read-all', {
                method: 'POST',
                credentials: 'include',
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        },
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full hover:bg-[#F4F4F4]"
                >
                    <Bell className="h-5 w-5 text-[#212121]" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 max-h-[400px] overflow-y-auto"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-heading font-bold text-[#212121]">Notificações</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#9E9E9E] hover:text-[#212121]"
                            onClick={() => markAllAsReadMutation.mutate()}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                {isLoading ? (
                    <div className="p-4 text-center text-[#9E9E9E]">
                        <div className="w-6 h-6 border-2 border-[#E0E0E0] border-t-[#212121] rounded-full animate-spin mx-auto" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-[#E0E0E0] mx-auto mb-3" />
                        <p className="text-sm text-[#9E9E9E]">
                            Nenhuma notificação
                        </p>
                    </div>
                ) : (
                    <>
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`px-4 py-3 cursor-pointer focus:bg-[#F4F4F4] ${!notification.read ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex gap-3 w-full">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-[#212121]' : 'text-[#424242]'
                                                }`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-[#9E9E9E] line-clamp-2 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-[#BDBDBD] mt-1">
                                            {formatDistanceToNow(new Date(notification.date), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-[#212121] hover:bg-[#F4F4F4]"
                                onClick={() => setIsOpen(false)}
                            >
                                Ver todas as notificações
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
