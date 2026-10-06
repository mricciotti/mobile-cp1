# Mobile CP2 API

Node.js 22, TypeScript, Express, and Firebase Admin API. Set the Vercel project root to `server`; Vercel serves the exported Express app from `src/index.ts` at the domain root.

## Endpoints

| Method | Path | Authentication |
| --- | --- | --- |
| GET | `/health` | Public |
| GET | `/users/:uid/private-profile` | Firebase ID token; requester and target must share a direct conversation or group |
| POST | `/groups/:groupId/membership/sync` | Firebase ID token; requester must own the group |
| POST | `/direct-conversations/:conversationId/membership/sync` | Firebase ID token; requester must be a participant |
| POST | `/notifications/messages` | Firebase ID token; requester must be the stored message sender |

Membership sync accepts an empty JSON body. The server reads the member list from Firestore and replaces `conversationMembers/{conversationId}` in RTDB. It never takes membership IDs from the client.

Notification requests contain only identifiers, for example:

```json
{
  "conversationId": "group-id-or-direct-id",
  "messageId": "realtime-database-message-key"
}
```

Recipient IDs are derived from the RTDB message, the Firestore direct/group record, and the group's `notificationPolicy`. `mentionedUserIds` are checked against current group membership. The sender is always excluded. Device records are read from `users/{uid}/devices/{deviceId}` and contain `expoPushToken` plus `enabled`/`platform`/`updatedAt`; disabled device records are skipped. Successful per-message/per-device sends are persisted under `notificationDeliveries/{sha256(conversationId:messageId)}/devices/{sha256-token}` so retries do not resend acknowledged Expo tickets. The logical delivery key includes both conversation and message identifiers, and the summary `createdAt` is written only on first creation. An Expo ticket with status `ok` means that Expo accepted the request, not that the device received it; receipt polling is intentionally outside this API's current endpoint scope and remains a later audit enhancement.

## Configuration

Copy `.env.example` to `.env` for local development. In Vercel, configure the same variables in Project Settings. Firebase Admin credentials are read only from environment variables; `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` and `FIREBASE_DATABASE_URL` are required by the current server implementation. `EXPO_ACCESS_TOKEN` is optional and is sent as a bearer token to Expo when configured.

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
```
