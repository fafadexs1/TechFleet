'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  Gauge,
  DollarSign,
  Calendar,
  Package,
  Users,
  LogOut,
  TowerControl,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '../ui/skeleton';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/vehicles', label: 'Veículos', icon: Car },
  { href: '/technicians', label: 'Técnicos', icon: Users },
  { href: '/expenses', label: 'Despesas', icon: DollarSign },
  { href: '/schedule', label: 'Expediente', icon: Calendar },
  { href: '/status', label: 'Status do App', icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const getInitials = (email?: string) => {
    if (!email) return 'AD';
    const name = user?.user_metadata.full_name || email;
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <TowerControl className="h-6 w-6" />
            </div>
            <h1 className="font-headline text-2xl font-bold text-primary group-data-[state=collapsed]:hidden">
                TechFleet
            </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
                className="font-body"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden p-2">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
            {loading ? (
                <>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                </>
            ) : (
                <>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.user_metadata.avatar_url} alt={user?.user_metadata.full_name || 'Admin'} data-ai-hint="person portrait" />
                        <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-sm">{user?.user_metadata.full_name || 'Admin'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild onClick={handleLogout}>
                        <Link href="/">
                            <LogOut className="h-4 w-4" />
                        </Link>
                    </Button>
                </>
            )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
