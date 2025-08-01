
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
  FileText,
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
import type { Technician } from '@/types';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/vehicles', label: 'Veículos', icon: Car },
  { href: '/technicians', label: 'Técnicos', icon: Users },
  { href: '/expenses', label: 'Despesas', icon: DollarSign },
  { href: '/schedule', label: 'Expediente', icon: Calendar },
  { href: '/reports', label: 'Relatórios', icon: FileText },
  { href: '/status', label: 'Status do App', icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: techData, error } = await supabase
            .from('membros')
            .select('*')
            .eq('uuid', user.id)
            .single();
        
        if (techData) {
            setTechnician(techData as Technician);
        }
      }
      setLoading(false);
    };

    fetchUserData();
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
        <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-lg">
                <TowerControl className="h-6 w-6" />
            </div>
            <h1 className="font-headline text-2xl font-bold text-sidebar-primary group-data-[state=collapsed]:hidden">
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
                className="font-body text-base"
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/10">
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
                        <p className="font-bold text-sm text-sidebar-foreground">{user?.user_metadata.full_name || 'Admin'}</p>
                        <p className="text-xs text-sidebar-foreground/70">{technician?.cargo || user?.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild onClick={handleLogout} className="text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground">
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
