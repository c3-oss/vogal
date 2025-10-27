import { Activity, FileText, FolderOpen, Search, Users } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils.js'

const navigation = [
  { name: 'Health', href: '/', icon: Activity },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Workspaces', href: '/workspaces', icon: FolderOpen },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Vogal System</h1>
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <main className="container mx-auto py-6">
        <Outlet />
      </main>
    </div>
  )
}
