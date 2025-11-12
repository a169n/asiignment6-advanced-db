import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "@/middleware/authMiddleware";
import {
  createOrderForUser,
  getOrdersForUser,
  updateOrderStatus,
  type CreateOrderInput,
  type IOrder
} from "@/services/orderService";
import { User } from "@/models/User";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = req.body as CreateOrderInput;
  try {
    const order = await createOrderForUser(req.userId, payload);
    res.status(201).json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order";
    res.status(400).json({ message });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { page, limit } = req.query;
  const parse = (value?: unknown) => {
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

  const pageNumber = parse(page);
  const limitNumber = parse(limit);

  const result = await getOrdersForUser(req.userId, pageNumber, limitNumber);
  res.json(result);
};

export const updateOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const requester = await User.findById(req.userId).select("role").lean();
  if (requester?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const { status } = req.body as { status?: IOrder["status"] };
  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  try {
    const order = await updateOrderStatus(id, status);
    res.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order";
    res.status(400).json({ message });
  }
};
