import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Seeds the category tree. The top-level slugs must match the ones
 * hardcoded in the navbar, home page, and footer links.
 */
async function main() {
  const { prisma } = await import("@/lib/prisma");

  const tree: { name: string; slug: string; children: { name: string; slug: string }[] }[] = [
    {
      name: "Jewelry & Accessories",
      slug: "jewelry-accessories",
      children: [
        { name: "Necklaces", slug: "necklaces" },
        { name: "Earrings", slug: "earrings" },
        { name: "Bracelets", slug: "bracelets" },
      ],
    },
    {
      name: "Clothing & Shoes",
      slug: "clothing-shoes",
      children: [
        { name: "Women's Clothing", slug: "womens-clothing" },
        { name: "Men's Clothing", slug: "mens-clothing" },
        { name: "Shoes", slug: "shoes" },
      ],
    },
    {
      name: "Home & Living",
      slug: "home-living",
      children: [
        { name: "Home Décor", slug: "home-decor" },
        { name: "Kitchen & Dining", slug: "kitchen-dining" },
        { name: "Furniture", slug: "furniture" },
      ],
    },
    {
      name: "Art & Collectibles",
      slug: "art-collectibles",
      children: [
        { name: "Wall Art", slug: "wall-art" },
        { name: "Prints", slug: "prints" },
        { name: "Sculptures", slug: "sculptures" },
      ],
    },
    {
      name: "Craft Supplies",
      slug: "craft-supplies",
      children: [
        { name: "Fabric", slug: "fabric" },
        { name: "Beads", slug: "beads" },
        { name: "Tools", slug: "craft-tools" },
      ],
    },
    {
      name: "Gifts & Gift Cards",
      slug: "gifts",
      children: [
        { name: "Gifts for Her", slug: "gifts-for-her" },
        { name: "Gifts for Him", slug: "gifts-for-him" },
        { name: "Gift Cards", slug: "gift-cards" },
      ],
    },
  ];

  for (const top of tree) {
    const parent = await prisma.category.upsert({
      where: { slug: top.slug },
      update: { name: top.name },
      create: { name: top.name, slug: top.slug },
    });

    for (const child of top.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
    }
  }

  const count = await prisma.category.count();
  console.log(`Seeded categories. Total categories in DB: ${count}`);
}

main().catch((error) => {
  console.error("Failed to seed categories:", error);
  process.exit(1);
});
