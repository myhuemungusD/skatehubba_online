import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Link } from 'wouter';

interface InventoryItem {
  id: number;
  itemName: string;
  itemDescription?: string;
  itemImageUrl?: string;
  itemType: string;
  rarity?: string;
  equipped: boolean;
  equippedSlot?: string;
  earnedFrom?: string;
  acquiredAt: string;
}

export default function ClosetPage() {
  const { user } = useAuth();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiClient.get<InventoryItem[]>('/api/inventory'),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">My Closet</h1>
        <p className="text-gray-500 mb-6">Sign in to view your collection</p>
        <Link href="/auth">
          <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
            Sign In
          </button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const equippedItems = inventory?.filter((item) => item.equipped) || [];
  const unequippedItems = inventory?.filter((item) => !item.equipped) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">My Closet</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {inventory?.length || 0} items collected
        </p>
      </div>

      {/* Equipped Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Equipped</h2>
        {equippedItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {equippedItems.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            No items equipped. Equip items from your collection!
          </div>
        )}
      </div>

      {/* Collection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Collection</h2>
        {unequippedItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {unequippedItems.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Your closet is empty!</p>
            <p className="text-sm">
              Earn items by checking in at spots, winning S.K.A.T.E. games, or shopping.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Link href="/spots">
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                  Find Spots
                </button>
              </Link>
              <Link href="/shop">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg">
                  Browse Shop
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'epic': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'rare': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'uncommon': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${getRarityColor(item.rarity)}`}>
      <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        {item.itemImageUrl ? (
          <img src={item.itemImageUrl} alt={item.itemName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🛹</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">{item.itemName}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 capitalize">{item.itemType}</span>
          {item.rarity && (
            <span className="text-xs font-medium capitalize">{item.rarity}</span>
          )}
        </div>
        {item.equipped && (
          <div className="mt-2 text-xs text-orange-500 font-medium">
            ✓ Equipped ({item.equippedSlot})
          </div>
        )}
      </div>
    </div>
  );
}
