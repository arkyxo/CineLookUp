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

// ---- Auth ----

export const signUp = async (email, password, username) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (username) await updateProfile(cred.user, { displayName: username });
  return cred.user;
};

export const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const watchAuthState = (cb) => onAuthStateChanged(auth, cb);

export const updateUsername = (username) => updateProfile(auth.currentUser, { displayName: username });

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

export const setRating = (uid, item, rating) =>
  setDoc(listDoc(uid, 'ratings', item.id), {
    id: item.id,
    title: item.title || item.name,
    posterPath: item.poster_path || null,
    rating,
    ratedAt: Date.now(),
  });

export const getRating = async (uid, movieId) => {
  const snap = await getDoc(listDoc(uid, 'ratings', movieId));
  return snap.exists() ? snap.data().rating : 0;
};

// ---- Account deletion ----
// Permanently deletes everything: all three Firestore subcollections
// (watchlist, privateList, ratings) plus the Firebase Auth account itself.
// Like changePassword, this needs a recent login, so we re-verify first.
export const deleteAccount = async (password) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const listNames = ['watchlist', 'privateList', 'ratings'];
  for (const name of listNames) {
    const snap = await getDocs(collection(db, 'users', user.uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }

  await deleteUser(user);
};