# CP2 architecture decisions

This document records the architecture to follow before continuing the user, conversation, group, and notification phases. Firestore remains the source of truth for structured profile and group data. Realtime Database remains the message store and realtime authorization surface.

## User profiles and access

```text
users/{uid}
  name
  photoUrl
  createdAt

users/{uid}/private/profile
  email
  phoneNumber
  birthDate
```

`PublicUser` is the only user shape used by `UsersScreen`, chat headers, and the auth context. `PrivateUserProfile` is read directly by the client only for the signed-in user's own profile. The server may read private documents with Admin SDK access.

`publicUsers/{uid}` is a minimal, queryable projection used by the directory screen. It contains only `uid`, `name`, `photoUrl`, and `createdAt`. It exists so directory queries cannot return the legacy mixed profile documents. The old `userDirectory` collection is denied to clients because it may contain email fields.

The legacy Realtime Database `users/` path is closed to client reads and writes; it may still contain CP1 private fields. New profile code uses Firestore only.

Older CP1/CP2 mixed `users/{uid}` documents are migrated only by their owner: on sign-in, the client moves email, phone, and birth date into `private/profile`, rewrites the public document, and refreshes `publicUsers` in one Firestore batch. Rules allow the owner to read that owner's legacy document for this migration; other clients can read only documents containing the public fields. No directory query reads the legacy document collection.

Other users' private profiles must be fetched through `getRelatedPrivateProfile` in the authenticated API service. `ProfileScreen` will use this function for third-party profiles after the API verifies that the caller and target share a direct conversation or group. The client must not read another user's `private/profile` document.

## Conversation membership authorization

Realtime Database stores the authorization projection at:

```text
conversationMembers/{conversationId}/{uid}: true
```

This projection is not authoritative domain data. Firestore conversations and groups determine who belongs. Firebase clients have no read or write permission on `conversationMembers`; RTDB Rules may inspect it while authorizing message reads and writes. The API's Firebase Admin SDK is the only writer.

For group changes:

1. The app validates `memberLimit` and commits membership changes in a Firestore `runTransaction`.
2. After the Firestore transaction commits, the app calls the authenticated membership-sync endpoint.
3. The API reads the committed group from Firestore, verifies the caller is the group owner, and mirrors its `memberIds` into `conversationMembers/{groupId}`.
4. The API returns success only after RTDB synchronization succeeds. The API does not decide membership or arbitrate `memberLimit` concurrency.

`memberLimit` remains enforced in the client, in the Firestore transaction, and in Firestore Rules. Group Rules must also prevent a limit below the current member count.

The current CP1 `conversations/{id}/participants` authorization remains a temporary compatibility path for the existing direct chat. New CP2 conversations use `conversationMembers`; remove the legacy rule path when the direct chat migration is completed.

## Authenticated API boundaries

The client sends the Firebase ID token in `Authorization: Bearer ...`. Only these API responsibilities are in scope:

- push notification delivery;
- protected private-profile reads, after direct/group relationship checks;
- synchronization of Firestore-authoritative membership into RTDB `conversationMembers`.

The mobile API client defines only these request contracts:

| Contract | Request | Server authorization and source of truth |
| --- | --- | --- |
| `GET /users/{uid}/private-profile` | Firebase ID token | Verify a shared direct conversation or group in Firestore, then return the private fields. |
| `POST /groups/{groupId}/membership/sync` | Firebase ID token; empty body | Verify the caller owns the group, read committed `memberIds` from Firestore, then replace the RTDB membership mirror. |
| `POST /direct-conversations/{conversationId}/membership/sync` | Firebase ID token; empty body | Verify the caller is a participant, read `participantIds` from Firestore, then replace the RTDB membership mirror. |

The push endpoint remains within the same API boundary. These server routes are not implemented in this checkpoint; add them with the corresponding profile, relationship, and group flows. Do not add general-purpose profile, group, or conversation CRUD endpoints.

## Implementation order

1. Keep public/private profile persistence and rules aligned; complete owner migration for existing records.
2. Add the authenticated API routes for protected profile reads and membership synchronization when their consuming UI/service flows are added.
3. Implement direct/group Firestore domain services and transactions. Group membership writes call the API only after transaction commit.
4. Move new RTDB message authorization to `conversationMembers`, retaining the CP1 direct-chat bridge until migration.
5. Add push delivery within the same minimal API boundary.

## Current Phase 3 start

The first Phase 3 foundation now includes the Firestore conversation list, deterministic direct-conversation creation, group validation, and transaction-based group domain operations. The client calls the membership-sync API contracts only after Firestore commits. The server routes and group creation/administration UI are still pending; the existing chat screen continues to use the CP1 bridges until the full migration is ready.
