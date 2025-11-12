import { Request, Response } from "express";
import mongoose from "mongoose";
import type { PipelineStage } from "mongoose";
import { User } from "@/models/User";
import { Interaction } from "@/models/Interaction";
import { AuthenticatedRequest } from "@/middleware/authMiddleware";
import { appConfig } from "@/config/appConfig";

export const listUsers = async (_req: Request, res: Response) => {
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
  res.json(users);
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await User.findById(req.userId, { password: 0 }).lean();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (id !== req.userId) {
    return res.status(403).json({ message: "You can only update your own profile" });
  }

  const { bio, likedProducts, purchaseHistory, notificationPreferences } = req.body as {
    bio?: string;
    likedProducts?: string[];
    purchaseHistory?: string[];
    notificationPreferences?: {
      productAlerts?: boolean;
      orderUpdates?: boolean;
    };
  };

  const updatePayload: Record<string, unknown> = {};
  if (typeof bio === "string") updatePayload.bio = bio;
  if (Array.isArray(likedProducts)) updatePayload.likedProducts = likedProducts;
  if (Array.isArray(purchaseHistory)) updatePayload.purchaseHistory = purchaseHistory;
  if (notificationPreferences && typeof notificationPreferences === "object") {
    updatePayload.notificationPreferences = {
      productAlerts: notificationPreferences.productAlerts ?? true,
      orderUpdates: notificationPreferences.orderUpdates ?? true
    };
  }

  const updated = await User.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(updated);
};

function parsePagination(query: Record<string, unknown>) {
  const parseNumber = (value?: unknown) => {
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (Array.isArray(value) && value.length > 0) {
      const parsed = Number(value[0]);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  return {
    page: parseNumber(query.page),
    limit: parseNumber(query.limit)
  };
}

export const getUserInteractions = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (req.userId !== id) {
    return res.status(403).json({ message: "You can only view your own interactions" });
  }

  const { types } = req.query;
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const pageNumber = Math.max(1, Math.floor(page ?? 1));
  const limitNumber = Math.min(appConfig.maxPageSize, Math.max(1, Math.floor(limit ?? appConfig.defaultPageSize)));
  const skip = (pageNumber - 1) * limitNumber;

  const typeFilter = Array.isArray(types)
    ? types
    : typeof types === "string"
      ? types.split(",").map((value) => value.trim()).filter(Boolean)
      : [];

  const matchStage: Record<string, unknown> = {
    user: new mongoose.Types.ObjectId(id)
  };

  if (typeFilter.length) {
    matchStage.type = { $in: typeFilter };
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDoc",
        pipeline: [
          {
            $project: {
              productName: 1,
              imageUrl: 1,
              imageAlt: 1,
              price: 1,
              category: 1,
              tags: 1,
              rating: 1,
              popularity: 1
            }
          }
        ]
      }
    },
    { $unwind: "$productDoc" },
    {
      $project: {
        _id: 1,
        type: 1,
        createdAt: 1,
        product: {
          _id: "$productDoc._id",
          productName: "$productDoc.productName",
          imageUrl: "$productDoc.imageUrl",
          imageAlt: "$productDoc.imageAlt",
          price: "$productDoc.price",
          category: "$productDoc.category",
          tags: "$productDoc.tags",
          rating: "$productDoc.rating",
          popularity: "$productDoc.popularity"
        }
      }
    },
    {
      $facet: {
        results: [{ $skip: skip }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }]
      }
    }
  ];

  const [result] = await Interaction.aggregate(pipeline);
  const interactions = result?.results ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  res.json({
    interactions,
    total,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      pageCount: limitNumber > 0 ? Math.ceil(total / limitNumber) : 0
    }
  });
};
