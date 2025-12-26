import { Link, useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [location] = useLocation();
  const { user, loading, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/spots', label: 'Spots' },
    { path: '/games', label: 'S.K.A.T.E.' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/shop', label: 'Shop' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/skateboard.svg" alt="SkateHubba" className="h-8 w-8" />
            <span className="font-bold text-xl text-white">SkateHubba</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-amber-500 text-zinc-900'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-zinc-700 animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/closet"
                  className={`hidden sm:block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/closet')
                      ? 'bg-amber-500 text-zinc-900'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Closet
                </Link>
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || 'User'}
                      className="h-8 w-8 rounded-full border-2 border-amber-500"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-zinc-900 font-bold text-sm">
                      {user.displayName?.[0] || user.email?.[0] || '?'}
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-zinc-400 hover:text-white text-sm hidden sm:block"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-2 rounded-md text-sm transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-zinc-800">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? 'bg-amber-500 text-zinc-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/closet"
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isActive('/closet')
                  ? 'bg-amber-500 text-zinc-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Closet
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
