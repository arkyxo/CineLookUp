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
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  collectionGroup,
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

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

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
    releaseDate: item.release_date || item.first_air_date || null,
    genreIds: item.genre_ids || (item.genres || []).map((g) => g.id),
    rating,
    review: reviewText || '',
    username: username || 'Anonymous',
    ratedAt: Date.now(),
  });

export const getReview = async (uid, movieId) => {
  const snap = await getDoc(listDoc(uid, 'ratings', movieId));
  return snap.exists() ? snap.data() : null;
};

// Public feed across every user's reviews, newest first. Sorted client-side
// rather than with a Firestore orderBy, since collection-group queries with
// orderBy require a dedicated index — this avoids that setup step entirely.
// Older rating entries saved before this feature existed won't have review
// text, so they're filtered out rather than cluttering the feed.
export const getAllReviews = async (max = 100) => {
  const snap = await getDocs(collectionGroup(db, 'ratings'));
  return snap.docs
    .map((d) => ({ ...d.data(), reviewerUid: d.ref.parent.parent.id }))
    .filter((r) => r.review && r.review.trim().length > 0)
    .sort((a, b) => (b.ratedAt || 0) - (a.ratedAt || 0))
    .slice(0, max);
};

// ---- Side comments on a review: users/{reviewerUid}/ratings/{movieId}/comments/{commentId} ----
// Any signed-in user can read and post; only the comment's own author can delete it.

const commentsCollection = (reviewerUid, movieId) =>
  collection(db, 'users', reviewerUid, 'ratings', String(movieId), 'comments');

export const addComment = async (reviewerUid, movieId, text, author, movieInfo = {}) => {
  await addDoc(commentsCollection(reviewerUid, movieId), {
    text,
    uid: author.uid,
    username: author.username || 'Anonymous',
    createdAt: Date.now(),
  });
  addNotification(reviewerUid, {
    type: 'comment',
    fromUid: author.uid,
    fromUsername: author.username || 'Anonymous',
    movieId,
    movieTitle: movieInfo.title || '',
    mediaType: movieInfo.mediaType || 'movie',
    text,
  }).catch((err) => console.error('Failed to create notification:', err));
};

export const getComments = async (reviewerUid, movieId) => {
  const snap = await getDocs(commentsCollection(reviewerUid, movieId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.createdAt - b.createdAt);
};

// ---- Likes on a review: users/{reviewerUid}/ratings/{movieId}/likes/{likerUid} ----
// Doc ID is the liker's own uid, so "have I liked this" is a single getDoc,
// and a user can only ever create/delete their own like (enforced in rules).

const likeDoc = (reviewerUid, movieId, likerUid) =>
  doc(db, 'users', reviewerUid, 'ratings', String(movieId), 'likes', likerUid);

export const getLikes = async (reviewerUid, movieId) => {
  const snap = await getDocs(collection(db, 'users', reviewerUid, 'ratings', String(movieId), 'likes'));
  return snap.docs.map((d) => d.id); // array of uids who liked it
};

// Toggles the current user's like on a review, returns the new liked state.
export const toggleLike = async (reviewerUid, movieId, likerUid, likerUsername, movieInfo = {}) => {
  const ref = likeDoc(reviewerUid, movieId, likerUid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { likedAt: Date.now() });
  addNotification(reviewerUid, {
    type: 'like',
    fromUid: likerUid,
    fromUsername: likerUsername || 'Anonymous',
    movieId,
    movieTitle: movieInfo.title || '',
    mediaType: movieInfo.mediaType || 'movie',
  }).catch((err) => console.error('Failed to create notification:', err));
  return true;
};

// ---- Public profiles: resolve a username to its owning uid ----

export const getUidByUsername = async (username) => {
  const snap = await getDoc(doc(db, 'usernames', username));
  return snap.exists() ? snap.data().uid : null;
};

// ---- Notifications: users/{uid}/notifications/{notifId} ----
// Private — only the owner can read/mark-read/delete their own. Any signed-in
// user can create a notification IN someone else's subcollection (that's how
// "you got a comment" works), but rules require the notification to honestly
// claim the real sender's uid, so it can't be spoofed.

const notificationsCollection = (uid) => collection(db, 'users', uid, 'notifications');

const addNotification = (toUid, notif) => {
  if (toUid === notif.fromUid) return Promise.resolve(); // never notify yourself
  return addDoc(notificationsCollection(toUid), { ...notif, read: false, createdAt: Date.now() });
};

export const getNotifications = async (uid, max = 50) => {
  const snap = await getDocs(notificationsCollection(uid));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, max);
};

