import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, ToastProvider } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import HomePage from '@/pages/Home';
import SpotsPage from '@/pages/Spots';
import ShopPage from '@/pages/Shop';
import LeaderboardPage from '@/pages/Leaderboard';
import GamePage from '@/pages/Game';
import ClosetPage from '@/pages/Closet';
import AuthPage from '@/pages/Auth';
import NotFoundPage from '@/pages/NotFound';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <Navbar />
            <main>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/spots" component={SpotsPage} />
                <Route path="/shop" component={ShopPage} />
                <Route path="/leaderboard" component={LeaderboardPage} />
                <Route path="/games" component={GamePage} />
                <Route path="/games/:code" component={GamePage} />
                <Route path="/closet" component={ClosetPage} />
                <Route path="/auth" component={AuthPage} />
                <Route component={NotFoundPage} />
              </Switch>
            </main>
            <Toaster />
          </div>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
