import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface Game {
  id: number;
  gameCode: string;
  status: 'waiting' | 'active' | 'completed';
  participantCount: number;
  maxPlayers: number;
  createdAt: string;
}

export default function GamePage() {
  const { user } = useAuth();
  const [, params] = useRoute('/game/:code');
  const gameCode = params?.code;

  if (gameCode) {
    return <GameLobby gameCode={gameCode} />;
  }

  return <GameList />;
}

function GameList() {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');

  const { data: games, isLoading, refetch } = useQuery({
    queryKey: ['games'],
    queryFn: () => apiClient.get<Game[]>('/api/games'),
  });

  const createGame = useMutation({
    mutationFn: () => apiClient.post('/api/games', { maxPlayers: 2, isPublic: true }),
    onSuccess: (data: any) => {
      window.location.href = `/game/${data.gameCode}`;
    },
  });

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Force Uppercase
    // 2. Regex: Strip anything that isn't A-Z or 0-9
    const sanitizedValue = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    setJoinCode(sanitizedValue);
  };

  const handleJoin = () => {
    if (joinCode.trim()) {
      window.location.href = `/game/${joinCode.toUpperCase()}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">🎮 S.K.A.T.E.</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Play the classic game online with friends
        </p>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Create Game */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold mb-4">Create Game</h3>
          <button
            onClick={() => createGame.mutate()}
            disabled={!user || createGame.isPending}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {createGame.isPending ? 'Creating...' : 'Start New Game'}
          </button>
          {!user && (
            <p className="text-sm text-gray-500 mt-2">Sign in to create a game</p>
          )}
        </div>

        {/* Join Game */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold mb-4">Join Game</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={handleCodeChange}
              placeholder="GAME CODE"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-orange-500 font-mono tracking-widest"
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              className="px-6 py-3 bg-gray-800 dark:bg-gray-200 dark:text-gray-900 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Public Games */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Open Games</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : games?.length ? (
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <span className="font-mono font-bold">{game.gameCode}</span>
                  <span className="text-gray-500 ml-2">
                    {game.participantCount}/{game.maxPlayers} players
                  </span>
                </div>
                <button
                  onClick={() => window.location.href = `/game/${game.gameCode}`}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No open games. Create one!
          </div>
        )}
      </div>

      {/* How to Play */}
      <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold mb-3">How to Play</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>One player sets a trick by naming it</li>
          <li>Other players must match the trick</li>
          <li>If you can't land it, you get a letter (S-K-A-T-E)</li>
          <li>Spell S.K.A.T.E. and you're out!</li>
          <li>Last skater standing wins! 🏆</li>
        </ol>
      </div>
    </div>
  );
}

function GameLobby({ gameCode }: { gameCode: string }) {
  const { data: game, isLoading, error } = useQuery({
    queryKey: ['game', gameCode],
    queryFn: () => apiClient.get(`/api/games/${gameCode}`),
    refetchInterval: 3000, // Poll for updates
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
        <p className="text-gray-500 mb-4">Code: {gameCode}</p>
        <a href="/game" className="text-orange-500 hover:underline">
          ← Back to Games
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Game: {gameCode}</h1>
        <p className="text-gray-500">Share this code with friends to join!</p>
      </div>

      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xl mb-4">
          Status: <span className="font-bold capitalize">{(game as any)?.status}</span>
        </p>
        <p className="text-gray-500">
          Game lobby is ready. Full S.K.A.T.E. gameplay coming soon!
        </p>
      </div>
    </div>
  );
}
