import type { NextFunction, Request, Response } from "express";
import { getAdminServices } from "./firebaseAdmin.js";
import { HttpError, sendError } from "./http.js";

export async function requireFirebaseAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.header("authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    const token = match?.[1];
    if (!token) throw new HttpError(401, "A Firebase ID token is required.");
    req.firebaseUser = await getAdminServices().auth.verifyIdToken(token);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      sendError(res, error);
      return;
    }
    const authError = error as { code?: unknown; message?: unknown };
    console.error("Firebase ID token verification failed", {
      code: authError.code,
      message: authError.message,
    });
    sendError(res, new HttpError(401, "The Firebase ID token is invalid or expired."));
  }
}
