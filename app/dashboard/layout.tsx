import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/custom/dashboard/AppSideBar'
import AppHeader from '@/components/custom/dashboard/AppHeader'

function DashboardLayout({ children, }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
       <AppSidebar /> 
       <div className="flex flex-1 flex-col">
            <AppHeader />
            {children} </div>
    </SidebarProvider>
  )
}

export default DashboardLayout