import { getAdminServices } from "./firebaseAdmin.js";
import { HttpError } from "./http.js";

type PrivateProfile = {
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
};

function hasSharedDirect(
  participantIds: unknown,
  requesterUid: string,
  targetUid: string,
): boolean {
  return Array.isArray(participantIds)
    && participantIds.length === 2
    && participantIds.includes(requesterUid)
    && participantIds.includes(targetUid);
}

export async function getRelatedPrivateProfile(
  requesterUid: string,
  targetUid: string,
): Promise<PrivateProfile> {
  const { firestore } = getAdminServices();
  const directId = [requesterUid, targetUid].sort().join("_");
  const directSnapshot = await firestore.collection("directConversations").doc(directId).get();
  const directData = directSnapshot.data();
  const sharesDirect = directSnapshot.exists
    && directData?.type === "direct"
    && hasSharedDirect(directData.participantIds, requesterUid, targetUid);

  if (!sharesDirect) {
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    let sharesGroup = false;
    do {
      let query = firestore.collection("groups")
        .where("memberIds", "array-contains", requesterUid)
        .limit(100);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      sharesGroup = page.docs.some((group) => {
        const memberIds: unknown = group.get("memberIds");
        return Array.isArray(memberIds) && memberIds.includes(targetUid);
      });
      cursor = page.docs.at(-1);
      if (sharesGroup || page.size < 100) break;
    } while (cursor);

    if (!sharesGroup) throw new HttpError(403, "No shared conversation grants access to this profile.");
  }

  return readPrivateProfile(targetUid);
}

async function readPrivateProfile(targetUid: string): Promise<PrivateProfile> {
  const privateSnapshot = await getAdminServices().firestore
    .collection("users").doc(targetUid).collection("private").doc("profile").get();
  if (!privateSnapshot.exists) throw new HttpError(404, "Private profile not found.");
  const data = privateSnapshot.data() as PrivateProfile;

  return {
    ...(typeof data.email === "string" && { email: data.email }),
    ...(typeof data.phoneNumber === "string" && { phoneNumber: data.phoneNumber }),
    ...(typeof data.birthDate === "string" && { birthDate: data.birthDate }),
  };
}