export const markNotificationRead = (uid, notifId) =>
  updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true });

export const markAllNotificationsRead = async (uid) => {
  const snap = await getDocs(notificationsCollection(uid));
  await Promise.all(
    snap.docs.filter((d) => !d.data().read).map((d) => updateDoc(d.ref, { read: true }))
  );
};

// ---- Custom curated lists: users/{uid}/customLists/{listId} ----
// Each list has its own items subcollection:
// users/{uid}/customLists/{listId}/items/{movieId}
// Private to the owner only — same access pattern as Watchlist/Private List.
// (No public/shareable lists yet — that'd need cross-user read rules on the
// items subcollection, a bigger change saved for later.)

export const createCustomList = async (uid, name, description = '') => {
  const ref = await addDoc(collection(db, 'users', uid, 'customLists'), {
    name,
    description,
    createdAt: Date.now(),
  });
  return ref.id;
};

export const getCustomLists = async (uid) => {
  const snap = await getDocs(collection(db, 'users', uid, 'customLists'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
};

export const getCustomList = async (uid, listId) => {
  const snap = await getDoc(doc(db, 'users', uid, 'customLists', listId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const renameCustomList = (uid, listId, name, description) =>
  updateDoc(doc(db, 'users', uid, 'customLists', listId), { name, description });

export const deleteCustomList = async (uid, listId) => {
  const itemsSnap = await getDocs(collection(db, 'users', uid, 'customLists', listId, 'items'));
  await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', uid, 'customLists', listId));
};

const customListItemDoc = (uid, listId, movieId) =>
  doc(db, 'users', uid, 'customLists', listId, 'items', String(movieId));

export const addToCustomList = (uid, listId, item) =>
  setDoc(customListItemDoc(uid, listId, item.id), {
    id: item.id,
    mediaType: item.media_type || 'movie',
    title: item.title || item.name,
    posterPath: item.poster_path || null,
    voteAverage: item.vote_average ?? null,
    releaseDate: item.release_date || item.first_air_date || null,
    genreIds: item.genre_ids || (item.genres || []).map((g) => g.id),
    addedAt: Date.now(),
  });

export const removeFromCustomList = (uid, listId, movieId) => deleteDoc(customListItemDoc(uid, listId, movieId));

export const getCustomListItems = async (uid, listId) => {
  const snap = await getDocs(collection(db, 'users', uid, 'customLists', listId, 'items'));
  return snap.docs.map((d) => d.data());
};

export const isInCustomList = async (uid, listId, movieId) => {
  const snap = await getDoc(customListItemDoc(uid, listId, movieId));
  return snap.exists();
};

// ---- Account deletion ----
// Permanently deletes everything: all three Firestore subcollections
// (watchlist, privateList, ratings), the claimed username, and the Firebase
// Auth account itself. Like changePassword, this needs a recent login.
export const deleteAccount = async (password) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const listNames = ['watchlist', 'privateList', 'ratings'];
  for (const name of listNames) {
    const snap = await getDocs(collection(db, 'users', user.uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }

  const customListsSnap = await getDocs(collection(db, 'users', user.uid, 'customLists'));
  for (const listDocSnap of customListsSnap.docs) {
    const itemsSnap = await getDocs(collection(listDocSnap.ref, 'items'));
    await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(listDocSnap.ref);
  }

  if (user.displayName) {
    await deleteDoc(doc(db, 'usernames', user.displayName)).catch(() => {});
  }

  await deleteUser(user);
};