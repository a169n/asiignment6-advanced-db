import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase } from "@/config/database";
import { seedDatabase } from "@/utils/seedData";
import { Interaction, type InteractionType } from "@/models/Interaction";
import { User } from "@/models/User";
import { getRecommendationsForUser } from "@/services/recommendationService";

interface HoldoutInteraction {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  type: InteractionType;
}

interface UserMetrics {
  userId: string;
  trainingCount: number;
  holdoutCount: number;
  precision: number;
  recall: number;
  f1: number;
  segment: "cold" | "medium" | "heavy";
}

function segmentFor(count: number): "cold" | "medium" | "heavy" {
  if (count <= 1) return "cold";
  if (count <= 5) return "medium";
  return "heavy";
}

function harmonicMean(precision: number, recall: number) {
  if (precision === 0 && recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

async function prepareHoldouts() {
  const interactions = await Interaction.find({ type: { $in: ["like", "purchase"] } })
    .sort({ createdAt: 1 })
    .lean();
  const grouped = new Map<string, HoldoutInteraction[]>();
  interactions.forEach((interaction) => {
    const key = interaction.user.toString();
    const list = grouped.get(key) || [];
    list.push({
      _id: interaction._id as mongoose.Types.ObjectId,
      user: interaction.user as mongoose.Types.ObjectId,
      product: interaction.product as mongoose.Types.ObjectId,
      type: interaction.type as InteractionType,
    });
    grouped.set(key, list);
  });

  const holdoutsByUser = new Map<string, HoldoutInteraction[]>();

  for (const [userId, list] of grouped.entries()) {
    if (list.length < 2) continue;
    const holdoutSize = Math.max(1, Math.floor(list.length * 0.2));
    const holdout = list.slice(-holdoutSize);
    holdoutsByUser.set(userId, holdout);
  }

  const holdoutIds = Array.from(holdoutsByUser.values()).flat().map((item) => item._id);
  if (holdoutIds.length) {
    await Interaction.deleteMany({ _id: { $in: holdoutIds } });
  }

  for (const holdouts of holdoutsByUser.values()) {
    const productIds = holdouts.map((item) => item.product);
    const likes = holdouts.filter((item) => item.type === "like").map((item) => item.product);
    const purchases = holdouts.filter((item) => item.type === "purchase").map((item) => item.product);
    const userId = holdouts[0].user;
    if (likes.length) {
      await User.updateOne({ _id: userId }, { $pull: { likedProducts: { $in: likes } } });
    }
    if (purchases.length) {
      await User.updateOne({ _id: userId }, { $pull: { purchaseHistory: { $in: purchases } } });
    }
    await User.updateOne({ _id: userId }, { $pull: { viewedProducts: { $in: productIds } } });
  }

  return holdoutsByUser;
}

async function evaluateRecommendations() {
  const holdouts = await prepareHoldouts();
  const metrics: UserMetrics[] = [];
  let totalRecommended = 0;
  let totalHits = 0;
  let totalHoldout = 0;

  const segmentTotals: Record<"cold" | "medium" | "heavy", { recommended: number; hits: number; holdouts: number; users: number; precisionSum: number; recallSum: number; f1Sum: number }> = {
    cold: { recommended: 0, hits: 0, holdouts: 0, users: 0, precisionSum: 0, recallSum: 0, f1Sum: 0 },
    medium: { recommended: 0, hits: 0, holdouts: 0, users: 0, precisionSum: 0, recallSum: 0, f1Sum: 0 },
    heavy: { recommended: 0, hits: 0, holdouts: 0, users: 0, precisionSum: 0, recallSum: 0, f1Sum: 0 },
  };

  for (const [userId, holdoutList] of holdouts.entries()) {
    const trainingCount = await Interaction.countDocuments({ user: userId, type: { $in: ["like", "purchase"] } });
    const holdoutIds = new Set(holdoutList.map((item) => item.product.toString()));
    const recommendations = await getRecommendationsForUser(userId, { limit: 10 });
    const recommendedIds = recommendations.map((item) => (item._id as mongoose.Types.ObjectId).toString());
    const hits = recommendedIds.filter((id) => holdoutIds.has(id)).length;
    const precision = recommendedIds.length ? hits / recommendedIds.length : 0;
    const recall = holdoutIds.size ? hits / holdoutIds.size : 0;
    const f1 = harmonicMean(precision, recall);
    const segment = segmentFor(trainingCount);

    metrics.push({
      userId,
      trainingCount,
      holdoutCount: holdoutIds.size,
      precision,
      recall,
      f1,
      segment,
    });

    totalRecommended += recommendedIds.length;
    totalHits += hits;
    totalHoldout += holdoutIds.size;

    const totals = segmentTotals[segment];
    totals.recommended += recommendedIds.length;
    totals.hits += hits;
    totals.holdouts += holdoutIds.size;
    totals.users += 1;
    totals.precisionSum += precision;
    totals.recallSum += recall;
    totals.f1Sum += f1;
  }

  const macroPrecision = metrics.length ? metrics.reduce((sum, entry) => sum + entry.precision, 0) / metrics.length : 0;
  const macroRecall = metrics.length ? metrics.reduce((sum, entry) => sum + entry.recall, 0) / metrics.length : 0;
  const macroF1 = metrics.length ? metrics.reduce((sum, entry) => sum + entry.f1, 0) / metrics.length : 0;

  const microPrecision = totalRecommended ? totalHits / totalRecommended : 0;
  const microRecall = totalHoldout ? totalHits / totalHoldout : 0;
  const microF1 = harmonicMean(microPrecision, microRecall);

  return {
    perUser: metrics,
    macro: { precision: macroPrecision, recall: macroRecall, f1: macroF1 },
    micro: { precision: microPrecision, recall: microRecall, f1: microF1 },
    segments: Object.fromEntries(
      Object.entries(segmentTotals).map(([segment, totals]) => {
        const averagePrecision = totals.users ? totals.precisionSum / totals.users : 0;
        const averageRecall = totals.users ? totals.recallSum / totals.users : 0;
        const averageF1 = totals.users ? totals.f1Sum / totals.users : 0;
        const microPrec = totals.recommended ? totals.hits / totals.recommended : 0;
        const microRec = totals.holdouts ? totals.hits / totals.holdouts : 0;
        return [segment, {
          users: totals.users,
          macroPrecision: averagePrecision,
          macroRecall: averageRecall,
          macroF1: averageF1,
          microPrecision: microPrec,
          microRecall: microRec,
          microF1: harmonicMean(microPrec, microRec),
        }];
      })
    ),
  };
}

async function main() {
  const mongo = await MongoMemoryServer.create({ binary: { version: "7.0.5" } });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.AUTO_SEED = "true";
  await connectDatabase();
  await seedDatabase();
  const evaluation = await evaluateRecommendations();

  const outputDir = path.resolve(process.cwd(), "artifacts/recommendations");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "metrics.json"), JSON.stringify(evaluation, null, 2), "utf-8");

  const rows = evaluation.perUser
    .map((entry) =>
      `| ${entry.userId} | ${entry.trainingCount} | ${entry.holdoutCount} | ${entry.precision.toFixed(2)} | ${entry.recall.toFixed(2)} | ${entry.f1.toFixed(2)} | ${entry.segment} |`
    )
    .join("\n");

  const markdown = `# Recommendation Quality\n\n` +
    `**Macro averages**: Precision ${evaluation.macro.precision.toFixed(2)}, Recall ${evaluation.macro.recall.toFixed(2)}, F1 ${evaluation.macro.f1.toFixed(2)}\n\n` +
    `**Micro averages**: Precision ${evaluation.micro.precision.toFixed(2)}, Recall ${evaluation.micro.recall.toFixed(2)}, F1 ${evaluation.micro.f1.toFixed(2)}\n\n` +
    `| User | Training | Holdout | Precision | Recall | F1 | Segment |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}`;

  writeFileSync(path.join(outputDir, "metrics.md"), markdown, "utf-8");

  await mongoose.disconnect();
  await mongo.stop();
}

main().catch((error) => {
  console.error("Recommendation metrics failed", error);
  process.exit(1);
});
