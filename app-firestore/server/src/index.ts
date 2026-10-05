import express, { type Request, type Response } from "express";
import { requireFirebaseAuth } from "./authMiddleware.js";
import { errorHandler, HttpError, requireString } from "./http.js";
import { syncDirectMembers, syncGroupMembers } from "./membershipService.js";
import { notifyMessage } from "./notificationService.js";
import { getRelatedPrivateProfile } from "./profileService.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb", strict: true }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/users/:uid/private-profile", requireFirebaseAuth, async (req, res, next) => {
  try {
    const requesterUid = req.firebaseUser?.uid;
    const targetUid = requireString(req.params.uid, "uid");
    if (!requesterUid) throw new HttpError(401, "Authentication required.");
    const profile = await getRelatedPrivateProfile(requesterUid, targetUid);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

app.post("/groups/:groupId/membership/sync", requireFirebaseAuth, async (req, res, next) => {
  try {
    const requesterUid = req.firebaseUser?.uid;
    const groupId = requireString(req.params.groupId, "groupId");
    if (!requesterUid) throw new HttpError(401, "Authentication required.");
    const memberIds = await syncGroupMembers(groupId, requesterUid);
    res.status(200).json({ conversationId: groupId, memberCount: memberIds.length, synced: true });
  } catch (error) {
    next(error);
  }
});

app.post("/direct-conversations/:conversationId/membership/sync", requireFirebaseAuth, async (req, res, next) => {
  try {
    const requesterUid = req.firebaseUser?.uid;
    const conversationId = requireString(req.params.conversationId, "conversationId");
    if (!requesterUid) throw new HttpError(401, "Authentication required.");
    const memberIds = await syncDirectMembers(conversationId, requesterUid);
    res.status(200).json({ conversationId, memberCount: memberIds.length, synced: true });
  } catch (error) {
    next(error);
  }
});

app.post("/notifications/messages", requireFirebaseAuth, async (req, res, next) => {
  try {
    const requesterUid = req.firebaseUser?.uid;
    if (!requesterUid) throw new HttpError(401, "Authentication required.");
    const messageId = requireString(req.body?.messageId, "messageId");
    const conversationId = requireString(req.body?.conversationId, "conversationId");
    const result = await notifyMessage(requesterUid, conversationId, messageId);
    res.status(200).json({ messageId, ...result });
  } catch (error) {
    next(error);
  }
});

app.use((_req, _res, next) => next(new HttpError(404, "Route not found.")));
app.use(errorHandler);

export default app;
