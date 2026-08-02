/**
 * demoClient.js
 *
 * TaskNow used to run entirely on an in-memory fake backend during the
 * prototype phase. It's now wired to real Firebase (Firestore/Auth/
 * Storage) - see firebaseClient.js for the implementation.
 *
 * This file is kept (and kept under this name) purely so none of the
 * ~25 pages/components that already do `import { demoApi } from
 * "@/api/demoClient"` needed to change - they get the real backend for
 * free.
 */
export { api as demoApi } from "./firebaseClient";
