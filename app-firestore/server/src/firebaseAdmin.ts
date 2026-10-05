import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

export type AdminServices = {
  app: App;
  auth: ReturnType<typeof getAuth>;
  database: ReturnType<typeof getDatabase>;
  firestore: ReturnType<typeof getFirestore>;
};

let cachedServices: AdminServices | undefined;

export function getAdminServices(): AdminServices {
  if (cachedServices) return cachedServices;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error("Firebase server configuration is incomplete.");
  }

  const app = getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
    databaseURL,
  });

  cachedServices = {
    app,
    auth: getAuth(app),
    database: getDatabase(app),
    firestore: getFirestore(app),
  };
  return cachedServices;
}
