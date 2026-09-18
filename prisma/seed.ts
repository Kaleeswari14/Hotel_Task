import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with comprehensive menu, images, and portion types...");

  // 1. Create Default Users
  const passwordOwner = await bcrypt.hash("admin123", 10);
  const passwordStaff = await bcrypt.hash("staff123", 10);

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      name: "Hotel Owner",
      username: "owner",
      passwordHash: passwordOwner,
      role: "OWNER",
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: "staff" },
    update: {},
    create: {
      name: "Front Desk Staff",
      username: "staff",
      passwordHash: passwordStaff,
      role: "STAFF",
      isActive: true,
    },
  });

  console.log(`Created users: ${owner.username} (OWNER), ${staff.username} (STAFF)`);

  // 2. Categories
  const categoriesData = [
    { name: "Tiffin & Breakfast", nameTamil: "டிபன் & காலை உணவு", displayOrder: 1 },
    { name: "Biriyani & Meals", nameTamil: "பிரியாணி & சாப்பாடு", displayOrder: 2 },
    { name: "Starters & Snacks", nameTamil: "ஸ்டார்ட்டர்ஸ் & ஸ்நாக்ஸ்", displayOrder: 3 },
    { name: "Breads & Gravies", nameTamil: "ரொட்டி & கிரேவி", displayOrder: 4 },
    { name: "Beverages & Tea", nameTamil: "டீ & பானங்கள்", displayOrder: 5 },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { displayOrder: cat.displayOrder, nameTamil: cat.nameTamil },
      create: { name: cat.name, nameTamil: cat.nameTamil, displayOrder: cat.displayOrder },
    });
    categoryMap[cat.name] = created.id;
  }

  // 3. Food Items with Portions, Unit Types & High Quality Food Image URLs
  const foodItems = [
    // --- TIFFIN & BREAKFAST (Piece / Set Count Items) ---
    {
      name: "Idly Sambar (2 Pcs)",
      nameTamil: "இட்லி சாம்பார் (2 எண்)",
      categoryName: "Tiffin & Breakfast",
      description: "Steaming hot soft rice cakes served with sambar and fresh coconut chutney",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "1 Piece", portionNameTamil: "1 எண்", unitMultiplier: 0.5, price: 20 },
        { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 40 },
        { portionName: "Plate (3 Pcs)", portionNameTamil: "பிளேட் (3 எண்)", unitMultiplier: 1.5, price: 60 },
      ],
      stock: { currentQuantity: 100, minThreshold: 20, unitName: "Pieces" },
    },
    {
      name: "Ghee Roast Dosa",
      nameTamil: "நெய் ரோஸ்ட் தோசை",
      categoryName: "Tiffin & Breakfast",
      description: "Crispy golden crepe roasted in pure desi ghee",
      imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 75 },
        { portionName: "Special Dosa", portionNameTamil: "ஸ்பெஷல் தோசை", unitMultiplier: 1.0, price: 95 },
      ],
      stock: { currentQuantity: 60, minThreshold: 15, unitName: "Nos" },
    },
    {
      name: "Masala Dosa",
      nameTamil: "மசால் தோசை",
      categoryName: "Tiffin & Breakfast",
      description: "Crisp dosa filled with spiced mashed potato masala",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 85 },
      ],
      stock: { currentQuantity: 50, minThreshold: 12, unitName: "Nos" },
    },
    {
      name: "Parotta & Salna (2 Pcs)",
      nameTamil: "பரோட்டா சால்னா (2 எண்)",
      categoryName: "Tiffin & Breakfast",
      description: "Layered flaky South Indian flatbread served with hot spicy salna",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1 Piece", portionNameTamil: "1 எண்", unitMultiplier: 0.5, price: 25 },
        { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 50 },
      ],
      stock: { currentQuantity: 80, minThreshold: 15, unitName: "Pieces" },
    },
    {
      name: "Poori Masala (2 Pcs)",
      nameTamil: "பூரி மசாலா (2 எண்)",
      categoryName: "Tiffin & Breakfast",
      description: "Puffed golden wheat breads served with potato masala curry",
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 60 },
      ],
      stock: { currentQuantity: 40, minThreshold: 10, unitName: "Sets" },
    },

    // --- BIRIYANI & MEALS (Plate & Portion Items) ---
    {
      name: "Chicken Biriyani",
      nameTamil: "சிக்கன் பிரியாணி",
      categoryName: "Biriyani & Meals",
      description: "Fragrant seeraga samba rice cooked with tender chicken and authentic spices",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/4 Plate", portionNameTamil: "கால் பிளேட்", unitMultiplier: 0.25, price: 60 },
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 110 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 200 },
      ],
      stock: { currentQuantity: 30, minThreshold: 8, unitName: "Plates" },
    },
    {
      name: "Egg Biriyani",
      nameTamil: "முட்டை பிரியாணி",
      categoryName: "Biriyani & Meals",
      description: "Delicious spiced aromatic biriyani served with boiled eggs and raita",
      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 90 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 160 },
      ],
      stock: { currentQuantity: 25, minThreshold: 6, unitName: "Plates" },
    },
    {
      name: "Mutton Dum Biriyani",
      nameTamil: "மட்டன் தம் பிரியாணி",
      categoryName: "Biriyani & Meals",
      description: "Rich dum biriyani layered with succulent mutton cuts",
      imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/4 Plate", portionNameTamil: "கால் பிளேட்", unitMultiplier: 0.25, price: 80 },
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 160 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 290 },
      ],
      stock: { currentQuantity: 20, minThreshold: 5, unitName: "Plates" },
    },
    {
      name: "Mutton Biriyani",
      nameTamil: "மட்டன் பிரியாணி",
      categoryName: "Biriyani & Meals",
      description: "Rich and flavorful mutton dum biriyani",
      imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 160 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 290 },
      ],
      stock: { currentQuantity: 20, minThreshold: 5, unitName: "Plates" },
    },
    {
      name: "South Indian Non-Veg Meals",
      nameTamil: "அசைவ சாப்பாடு / மீல்ஸ்",
      categoryName: "Biriyani & Meals",
      description: "Unlimited boiled rice, chicken gravy, mutton salna, fish curry, rasam, curd & appalam",
      imageUrl: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "Full Meals", portionNameTamil: "முழு சாப்பாடு", unitMultiplier: 1.0, price: 150 },
      ],
      stock: { currentQuantity: 50, minThreshold: 10, unitName: "Meals" },
    },

    // --- STARTERS & SNACKS ---
    {
      name: "Chicken 65",
      nameTamil: "சிக்கன் 65",
      categoryName: "Starters & Snacks",
      description: "Crispy, spicy deep fried chicken bites garnished with curry leaves",
      imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 90 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 160 },
      ],
      stock: { currentQuantity: 25, minThreshold: 5, unitName: "Plates" },
    },
    {
      name: "Paneer Butter Masala",
      nameTamil: "பன்னீர் பட்டர் மசாலா",
      categoryName: "Breads & Gravies",
      description: "Cottage cheese cubes simmered in a creamy butter tomato gravy",
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 100 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 180 },
      ],
      stock: { currentQuantity: 15, minThreshold: 4, unitName: "Plates" },
    },
    {
      name: "Butter Naan",
      nameTamil: "பட்டர் நான்",
      categoryName: "Breads & Gravies",
      description: "Fresh tandoor baked bread brushed with generous butter",
      imageUrl: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=500&q=80",
      portions: [
        { portionName: "1 Piece", portionNameTamil: "1 ரொட்டி", unitMultiplier: 1.0, price: 40 },
      ],
      stock: { currentQuantity: 60, minThreshold: 15, unitName: "Pieces" },
    },

    // --- BEVERAGES & TEA ---
    {
      name: "Madras Filter Coffee",
      nameTamil: "மெட்ராஸ் ஃபில்டர் காபி",
      categoryName: "Beverages & Tea",
      description: "Traditional hot frothy filter coffee brewed with chicory and fresh cow milk",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "1 Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 25 },
      ],
      stock: { currentQuantity: 100, minThreshold: 20, unitName: "Cups" },
    },
    {
      name: "Cardamom Tea",
      nameTamil: "ஏலக்காய் டீ",
      categoryName: "Beverages & Tea",
      description: "Strong hot tea infused with crushed cardamom",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "1 Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 20 },
      ],
      stock: { currentQuantity: 120, minThreshold: 20, unitName: "Cups" },
    },
    {
      name: "Fresh Lime Soda",
      nameTamil: "லெமன் சோடா",
      categoryName: "Beverages & Tea",
      description: "Chilled sweet and salt lime soda",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      portions: [
        { portionName: "1 Glass", portionNameTamil: "1 கிளாஸ்", unitMultiplier: 1.0, price: 45 },
      ],
      stock: { currentQuantity: 40, minThreshold: 8, unitName: "Glasses" },
    },
  ];

  for (const item of foodItems) {
    const catId = categoryMap[item.categoryName];
    if (!catId) continue;

    const existing = await prisma.foodItem.findFirst({
      where: { name: item.name },
      include: { portions: true, stock: true },
    });

    if (existing) {
      // Update image, description, and Tamil name
      await prisma.foodItem.update({
        where: { id: existing.id },
        data: {
          nameTamil: item.nameTamil,
          imageUrl: item.imageUrl,
          description: item.description,
        },
      });

      // Update portions
      for (const p of item.portions) {
        const existingP = existing.portions.find((ep) => ep.portionName === p.portionName);
        if (existingP) {
          await prisma.foodPortion.update({
            where: { id: existingP.id },
            data: { portionNameTamil: p.portionNameTamil },
          });
        }
      }
    } else {
      await prisma.foodItem.create({
        data: {
          name: item.name,
          nameTamil: item.nameTamil,
          categoryId: catId,
          description: item.description,
          imageUrl: item.imageUrl,
          portions: {
            create: item.portions.map((p) => ({
              portionName: p.portionName,
              portionNameTamil: p.portionNameTamil,
              unitMultiplier: p.unitMultiplier,
              price: p.price,
            })),
          },
          stock: {
            create: {
              currentQuantity: item.stock.currentQuantity,
              minThreshold: item.stock.minThreshold,
              unitName: item.stock.unitName,
            },
          },
        },
      });
      console.log(`Created food item: ${item.name} (${item.nameTamil})`);
    }
  }

  // Universal portion name sync
  const portionDict: Record<string, string> = {
    "1/4 Plate": "கால் பிளேட்",
    "1/2 Plate": "அரை பிளேட்",
    "1 Plate": "முழு பிளேட்",
    "Full Meals": "முழு சாப்பாடு",
    "1 Piece": "1 எண்",
    "1 Set (2 Pcs)": "1 செட் (2 எண்)",
    "Plate (3 Pcs)": "பிளேட் (3 எண்)",
    "Single Dosa": "சிங்கிள் தோசை",
    "Special Dosa": "ஸ்பெஷல் தோசை",
    "1 Cup": "1 கப்",
    "1 Glass": "1 கிளாஸ்",
  };

  for (const [pName, pTamil] of Object.entries(portionDict)) {
    await prisma.foodPortion.updateMany({
      where: { portionName: pName },
      data: { portionNameTamil: pTamil },
    });
  }

  // Universal food name sync
  const foodDict: Record<string, string> = {
    "Egg Biriyani": "முட்டை பிரியாணி",
    "Chicken Biriyani": "சிக்கன் பிரியாணி",
    "Mutton Dum Biriyani": "மட்டன் தம் பிரியாணி",
    "Mutton Biriyani": "மட்டன் பிரியாணி",
    "idly": "இட்லி",
    "Idly": "இட்லி",
  };

  for (const [fName, fTamil] of Object.entries(foodDict)) {
    await prisma.foodItem.updateMany({
      where: { name: fName },
      data: { nameTamil: fTamil },
    });
  }

  console.log("✅ Seed completed with all Tamil food names, categories and images!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

