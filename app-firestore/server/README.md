# Mobile CP1 API

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

Recipient IDs are derived from the RTDB message, the Firestore direct/group record, and the group's `notificationPolicy`. `mentionedUserIds` are checked against current group membership. The sender is always excluded. Device records are read from `users/{uid}/devices/{deviceId}` and should contain `expoPushToken` (or legacy `token`) and optionally `enabled`/`active`; disabled device records are skipped. Successful per-message/per-device sends are persisted in `notificationDeliveries/{messageId}/devices/{sha256-token}` so retries do not resend acknowledged Expo tickets. Expo tickets mean accepted by Expo, not confirmed device delivery; receipt polling is outside this API's current endpoint scope.

## Configuration

Copy `.env.example` to `.env` for local development. In Vercel, configure the same variables in Project Settings. Firebase Admin credentials are read only from environment variables; Application Default Credentials are used when the service account pair is omitted in a suitable hosting environment. `FIREBASE_DATABASE_URL` is required. `EXPO_ACCESS_TOKEN` is optional and is sent as a bearer token to Expo when configured.

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
```
