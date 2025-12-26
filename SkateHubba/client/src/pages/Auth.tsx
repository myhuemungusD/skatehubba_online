import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

export default function AuthPage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="mb-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              className="w-24 h-24 rounded-full mx-auto"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center mx-auto text-3xl text-white">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {user.displayName || 'Skater'}
        </h2>
        <p className="text-gray-500 mb-6">{user.email}</p>
        
        <div className="space-y-4">
          <button
            onClick={() => setLocation('/spots')}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            Find Spots
          </button>
          <button
            onClick={() => signOut()}
            className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-3xl font-bold mb-2">Welcome to SkateHubba</h1>
      <p className="text-gray-500 mb-8">
        Sign in to track your spots, play S.K.A.T.E., and climb the leaderboard.
      </p>

      <button
        onClick={() => signInWithGoogle()}
        className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="text-xs text-gray-400 mt-8">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
