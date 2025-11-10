import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message =
    typeof error === "object" && error && "message" in error ? String(error.message) : "Server error";

  res.status(Number.isFinite(status) ? status : 500).json({ message });
};
