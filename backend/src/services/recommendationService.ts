import mongoose from "mongoose";
import { Interaction } from "@/models/Interaction";
import { Product, type IProduct } from "@/models/Product";

interface RecommendationOptions {
  limit?: number;
}

function weightForType(type: string) {
  switch (type) {
    case "purchase":
      return 3;
    case "like":
      return 2;
    default:
      return 1;
  }
}

export async function getRecommendationsForUser(userId: string, options: RecommendationOptions = {}) {
  const { limit = 9 } = options;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return [] as IProduct[];
  }

  const focusInteractions = await Interaction.find({
    user: userId,
    type: { $in: ["like", "purchase"] }
  })
    .lean()
    .exec();

  const focusProductIds = new Set(focusInteractions.map((item) => item.product.toString()));
  if (!focusProductIds.size) {
    return getTrendingProducts(limit);
  }

  const similarInteractions = await Interaction.find({
    product: { $in: Array.from(focusProductIds) },
    user: { $ne: userId },
    type: { $in: ["like", "purchase"] }
  })
    .lean()
    .exec();

  const similarityScores = new Map<string, number>();
  for (const interaction of similarInteractions) {
    const key = interaction.user.toString();
    const weight = weightForType(interaction.type);
    similarityScores.set(key, (similarityScores.get(key) ?? 0) + weight);
  }

  const topSimilarUsers = Array.from(similarityScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([user]) => user);

  if (!topSimilarUsers.length) {
    return getTrendingProducts(limit);
  }

  const candidateInteractions = await Interaction.find({
    user: { $in: topSimilarUsers },
    type: { $in: ["like", "purchase", "view"] }
  })
    .lean()
    .exec();

  const productScores = new Map<string, number>();

  for (const interaction of candidateInteractions) {
    const productId = interaction.product.toString();
    if (focusProductIds.has(productId)) continue;
    const baseWeight = weightForType(interaction.type);
    const similarity = similarityScores.get(interaction.user.toString()) ?? 1;
    productScores.set(productId, (productScores.get(productId) ?? 0) + baseWeight * similarity);
  }

  if (!productScores.size) {
    return getTrendingProducts(limit);
  }

  const sortedProducts = Array.from(productScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const products = await Product.find({ _id: { $in: sortedProducts } })
    .lean()
    .exec();

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  return sortedProducts
    .map((id) => productMap.get(id))
    .filter((product): product is IProduct => Boolean(product));
}

async function getTrendingProducts(limit: number) {
  const top = await Interaction.aggregate([
    { $match: { type: { $in: ["like", "purchase"] } } },
    {
      $group: {
        _id: "$product",
        score: { $sum: { $cond: [{ $eq: ["$type", "purchase"] }, 3, 2] } }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);

  const ids = top.map((item) => item._id);
  if (!ids.length) {
    return Product.find().sort({ createdAt: -1 }).limit(limit).lean();
  }

  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  return ids
    .map((id) => productMap.get(id.toString()))
    .filter((product): product is IProduct => Boolean(product));
}
