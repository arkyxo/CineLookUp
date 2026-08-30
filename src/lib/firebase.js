import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  collectionGroup,
  query,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---- Usernames ----
// Every account gets a random 6-letter username (A-Z), reserved atomically in
// a top-level `usernames/{username}` collection so two accounts can never
// collide — the document ID itself is the uniqueness guarantee.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomUsername() {
  let s = '';
  for (let i = 0; i < 6; i++) s += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return s;
}

async function claimUniqueUsername(uid, attempts = 25) {
  for (let i = 0; i < attempts; i++) {
    const candidate = randomUsername();
    const ref = doc(db, 'usernames', candidate);
    try {
      const claimed = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) return false;
        tx.set(ref, { uid, createdAt: Date.now() });
        return true;
      });
      if (claimed) return candidate;
    } catch {
      // Contention or a transient error — just try another candidate.
    }
  }
  throw new Error('Could not generate a unique username. Please try again.');
}

// Lets a user get a fresh random username later (e.g. from Settings),
// releasing their old one.
export const regenerateUsername = async (uid, oldUsername) => {
  const username = await claimUniqueUsername(uid);
  await updateProfile(auth.currentUser, { displayName: username });
  if (oldUsername) {
    await deleteDoc(doc(db, 'usernames', oldUsername)).catch(() => {});
  }
  return username;
};

// ---- Auth ----

export const signUp = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const username = await claimUniqueUsername(cred.user.uid);
  await updateProfile(cred.user, { displayName: username });
  return cred.user;
};

export const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const watchAuthState = (cb) => onAuthStateChanged(auth, cb);

// Firebase requires a recent login before letting you change the password,
// so we re-verify the current password first.
export const changePassword = async (currentPassword, newPassword) => {
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPassword);
};

// ---- Per-user lists: users/{uid}/{listName}/{movieId} ----
// listName is one of: "watchlist", "privateList", "ratings"

const listDoc = (uid, listName, movieId) => doc(db, 'users', uid, listName, String(movieId));

export const addToList = (uid, listName, item) =>
  setDoc(listDoc(uid, listName, item.id), {
    id: item.id,
    mediaType: item.media_type || 'movie',
    title: item.title || item.name,
    posterPath: item.poster_path || null,
    voteAverage: item.vote_average ?? null,
    releaseDate: item.release_date || item.first_air_date || null,
    genreIds: item.genre_ids || (item.genres || []).map((g) => g.id),
    addedAt: Date.now(),
  });

export const removeFromList = (uid, listName, movieId) => deleteDoc(listDoc(uid, listName, movieId));

export const getList = async (uid, listName) => {
  const snap = await getDocs(collection(db, 'users', uid, listName));
  return snap.docs.map((d) => d.data());
};

export const isInList = async (uid, listName, movieId) => {
  const snap = await getDoc(listDoc(uid, listName, movieId));
  return snap.exists();
};

// ---- Reviews (rating + comment, stored in the "ratings" subcollection) ----
// Public: any signed-in user can read anyone's review (enforced in Firestore
// rules), but only the owner can write their own.

export const setReview = (uid, item, rating, reviewText, username) =>
  setDoc(listDoc(uid, 'ratings', item.id), {
    id: item.id,
    mediaType: item.media_type || 'movie',
    title: item.title || item.name,
    posterPath: item.poster_path || null,
    rating,
    review: reviewText || '',
    username: username || 'Anonymous',
    ratedAt: Date.now(),
  });

export const getReview = async (uid, movieId) => {
  const snap = await getDoc(listDoc(uid, 'ratings', movieId));
  return snap.exists() ? snap.data() : null;
};

export const getAllReviews = async (max = 100) => {
  const q = query(collectionGroup(db, 'ratings'), orderBy('ratedAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data()).filter((r) => r.review && r.review.trim().length > 0);
};

export const deleteAccount = async (password) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const listNames = ['watchlist', 'privateList', 'ratings'];
  for (const name of listNames) {
    const snap = await getDocs(collection(db, 'users', user.uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }

  if (user.displayName) {
    await deleteDoc(doc(db, 'usernames', user.displayName)).catch(() => {});
  }

  await deleteUser(user);
};