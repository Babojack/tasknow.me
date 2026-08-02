/**
 * firebaseClient.js - Real backend for TaskNow.
 *
 * Auth + database: Firebase (Auth, Firestore).
 * File uploads: a small PHP endpoint on Hostinger (public/upload.php),
 * NOT Firebase Storage - see the UploadFile implementation below.
 *
 * This is a drop-in replacement for the old in-memory demoClient: it
 * exposes the exact same shape (`demoApi.auth.*`, `demoApi.entities.*`,
 * `demoApi.integrations.Core.*`, `demoApi.appLogs.*`) so none of the ~25
 * page/component files that call `demoApi.*` needed to change.
 *
 * Data model (Firestore collections):
 *   users, tasks, messages, applications, blogPosts, todoItems, reviews,
 *   verificationRequests
 *
 * Design notes:
 * - Every query is built from plain `where(field, "=="/"in", value)`
 *   clauses only - no `orderBy` is ever sent to Firestore. Sorting
 *   happens client-side after the fetch. This means NO composite
 *   Firestore indexes are required anywhere (equality-only compound
 *   queries are covered by Firestore's automatic single-field indexes).
 * - `created_date` is always stamped client-side as an ISO string on
 *   create (unless already provided), matching what every page expects
 *   when it does `format(new Date(item.created_date), ...)`.
 * - Filtering by `{ id: "..." }` or `{ id: { in: [...] } }` short-circuits
 *   to direct `getDoc` calls instead of a collection query - faster, and
 *   works even where Firestore rules only allow `get` and not `list`.
 * - `{ $or: [...] }` inside a filter query runs each branch as a separate
 *   query and merges/dedupes the results (Firestore's JS SDK query
 *   builder does not support OR across different fields in the way this
 *   app's demo client did).
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { queryClientInstance } from "@/lib/query-client";

// File uploads go to a small PHP endpoint on Hostinger (public/upload.php,
// shipped alongside the built SPA), not Firebase Storage. Configure the
// absolute URL via VITE_UPLOAD_URL for local dev (where /upload.php isn't
// served by the Vite dev server); in production on tasknow.me the relative
// default just works since the endpoint lives on the same origin.
const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || "/upload.php";

const USERS_COLLECTION = "users";

// ---------------------------------------------------------------------
// Small helpers shared by every collection
// ---------------------------------------------------------------------

const docToObject = (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null);

const sortByField = (items, sort) => {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
};

// Accepts a plain id string, an array of ids, or `{ in: [...] }` and
// always returns an array of ids (or null for an explicitly empty list).
const normalizeIdValue = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.in)) return value.in;
  if (value === undefined || value === null) return null;
  return [value];
};

// Runs one flat (no $or) filter query against a collection.
async function runFlatQuery(collectionName, flatQuery) {
  const entries = Object.entries(flatQuery || {});

  // Pure id lookup (by far the most common pattern in this app) -> direct
  // doc reads instead of a collection query.
  if (entries.length === 1 && entries[0][0] === "id") {
    const ids = normalizeIdValue(entries[0][1]);
    if (!ids || ids.length === 0) return [];
    const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, collectionName, id))));
    return snaps.map(docToObject).filter(Boolean);
  }

  const constraints = [];
  let idFilter = null;

  for (const [key, value] of entries) {
    if (key === "id") {
      idFilter = normalizeIdValue(value);
      continue;
    }
    if (Array.isArray(value)) {
      constraints.push(where(key, "in", value));
    } else if (value && typeof value === "object" && Array.isArray(value.in)) {
      constraints.push(where(key, "in", value.in));
    } else {
      constraints.push(where(key, "==", value));
    }
  }

  const colRef = collection(db, collectionName);
  const snaps = constraints.length
    ? (await getDocs(query(colRef, ...constraints))).docs
    : (await getDocs(colRef)).docs;

  let items = snaps.map(docToObject);
  if (idFilter) {
    const idSet = new Set(idFilter);
    items = items.filter((item) => idSet.has(item.id));
  }
  return items;
}

async function runQuery(collectionName, rawQuery) {
  if (rawQuery && rawQuery.$or) {
    const { $or, ...base } = rawQuery;
    const branches = await Promise.all(
      $or.map((cond) => runFlatQuery(collectionName, { ...base, ...cond }))
    );
    const merged = new Map();
    for (const branch of branches) {
      for (const item of branch) merged.set(item.id, item);
    }
    return Array.from(merged.values());
  }
  return runFlatQuery(collectionName, rawQuery);
}

const makeEntityApi = (collectionName) => ({
  async filter(queryObj, sort) {
    const items = await runQuery(collectionName, queryObj);
    return sortByField(items, sort);
  },

  async list(sort) {
    const snaps = (await getDocs(collection(db, collectionName))).docs;
    return sortByField(snaps.map(docToObject), sort);
  },

  async create(data) {
    const payload = { created_date: new Date().toISOString(), ...data };
    const docRef = await addDoc(collection(db, collectionName), payload);
    return { id: docRef.id, ...payload };
  },

  async update(id, data) {
    await updateDoc(doc(db, collectionName, id), data);
    return { id, ...data };
  },

  async delete(id) {
    await deleteDoc(doc(db, collectionName, id));
    return { success: true };
  },

  async bulkCreate(list) {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const refs = list.map(() => doc(collection(db, collectionName)));
    list.forEach((data, i) => {
      batch.set(refs[i], { created_date: now, ...data });
    });
    await batch.commit();
    return list.map((data, i) => ({ id: refs[i].id, created_date: now, ...data }));
  },
});

// ---------------------------------------------------------------------
// Auth + user profile
// ---------------------------------------------------------------------

function defaultProfile(fbUser) {
  return {
    email: fbUser.email || "",
    full_name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "User"),
    avatar_url: fbUser.photoURL || "",
    user_type: null,
    role: "user",
    onboarding_completed: false,
    is_verified: false,
    verification_status: "not_started",
    rating: 0,
    total_tasks_completed: 0,
    total_tasks_created: 0,
    created_date: new Date().toISOString(),
  };
}

// Ensures a Firestore users/{uid} profile doc exists for a signed-in
// Firebase Auth user, creating a minimal one on first sign-in. Safe to
// call repeatedly - it's a no-op if the doc already exists.
async function ensureUserProfile(fbUser, overrides = {}) {
  const userRef = doc(db, USERS_COLLECTION, fbUser.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  const profile = { ...defaultProfile(fbUser), ...overrides };
  await setDoc(userRef, profile);
  return { id: fbUser.uid, ...profile };
}

// Resolves once Firebase Auth has finished restoring any existing
// session, so `auth.me()` never races the SDK's initial auth check.
let resolveAuthReady;
const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve;
});
onAuthStateChanged(auth, () => resolveAuthReady());

function invalidateCurrentUser() {
  queryClientInstance.invalidateQueries({ queryKey: ["currentUser"] });
}

const authApi = {
  async me() {
    await authReadyPromise;
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return ensureUserProfile(fbUser);
  },

  async updateMe(data) {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error("Not authenticated");
    await updateDoc(doc(db, USERS_COLLECTION, fbUser.uid), data);
    invalidateCurrentUser();
    return { id: fbUser.uid, ...data };
  },

  async logout() {
    await signOut(auth);
    invalidateCurrentUser();
    return { success: true };
  },

  async redirectToLogin() {
    window.location.href = "/";
  },

  // --- Real auth methods used by the Landing page login/register UI ---

  async loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await ensureUserProfile(cred.user);
    invalidateCurrentUser();
    return profile;
  },

  async registerWithEmail(email, password, fullName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await updateFirebaseAuthProfile(cred.user, { displayName: fullName });
    }
    const profile = await ensureUserProfile(cred.user, fullName ? { full_name: fullName } : {});
    invalidateCurrentUser();
    return profile;
  },

  async loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await ensureUserProfile(cred.user);
    invalidateCurrentUser();
    return profile;
  },
};

// ---------------------------------------------------------------------
// File uploads (custom PHP endpoint on Hostinger) + stubs for
// integrations that would need a server (Cloud Functions) which this
// project intentionally does not use - see FIREBASE_SETUP.md.
// ---------------------------------------------------------------------

const integrationsApi = {
  Core: {
    async UploadFile({ file }) {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error("Not authenticated");

      // upload.php verifies this token server-side (RS256 signature check
      // against Google's public keys) before accepting the file.
      const idToken = await fbUser.getIdToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      if (!response.ok) {
        let message = `Upload failed (${response.status})`;
        try {
          const errBody = await response.json();
          if (errBody?.error) message = errBody.error;
        } catch {
          // ignore - not all failure responses are JSON
        }
        throw new Error(message);
      }

      const data = await response.json();
      return { file_url: data.file_url };
    },
    async SendEmail(payload) {
      console.warn(
        "[TaskNow] SendEmail has no backend configured (no Cloud Functions) - skipping.",
        payload
      );
      return { success: false, skipped: true };
    },
    async SendSMS(payload) {
      console.warn(
        "[TaskNow] SendSMS has no backend configured (no Cloud Functions) - skipping.",
        payload
      );
      return { success: false, skipped: true };
    },
    async GenerateImage() {
      console.warn("[TaskNow] GenerateImage has no AI backend configured - skipping.");
      return { image_url: null };
    },
    async ExtractDataFromUploadedFile() {
      console.warn("[TaskNow] ExtractDataFromUploadedFile has no backend configured - skipping.");
      return { text: "" };
    },
    async InvokeLLM() {
      console.warn("[TaskNow] InvokeLLM has no AI backend configured - skipping.");
      return {};
    },
  },
};

const appLogsApi = {
  async logUserInApp() {
    // No-op: page-view logging would need a backend/analytics sink.
    // Wire up Firebase Analytics here later if desired.
    return { success: true };
  },
};

export const api = {
  auth: authApi,
  entities: {
    User: makeEntityApi("users"),
    Task: makeEntityApi("tasks"),
    Message: makeEntityApi("messages"),
    TaskApplication: makeEntityApi("applications"),
    BlogPost: makeEntityApi("blogPosts"),
    TodoItem: makeEntityApi("todoItems"),
    Review: makeEntityApi("reviews"),
    VerificationRequest: makeEntityApi("verificationRequests"),
    Query: {
      async filter() {
        return [];
      },
    },
  },
  integrations: integrationsApi,
  appLogs: appLogsApi,
};

// Kept for the handful of call sites that want direct access without
// going through the generic entity API.
export { ensureUserProfile };
