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

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
  [key: string]: unknown;
};

let cachedServices: AdminServices | undefined;

function isServiceAccountJson(value: unknown): value is ServiceAccountJson {
  if (typeof value !== "object" || value === null) return false;
  const account = value as Record<string, unknown>;
  return typeof account.project_id === "string"
    && typeof account.client_email === "string"
    && typeof account.private_key === "string";
}

export function getAdminServices(): AdminServices {
  if (cachedServices) return cachedServices;

  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!encodedServiceAccount || !databaseURL) {
    throw new Error("Firebase server configuration is incomplete.");
  }

  let serviceAccount: ServiceAccountJson;
  try {
    const decodedServiceAccount = Buffer.from(encodedServiceAccount, "base64").toString("utf8");
    const parsedServiceAccount: unknown = JSON.parse(decodedServiceAccount);
    if (!isServiceAccountJson(parsedServiceAccount)) {
      throw new Error("Service account fields are incomplete.");
    }
    serviceAccount = parsedServiceAccount;
  } catch {
    throw new Error("Firebase service account configuration is invalid.");
  }

  const app = getApps()[0] ?? initializeApp({
    // Firebase Admin accepts the original Google service-account JSON shape.
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
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
