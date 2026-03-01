// ── Firebase Admin SDK (server-side only) ──────────────────────────────────
import * as admin from "firebase-admin";

function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.apps[0] as admin.app.App;
    }
    return admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

export const adminApp = getAdminApp();
export const adminDb = admin.firestore(adminApp);
