import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, BarChart3, Menu, X, Sparkles, Sun, Moon, FileText, TrendingUp, Trophy, ChevronDown, PieChart, Upload, User as UserIcon, Shield, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FloatingAIButton from './FloatingAIButton';

// Main navigation items
const mainNavigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Companies', path: '/companies', icon: Building2 },
  { name: 'Students', path: '/students', icon: Users },
];

// Dropdown navigation groups
const dropdownGroups = [
  {
    name: 'Insights',
    icon: PieChart,
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Trends', path: '/trends', icon: TrendingUp },
    ]
  },
  {
    name: 'More',
    icon: FileText,
    items: [
      { name: 'Upload Data', path: '/upload', icon: Upload },
      { name: 'Reports', path: '/reports', icon: FileText },
      { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    ]
  }
];

// All navigation for mobile
const allNavigation = [
  ...mainNavigation,
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Trends', path: '/trends', icon: TrendingUp },
  { name: 'Upload Data', path: '/upload', icon: Upload },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
];

interface DropdownProps {
  group: typeof dropdownGroups[0];
  location: ReturnType<typeof useLocation>;
}

// User Profile Dropdown Component
function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'text-purple-400',
      faculty: 'text-blue-400',
      student: 'text-green-400',
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
          <p className={`text-xs ${getRoleBadge(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden animate-fade-in z-50">
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-2.5 text-sm transition-all duration-200 ${location.pathname === '/profile'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <UserIcon className="h-4 w-4 mr-3" />
              Profile
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-2.5 text-sm transition-all duration-200 ${location.pathname === '/admin'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Shield className="h-4 w-4 mr-3" />
                Admin Panel
              </Link>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavDropdown({ group, location }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const GroupIcon = group.icon;

  // Check if any item in this group is active
  const hasActiveItem = group.items.some(item => location.pathname === item.path);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative ${hasActiveItem
          ? 'text-always-white shadow-lg shadow-blue-500/25'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        {hasActiveItem && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl animate-fade-in"></div>
        )}
        <GroupIcon className={`h-4 w-4 mr-2 relative z-10 ${hasActiveItem ? 'text-always-white' : 'group-hover:text-blue-500 dark:group-hover:text-blue-400'} transition-colors`} />
        <span className="relative z-10">{group.name}</span>
        <ChevronDown className={`h-4 w-4 ml-1 relative z-10 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 glass-strong rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden animate-fade-in z-50">
          <div className="py-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-2.5 text-sm transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : ''}`} />
                  {item.name}
                  {isActive && <Sparkles className="h-3 w-3 ml-auto text-yellow-300 animate-pulse-slow" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Enhanced Navigation */}
      <nav className="glass-strong border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg dark:shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-always-white">
                    <LayoutDashboard className="h-6 w-6 text-always-white stroke-current" strokeWidth={2} />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Placement Portal
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Academic Year 2024-25</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-10 md:flex md:items-center md:space-x-1">
                {/* Main nav items */}
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                        ? 'text-always-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/20 animate-fade-in"></div>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 bg-white/10 rounded-xl"></div>
                        </>
                      )}
                      <Icon className={`h-4 w-4 mr-2 relative z-10 ${isActive ? 'text-always-white' : 'group-hover:text-blue-500 dark:group-hover:text-blue-400'} transition-colors`} />
                      <span className="relative z-10">{item.name}</span>
                      {isActive && (
                        <Sparkles className="h-3 w-3 ml-2 relative z-10 text-white animate-pulse-slow" />
                      )}
                    </Link>
                  );
                })}

                {/* Dropdown groups */}
                {dropdownGroups.map((group) => (
                  <NavDropdown key={group.name} group={group} location={location} />
                ))}
              </div>
            </div>

            {/* Theme Toggle & Mobile Menu Button */}
            <div className="flex items-center gap-3">
              {/* User Profile Dropdown */}
              <UserProfileDropdown />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 group"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-500 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {allNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all ${isActive
                      ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-500 dark:text-blue-400' : ''}`} />
                    {item.name}
                    {isActive && <Sparkles className="h-4 w-4 ml-auto text-yellow-500 dark:text-yellow-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating AI Button */}
      <FloatingAIButton />
    </div>
  );
}
