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

    let adminAuth: ReturnType<typeof getAdminServices>["auth"];
    try {
      adminAuth = getAdminServices().auth;
    } catch (error) {
      const adminError = error as { code?: unknown; message?: unknown };
      console.error("Firebase Admin initialization failed", {
        code: adminError.code,
        message: adminError.message,
      });
      sendError(res, new HttpError(500, "Firebase Admin server configuration is invalid."));
      return;
    }

    req.firebaseUser = await adminAuth.verifyIdToken(token);
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
