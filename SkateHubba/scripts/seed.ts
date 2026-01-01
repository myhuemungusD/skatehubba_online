import { db } from "../server/db";
import { products, spots, tutorialSteps } from "../shared/schema";

/**
 * Seed script for SkateHubba database
 * Run with: npx tsx scripts/seed.ts
 */

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // ========================================================================
    // PRODUCTS (Shop Items)
    // ========================================================================
    console.log("📦 Seeding products...");

    const productData = [
      // Decks
      {
        name: "SkateHubba Pro Deck",
        description: "7-ply Canadian maple, medium concave. Official SkateHubba deck.",
        price: 5999, // $59.99
        category: "decks",
        brand: "SkateHubba",
        imageUrl: "/images/products/deck-pro.jpg",
        stock: 50,
        featured: true,
        sku: "SH-DECK-PRO-001",
      },
      {
        name: "Street Classic 8.0",
        description: "Classic popsicle shape, perfect for street skating. 8.0\" width.",
        price: 4999,
        category: "decks",
        brand: "SkateHubba",
        imageUrl: "/images/products/deck-street.jpg",
        stock: 30,
        sku: "SH-DECK-ST-8",
      },
      {
        name: "Park Bomber 8.25",
        description: "Wider deck for park and transition skating. 8.25\" width.",
        price: 5499,
        category: "decks",
        brand: "SkateHubba",
        imageUrl: "/images/products/deck-park.jpg",
        stock: 25,
        sku: "SH-DECK-PK-825",
      },

      // Wheels
      {
        name: "Street Sliders 52mm",
        description: "99A durometer, perfect for street skating. 52mm diameter.",
        price: 3499,
        category: "wheels",
        brand: "SkateHubba",
        imageUrl: "/images/products/wheels-street.jpg",
        stock: 100,
        featured: true,
        sku: "SH-WHL-52-99A",
      },
      {
        name: "Park Cruisers 54mm",
        description: "101A durometer for smooth park surfaces. 54mm diameter.",
        price: 3699,
        category: "wheels",
        brand: "SkateHubba",
        imageUrl: "/images/products/wheels-park.jpg",
        stock: 80,
        sku: "SH-WHL-54-101A",
      },
      {
        name: "Filmer Softies 56mm",
        description: "78A durometer, smooth and quiet. Great for filming and cruising.",
        price: 3999,
        category: "wheels",
        brand: "SkateHubba",
        imageUrl: "/images/products/wheels-soft.jpg",
        stock: 60,
        sku: "SH-WHL-56-78A",
      },

      // Trucks
      {
        name: "Hanger Lows 139",
        description: "Low profile trucks for flip tricks. Fits 7.75\" - 8.25\" decks.",
        price: 4499,
        category: "trucks",
        brand: "SkateHubba",
        imageUrl: "/images/products/trucks-low.jpg",
        stock: 40,
        sku: "SH-TRK-139-LO",
      },
      {
        name: "Hanger Mids 149",
        description: "Mid height trucks, versatile for all terrain. Fits 8.0\" - 8.5\" decks.",
        price: 4699,
        category: "trucks",
        brand: "SkateHubba",
        imageUrl: "/images/products/trucks-mid.jpg",
        stock: 45,
        featured: true,
        sku: "SH-TRK-149-MID",
      },

      // Bearings
      {
        name: "Speed Demons ABEC 7",
        description: "High-speed bearings with shields. Set of 8.",
        price: 2499,
        category: "bearings",
        brand: "SkateHubba",
        imageUrl: "/images/products/bearings-abec7.jpg",
        stock: 120,
        sku: "SH-BRG-ABEC7",
      },
      {
        name: "Ceramic Pro Bearings",
        description: "Premium ceramic bearings for ultimate speed. Set of 8.",
        price: 5999,
        category: "bearings",
        brand: "SkateHubba",
        imageUrl: "/images/products/bearings-ceramic.jpg",
        stock: 30,
        sku: "SH-BRG-CERAMIC",
      },

      // Apparel
      {
        name: "SkateHubba Logo Tee",
        description: "100% cotton, screen-printed logo. Available in S-XXL.",
        price: 2999,
        category: "apparel",
        subcategory: "t-shirts",
        brand: "SkateHubba",
        imageUrl: "/images/products/tee-logo.jpg",
        stock: 200,
        featured: true,
        sku: "SH-APP-TEE-LOGO",
        metadata: { sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Black", "White", "Navy"] },
      },
      {
        name: "Skate Hoodie",
        description: "Heavyweight fleece hoodie with kangaroo pocket.",
        price: 5999,
        category: "apparel",
        subcategory: "hoodies",
        brand: "SkateHubba",
        imageUrl: "/images/products/hoodie-skate.jpg",
        stock: 80,
        sku: "SH-APP-HOOD-01",
        metadata: { sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Black", "Grey", "Maroon"] },
      },

      // Accessories
      {
        name: "Hardware Pack",
        description: "8 bolts and nuts, 1\" length. Phillips or Allen head.",
        price: 599,
        category: "accessories",
        brand: "SkateHubba",
        imageUrl: "/images/products/hardware.jpg",
        stock: 500,
        sku: "SH-ACC-HW-1",
      },
      {
        name: "Grip Tape Sheet",
        description: "9\" x 33\" premium grip tape. SkateHubba branded.",
        price: 999,
        category: "accessories",
        brand: "SkateHubba",
        imageUrl: "/images/products/griptape.jpg",
        stock: 300,
        sku: "SH-ACC-GRIP-01",
      },
      {
        name: "Skate Tool",
        description: "All-in-one tool with 3 socket sizes, Phillips, and Allen.",
        price: 1499,
        category: "accessories",
        brand: "SkateHubba",
        imageUrl: "/images/products/tool.jpg",
        stock: 150,
        sku: "SH-ACC-TOOL-01",
      },

      // Digital Collectibles
      {
        name: "OG Founder Badge",
        description: "Exclusive digital badge for early supporters. Shows on your profile.",
        price: 999,
        category: "accessories",
        subcategory: "digital",
        brand: "SkateHubba",
        imageUrl: "/images/products/badge-og.png",
        stock: 100,
        isDigital: true,
        sku: "SH-DIG-BADGE-OG",
        metadata: { rarity: "legendary" },
      },
      {
        name: "Pro Skater Avatar",
        description: "Custom animated avatar for your profile.",
        price: 499,
        category: "accessories",
        subcategory: "digital",
        brand: "SkateHubba",
        imageUrl: "/images/products/avatar-pro.png",
        stock: 500,
        isDigital: true,
        sku: "SH-DIG-AVT-PRO",
        metadata: { rarity: "rare" },
      },
    ];

    await db.insert(products).values(productData as any).onConflictDoNothing();
    console.log(`   ✅ Inserted ${productData.length} products`);

    // ========================================================================
    // SPOTS (Skate Parks & Street Spots)
    // ========================================================================
    console.log("📍 Seeding spots...");

    const spotData = [
      {
        name: "Venice Beach Skatepark",
        description: "Iconic beachside skatepark with snake run, bowls, and street section.",
        latitude: 33.9850,
        longitude: -118.4695,
        address: "1800 Ocean Front Walk",
        city: "Venice",
        state: "CA",
        country: "USA",
        spotType: "park",
        difficulty: "intermediate",
        features: ["bowl", "snake run", "rails", "ledges"],
        verified: true,
        totalCheckIns: 1250,
        rating: 4.7,
      },
      {
        name: "Brooklyn Banks",
        description: "Legendary street spot under the Brooklyn Bridge. Historic location.",
        latitude: 40.7074,
        longitude: -74.0021,
        address: "Brooklyn Bridge",
        city: "New York",
        state: "NY",
        country: "USA",
        spotType: "street",
        difficulty: "intermediate",
        features: ["banks", "ledges", "manual pads"],
        verified: true,
        totalCheckIns: 890,
        rating: 4.5,
      },
      {
        name: "Lincoln City Skatepark",
        description: "Modern concrete park with flow bowl and street plaza.",
        latitude: 44.9582,
        longitude: -124.0177,
        address: "3501 NE 22nd St",
        city: "Lincoln City",
        state: "OR",
        country: "USA",
        spotType: "park",
        difficulty: "beginner",
        features: ["bowl", "pyramid", "rails", "flatground"],
        verified: true,
        totalCheckIns: 320,
        rating: 4.8,
      },
      {
        name: "Love Park (LOVE Plaza)",
        description: "Historic Philadelphia plaza, birthplace of east coast street skating.",
        latitude: 39.9541,
        longitude: -75.1658,
        address: "1599 JFK Boulevard",
        city: "Philadelphia",
        state: "PA",
        country: "USA",
        spotType: "plaza",
        difficulty: "advanced",
        features: ["ledges", "gaps", "stairs", "manual pads"],
        verified: true,
        totalCheckIns: 2100,
        rating: 4.9,
      },
      {
        name: "Burnside Skatepark",
        description: "DIY under-bridge park, featured in Tony Hawk games.",
        latitude: 45.5231,
        longitude: -122.6650,
        address: "SE 2nd Ave & Burnside",
        city: "Portland",
        state: "OR",
        country: "USA",
        spotType: "diy",
        difficulty: "advanced",
        features: ["bowl", "halfpipe", "transitions"],
        verified: true,
        totalCheckIns: 780,
        rating: 4.6,
      },
      {
        name: "Stoner Plaza",
        description: "Large modern plaza with varied obstacles for all levels.",
        latitude: 34.0420,
        longitude: -118.4654,
        address: "1835 Stoner Ave",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        spotType: "park",
        difficulty: "intermediate",
        features: ["rails", "ledges", "stairs", "gaps", "flatground"],
        verified: true,
        totalCheckIns: 950,
        rating: 4.4,
      },
      {
        name: "FDR Skatepark",
        description: "Legendary DIY park under I-95. Massive concrete playground.",
        latitude: 39.9296,
        longitude: -75.1769,
        address: "2500 Pattison Ave",
        city: "Philadelphia",
        state: "PA",
        country: "USA",
        spotType: "diy",
        difficulty: "pro",
        features: ["bowl", "pool", "snake run", "vert"],
        verified: true,
        totalCheckIns: 1680,
        rating: 4.8,
      },
      {
        name: "SoMa West Skatepark",
        description: "San Francisco's newest park with world-class street section.",
        latitude: 37.7711,
        longitude: -122.4097,
        address: "Duboce Ave & Valencia",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        spotType: "park",
        difficulty: "intermediate",
        features: ["rails", "ledges", "manual pads", "hubba"],
        verified: true,
        totalCheckIns: 420,
        rating: 4.5,
      },
      {
        name: "Vans Off The Wall Skatepark",
        description: "Indoor park at House of Vans Chicago. Pro-level facilities.",
        latitude: 41.8848,
        longitude: -87.6544,
        address: "113 N Elizabeth St",
        city: "Chicago",
        state: "IL",
        country: "USA",
        spotType: "indoor",
        difficulty: "advanced",
        features: ["bowl", "street course", "mini ramp", "vert"],
        verified: true,
        totalCheckIns: 560,
        rating: 4.7,
      },
      {
        name: "Kona Skatepark",
        description: "Oldest privately-owned skatepark in the US. Snake runs and pools.",
        latitude: 30.2962,
        longitude: -81.4014,
        address: "8739 Kona Ave",
        city: "Jacksonville",
        state: "FL",
        country: "USA",
        spotType: "park",
        difficulty: "advanced",
        features: ["pool", "snake run", "bowl", "halfpipe"],
        verified: true,
        totalCheckIns: 890,
        rating: 4.6,
      },
    ];

    await db.insert(spots).values(spotData as any).onConflictDoNothing();
    console.log(`   ✅ Inserted ${spotData.length} spots`);

    // ========================================================================
    // TUTORIAL STEPS
    // ========================================================================
    console.log("📚 Seeding tutorial steps...");

    const tutorialData = [
      {
        stepNumber: 1,
        title: "Stance & Balance",
        description: "Learn your natural stance (regular or goofy) and how to balance on the board.",
        category: "basics",
      },
      {
        stepNumber: 2,
        title: "Pushing",
        description: "Master the pushing technique to gain speed and cruise around.",
        category: "basics",
      },
      {
        stepNumber: 3,
        title: "Stopping",
        description: "Learn multiple ways to stop safely: foot drag, powerslide, and tail stop.",
        category: "basics",
      },
      {
        stepNumber: 4,
        title: "Turning",
        description: "Practice carving and kick-turns to change direction smoothly.",
        category: "basics",
      },
      {
        stepNumber: 5,
        title: "Ollie",
        description: "The foundation of street skating. Pop, slide, and level out.",
        category: "tricks",
      },
      {
        stepNumber: 6,
        title: "Kickflip",
        description: "The classic flip trick. Ollie motion plus a flick off the toe.",
        category: "tricks",
      },
      {
        stepNumber: 7,
        title: "50-50 Grind",
        description: "Your first grind trick. Lock both trucks onto a rail or ledge.",
        category: "tricks",
      },
      {
        stepNumber: 8,
        title: "Manual",
        description: "Balance on two wheels. Essential for connecting tricks.",
        category: "tricks",
      },
      {
        stepNumber: 9,
        title: "Helmet & Pads",
        description: "Proper protective gear fitting and when to use it.",
        category: "safety",
      },
      {
        stepNumber: 10,
        title: "Falling Safely",
        description: "How to fall to minimize injury. Roll with the momentum.",
        category: "safety",
      },
    ];

    await db.insert(tutorialSteps).values(tutorialData).onConflictDoNothing();
    console.log(`   ✅ Inserted ${tutorialData.length} tutorial steps`);

    console.log("\n✨ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run if called directly
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
