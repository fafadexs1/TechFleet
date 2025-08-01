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

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/vehicles', label: 'Veículos', icon: Car },
  { href: '/expenses', label: 'Despesas', icon: DollarSign },
  { href: '/schedule', label: 'Expediente', icon: Calendar },
  { href: '/status', label: 'Status do App', icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();

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
            <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="person portrait" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-bold text-sm">Admin</p>
                <p className="text-xs text-muted-foreground">admin@techfleet.com</p>
            </div>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <LogOut className="h-4 w-4" />
                </Link>
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
