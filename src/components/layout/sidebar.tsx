
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
import { logout } from '@/app/actions/auth';
import { getCurrentUser } from '@/app/actions/user';
import { useEffect, useState } from 'react';
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
  const [technician, setTechnician] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const techData = await getCurrentUser();
        if (techData) {
          setTechnician(techData);
        }
      } catch (err) {
        console.error('Error fetching user data in sidebar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TF';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="pb-6 pt-6">
        <div className="flex items-center gap-3 px-2 transition-all duration-300 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <TowerControl className="h-6 w-6 text-white group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-headline text-xl font-bold tracking-tight text-sidebar-foreground">
              TechFleet
            </h1>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Admin Pro</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarMenu className="gap-2">
          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
            Menu Principal
          </div>
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: item.label }}
                  className={`
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all duration-200
                        ${isActive
                      ? 'bg-gradient-to-r from-primary/10 to-blue-50 text-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-gray-100/50 hover:text-foreground hover:shadow-sm'
                    }
                    `}
                >
                  <Link href={item.href} className="flex items-center w-full">
                    <item.icon className={`
                            h-[18px] w-[18px] transition-transform duration-200 
                            ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110 group-hover:text-foreground'}
                        `} />
                    <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {isActive && (
                      <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-glow group-data-[collapsible=icon]:hidden" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className={`
            flex items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-3 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg
            group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none
        `}>
          {loading ? (
            <>
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white shadow-sm transition-transform hover:scale-105 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                <AvatarImage src={technician?.foto_perfil} alt={technician?.display_name || 'Admin'} className="object-cover" />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white font-bold">
                  {getInitials(technician?.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-bold text-gray-900">
                  {technician?.display_name || 'Admin'}
                </p>
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {technician?.cargo || 'TechFleet Admin'}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                asChild
                onClick={handleLogout}
                className="h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:hidden"
              >
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
