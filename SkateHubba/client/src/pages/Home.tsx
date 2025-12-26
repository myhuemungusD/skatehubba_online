import { Link } from 'wouter';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          SkateHubba
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
          Find spots. Play S.K.A.T.E. Level up your skating.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12">
        <FeatureCard
          title="🗺️ Discover Spots"
          description="Find the best skate spots near you. Check in and earn points."
          link="/spots"
        />
        <FeatureCard
          title="🎮 Play S.K.A.T.E."
          description="Challenge friends to virtual games. Set tricks, match or get a letter."
          link="/game"
        />
        <FeatureCard
          title="🏆 Leaderboards"
          description="Climb the ranks. See who's killing it in your area."
          link="/leaderboard"
        />
      </div>

      {/* CTA */}
      <div className="flex gap-4">
        <Link href="/auth">
          <button className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
            Get Started
          </button>
        </Link>
        <Link href="/spots">
          <button className="px-8 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            Explore Spots
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-3 gap-8 text-center">
        <StatBlock number="500+" label="Spots" />
        <StatBlock number="2.5k" label="Skaters" />
        <StatBlock number="10k+" label="Check-ins" />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, link }: { title: string; description: string; link: string }) {
  return (
    <Link href={link}>
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-500 transition-colors cursor-pointer">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

function StatBlock({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-orange-500">{number}</div>
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
