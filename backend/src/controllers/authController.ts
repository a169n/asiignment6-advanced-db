import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@/models/User";

const jwtSecret = process.env.JWT_SECRET || "development-secret";

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "username, email and password are required" });
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed });
  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
  res.status(201).json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      purchaseHistory: user.purchaseHistory,
      likedProducts: user.likedProducts,
      viewedProducts: user.viewedProducts
    }
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
  res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      purchaseHistory: user.purchaseHistory,
      likedProducts: user.likedProducts,
      viewedProducts: user.viewedProducts
    }
  });
};
