import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface LeaderboardUser {
  rank: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  checkInCount: number;
  gamesWon: number;
}

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly' | 'monthly'>('global');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardType],
    queryFn: () => apiClient.get<LeaderboardUser[]>('/api/leaderboard', {
      type: leaderboardType,
      limit: 50,
    }),
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top skaters ranked by points
        </p>
      </div>

      {/* Type Toggle */}
      <div className="flex justify-center gap-2">
        {(['global', 'weekly', 'monthly'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setLeaderboardType(type)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              leaderboardType === type
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Skater</div>
            <div className="col-span-2 text-right">Points</div>
            <div className="col-span-2 text-right">Check-ins</div>
            <div className="col-span-2 text-right">Wins</div>
          </div>

          {/* Rows */}
          {leaderboard?.map((user, index) => (
            <LeaderboardRow key={user.userId} user={user} index={index} />
          ))}

          {leaderboard?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No rankings yet. Be the first to check in!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ user, index }: { user: LeaderboardUser; index: number }) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div
      className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-t border-gray-100 dark:border-gray-800 ${
        index < 3 ? 'bg-orange-50 dark:bg-orange-900/10' : ''
      }`}
    >
      <div className="col-span-1 text-lg">
        {getRankEmoji(user.rank)}
      </div>
      <div className="col-span-5 flex items-center gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            🛹
          </div>
        )}
        <div>
          <div className="font-medium">{user.displayName || user.username}</div>
          {user.displayName && (
            <div className="text-xs text-gray-500">@{user.username}</div>
          )}
        </div>
      </div>
      <div className="col-span-2 text-right font-bold text-orange-500">
        {user.totalPoints.toLocaleString()}
      </div>
      <div className="col-span-2 text-right text-gray-600 dark:text-gray-400">
        {user.checkInCount}
      </div>
      <div className="col-span-2 text-right text-gray-600 dark:text-gray-400">
        {user.gamesWon}
      </div>
    </div>
  );
}
