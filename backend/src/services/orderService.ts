import mongoose, { type PipelineStage } from "mongoose";
import { Order, type IOrder, type OrderStatus } from "@/models/Order";
import { Product } from "@/models/Product";
import { Interaction } from "@/models/Interaction";
import { User } from "@/models/User";
import { appConfig } from "@/config/appConfig";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  shippingAddress?: string;
  contactEmail?: string;
}

export async function createOrderForUser(userId: string, payload: CreateOrderInput) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  if (!payload.items?.length) {
    throw new Error("Order must contain at least one item");
  }

  const itemIds = payload.items.map((item) => item.productId);
  const productObjectIds: mongoose.Types.ObjectId[] = [];
  for (const id of itemIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid product identifier");
    }
    productObjectIds.push(new mongoose.Types.ObjectId(id));
  }

  const products = await Product.find({ _id: { $in: productObjectIds } })
    .select("productName price imageUrl imageAlt category")
    .lean();

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const items = payload.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
    return {
      productId: new mongoose.Types.ObjectId(item.productId),
      productName: product.productName,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      price: product.price,
      quantity,
      category: product.category
    };
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    user: new mongoose.Types.ObjectId(userId),
    items,
    total,
    shippingAddress: payload.shippingAddress,
    contactEmail: payload.contactEmail
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      purchaseHistory: { $each: items.map((item) => item.productId) }
    }
  });

  await Interaction.create(
    items.map((item) => ({
      user: new mongoose.Types.ObjectId(userId),
      product: item.productId,
      type: "purchase" as const
    }))
  );

  return order;
}

export async function getOrdersForUser(userId: string, page?: number, limit?: number) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const pageNumber = Math.max(1, Math.floor(page ?? 1));
  const limitNumber = Math.min(appConfig.maxPageSize, Math.max(1, Math.floor(limit ?? appConfig.defaultPageSize)));
  const skip = (pageNumber - 1) * limitNumber;

  const pipeline: PipelineStage[] = [
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 as -1 } },
    {
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limitNumber },
          {
            $project: {
              user: 1,
              items: 1,
              total: 1,
              status: 1,
              shippingAddress: 1,
              contactEmail: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        ],
        totalCount: [{ $count: "count" }]
      }
    }
  ];

  const [result] = await Order.aggregate(pipeline);
  const orders = result?.results ?? [];
  const totalCount = result?.totalCount?.[0]?.count ?? 0;

  return {
    orders,
    total: totalCount,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      pageCount: limitNumber > 0 ? Math.ceil(totalCount / limitNumber) : 0
    }
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order id");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ["PAID"],
    PAID: ["FULFILLED"],
    FULFILLED: []
  };

  if (!allowedTransitions[order.status].includes(status)) {
    throw new Error("Invalid status transition");
  }

  order.status = status;
  await order.save();
  return order;
}

export type { IOrder };
