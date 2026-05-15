import {
  Activity,
  Database,
  FileText,
  FolderOpen,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils.js'
import { ThemeToggle } from './ThemeToggle.js'
import { Badge } from './ui/badge.js'
import { Button } from './ui/button.js'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet.js'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.js'

const navigation = [
  { name: 'Health', href: '/', icon: Activity },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Workspaces', href: '/workspaces', icon: FolderOpen },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
]

const SIDEBAR_STORAGE_KEY = 'vogal:sidebar:collapsed'

function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored === 'true') setCollapsed(true)
    } catch {
      // ignore storage errors (Safari private mode, etc.)
    }
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return { collapsed, toggle }
}

interface SidebarContentProps {
  collapsed?: boolean
  onNavigate?: () => void
}

function SidebarContent({ collapsed = false, onNavigate }: SidebarContentProps) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn('flex items-center px-3', collapsed ? 'h-12 justify-center' : 'h-12')}>
        <Link
          to="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-md transition-colors hover:bg-sidebar-accent/60',
            collapsed ? 'h-9 w-9 justify-center' : 'h-9 w-full px-2',
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
            <Database className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">Vogal</span>}
        </Link>
      </div>

      <nav className={cn('flex-1 space-y-0.5 px-2 py-2')}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          const link = (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center rounded-md text-sm transition-colors',
                collapsed ? 'h-9 w-9 justify-center' : 'h-9 gap-2 px-2',
                isActive
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
              aria-label={item.name}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )

          if (!collapsed) return link

          return (
            <Tooltip key={item.name} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </div>
  )
}

export function Layout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { collapsed, toggle } = useSidebarCollapsed()
  const current = navigation.find((item) => item.href === location.pathname) ?? navigation[0]

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-150 md:block',
            collapsed ? 'w-14' : 'w-60',
          )}
        >
          <SidebarContent collapsed={collapsed} />
        </aside>

        <div className={cn('transition-[padding] duration-150', collapsed ? 'md:pl-14' : 'md:pl-60')}>
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-12 items-center justify-between gap-2 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 max-w-[85vw] border-sidebar-border bg-sidebar p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>Primary navigation for Vogal console sections.</SheetDescription>
                    </SheetHeader>
                    <SidebarContent onNavigate={() => setMobileOpen(false)} />
                  </SheetContent>
                </Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="hidden h-8 w-8 md:inline-flex"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Vogal</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="font-medium">{current.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="hidden h-6 gap-1 px-2 text-xs sm:inline-flex">
                  <Zap className="h-3 w-3 text-primary" /> Connected
                </Badge>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="w-full px-6 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
