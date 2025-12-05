
"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Logo from "@/components/logo"
import { useAppStore } from "@/store/app-store"
import { LayoutDashboard, FileText, LifeBuoy, History, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = {
  poc: [
    { href: "/dashboard/poc", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/poc/history", label: "History", icon: History },
    { href: "/dashboard/poc/reports", label: "Reports", icon: FileText },
  ],
  hod: [
    { href: "/dashboard/hod", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/hod/history", label: "History", icon: History },
    { href: "/dashboard/hod/reports", label: "Reports", icon: FileText },
  ],
  finance: [
    { href: "/dashboard/finance", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/finance/payments", label: "Payments", icon: FileText },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: Shield },
    { href: "/dashboard/admin/deleted-subscriptions", label: "Deleted Subscriptions", icon: FileText },
    { href: "/dashboard/admin/reports", label: "Reports", icon: FileText },
  ],
}

export default function MainSidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const pathname = usePathname()

  if (!currentUser) return null

  const currentNavItems = navItems[currentUser.role] || []

  return (
    <Sidebar className="shadow-lg">
      <SidebarHeader>
        <div className="p-6">
            <Logo size="sm" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-6">
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  icon={<item.icon />}
                  tooltip={item.label}
                  className="relative"
                >
                  {item.label}
                   {pathname === item.href && (
                    <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="px-6">
           <SidebarMenuItem>
             <SidebarMenuButton icon={<LifeBuoy/>}>Help & Support</SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
