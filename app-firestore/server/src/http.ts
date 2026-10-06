import type { ErrorRequestHandler, Request, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

declare module "express-serve-static-core" {
  interface Request {
    firebaseUser?: DecodedIdToken;
  }
}

export function sendError(res: Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  console.error("API request failed", error);
  res.status(500).json({ message: "Internal server error." });
}

export const errorHandler: ErrorRequestHandler = (error, _req, res) => {
  sendError(res, error);
};

export function authenticatedUid(req: Request): string {
  const uid = req.firebaseUser?.uid;
  if (!uid) throw new HttpError(401, "Authentication required.");
  return uid;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${fieldName} is required.`);
  }
  return value.trim();
}
