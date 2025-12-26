import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/hooks/useAuth';
import { spotsApi, Spot } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

export default function SpotsPage() {
  const { user, getToken } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data: spotsData, isLoading } = useQuery({
    queryKey: ['spots', selectedCity],
    queryFn: () => spotsApi.getSpots(selectedCity ? { city: selectedCity } : undefined),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => spotsApi.getCities(),
  });

  const checkInMutation = useMutation({
    mutationFn: async (spotId: number) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return spotsApi.checkIn(spotId, token);
    },
    onSuccess: () => {
      addToast('Checked in! +10 points 🛹', 'success');
      queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
    onError: (error: Error) => {
      addToast(error.message || 'Check-in failed', 'error');
    },
  });

  const handleCheckIn = (spotId: number) => {
    if (!user) {
      addToast('Please sign in to check in', 'warning');
      return;
    }
    checkInMutation.mutate(spotId);
  };

  const spots = spotsData?.data || [];
  const cities = citiesData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Skate Spots</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <span className="text-zinc-400">
            {spots.length} spots found
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="h-[500px] rounded-xl overflow-hidden border border-zinc-800">
        <MapContainer
          center={[34.0522, -118.2437]} // Los Angeles
          zoom={10}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {spots.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
            >
              <Popup>
                <div className="p-2 text-zinc-900">
                  <h3 className="font-bold">{spot.name}</h3>
                  <p className="text-sm text-zinc-600">{spot.city}</p>
                  <p className="text-sm">{spot.totalCheckIns} check-ins</p>
                  <button
                    onClick={() => handleCheckIn(spot.id)}
                    disabled={checkInMutation.isPending}
                    className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm rounded disabled:opacity-50"
                  >
                    {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Spot List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onCheckIn={() => handleCheckIn(spot.id)}
            isChecking={checkInMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function SpotCard({ spot, onCheckIn, isChecking }: { spot: Spot; onCheckIn: () => void; isChecking: boolean }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{spot.name}</h3>
        <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
          {spot.spotType || 'spot'}
        </span>
      </div>
      <p className="text-sm text-zinc-400 mb-2">
        {spot.city}{spot.country ? `, ${spot.country}` : ''}
      </p>
      {spot.description && (
        <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{spot.description}</p>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400">
          🛹 {spot.totalCheckIns} check-ins
        </span>
        <button
          onClick={onCheckIn}
          disabled={isChecking}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          Check In
        </button>
      </div>
    </div>
  );
}
