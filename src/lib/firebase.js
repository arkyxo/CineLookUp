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
  query,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  onSnapshot,
} from 'firebase/firestore';
import { itemKey, mediaTypeOf } from './tmdb';

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

// ---- Per-user lists: users/{uid}/{listName}/{itemKey} ----
// listName is one of: "watchlist", "privateList", "ratings"
// itemKey is `${mediaType}-${tmdbId}` (e.g. "movie-550", "tv-550") because TMDb
// ids are only unique per media type. Documents written by older versions used
// the bare TMDb id as the doc ID; `locate` below still finds those so existing
// data keeps working (and gets updated in place rather than duplicated).

const listDoc = (uid, listName, key) => doc(db, 'users', uid, listName, String(key));

// Find the doc for an item: new-style key first, then a legacy bare-id doc
// as long as it belongs to the same media type. Returns { ref, snap }; if
// neither exists, ref points at the new-style key (where a write should go).
async function locate(refFor, mediaType, id) {
  const current = refFor(itemKey(mediaType, id));
  const currentSnap = await getDoc(current);
  if (currentSnap.exists()) return { ref: current, snap: currentSnap };

  const legacy = refFor(String(id));
  const legacySnap = await getDoc(legacy);
  if (legacySnap.exists() && (legacySnap.data().mediaType || 'movie') === mediaType) {
    return { ref: legacy, snap: legacySnap };
  }
  return { ref: current, snap: currentSnap };
}

const listRef = (uid, listName) => (key) => listDoc(uid, listName, key);

// Shape shared by watchlist / privateList / custom list items.
const itemFields = (item) => ({
  id: item.id,
  mediaType: mediaTypeOf(item),
  title: item.title || item.name,
  posterPath: item.poster_path || null,
  voteAverage: item.vote_average ?? null,
  releaseDate: item.release_date || item.first_air_date || null,
  genreIds: item.genre_ids || (item.genres || []).map((g) => g.id),
  addedAt: Date.now(),
});

export const addToList = async (uid, listName, item) => {
  const { ref } = await locate(listRef(uid, listName), mediaTypeOf(item), item.id);
  await setDoc(ref, itemFields(item));
};

export const removeFromList = async (uid, listName, mediaType, movieId) => {
  const { ref } = await locate(listRef(uid, listName), mediaType, movieId);
  await deleteDoc(ref);
};

// Every returned item carries `key` (its real Firestore doc ID) — use it for
// React keys, and as the review key for comments/likes.
export const getList = async (uid, listName) => {
  const snap = await getDocs(collection(db, 'users', uid, listName));
  return snap.docs.map((d) => ({ ...d.data(), key: d.id }));
};

export const isInList = async (uid, listName, mediaType, movieId) => {
  const { snap } = await locate(listRef(uid, listName), mediaType, movieId);
  return snap.exists();
};

// ---- Reviews (rating + comment, stored in the "ratings" subcollection) ----
// Public: any signed-in user can read anyone's review (enforced in Firestore
// rules), but only the owner can write their own.

export const setReview = async (uid, item, rating, reviewText, username) => {
  // locate() reuses an existing (possibly legacy) doc so editing a review keeps
  // its comments and likes attached.
  const { ref } = await locate(listRef(uid, 'ratings'), mediaTypeOf(item), item.id);
  await setDoc(ref, {
    id: item.id,
    mediaType: mediaTypeOf(item),
    title: item.title || item.name,
    posterPath: item.poster_path || null,
    releaseDate: item.release_date || item.first_air_date || null,
    genreIds: item.genre_ids || (item.genres || []).map((g) => g.id),
    rating,
    review: reviewText || '',
    username: username || 'Anonymous',
    ratedAt: Date.now(),
  });
};

export const getReview = async (uid, mediaType, movieId) => {
  const { snap } = await locate(listRef(uid, 'ratings'), mediaType, movieId);
  return snap.exists() ? { ...snap.data(), key: snap.id } : null;
};

// Public feed across every user's reviews, newest first, one page at a time.
// Uses a server-side orderBy + limit (+ startAfter cursor) so the client only
// reads a page of documents instead of the entire collection group — the old
// version downloaded every review ever written and sliced to 100 locally.
//
// NOTE: ordering a collection-group query needs a collection-group index on
// `ratings.ratedAt` — see firestore.indexes.json.
//
// Ratings saved without review text are skipped. To keep pages from coming
// back near-empty when many are skipped, this keeps reading until it has a
// full page (bounded by MAX_ROUNDS), then returns a cursor for the next page.
const MAX_ROUNDS = 5;

export const getReviewsPage = async (pageSize = 20, cursor = null) => {
  const reviews = [];
  let last = cursor;
  let exhausted = false;

  for (let round = 0; round < MAX_ROUNDS && reviews.length < pageSize && !exhausted; round++) {
    const constraints = [orderBy('ratedAt', 'desc'), ...(last ? [startAfter(last)] : []), limit(pageSize)];
    const snap = await getDocs(query(collectionGroup(db, 'ratings'), ...constraints));

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.review && data.review.trim().length > 0) {
        reviews.push({ ...data, key: d.id, reviewerUid: d.ref.parent.parent.id });
      }
    });

    if (snap.docs.length > 0) last = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < pageSize) exhausted = true;
  }

  return { reviews, cursor: last, hasMore: !exhausted };
};

// ---- Side comments on a review: users/{reviewerUid}/ratings/{reviewKey}/comments/{commentId} ----
// `reviewKey` is the review doc's real ID (the `key` field on review objects).
// Any signed-in user can read and post; only the comment's own author can delete it.
// A reply is just a comment with `parentId` set to the comment it's replying
// to — reusing the same collection/rules instead of adding a new one.

const commentsCollection = (reviewerUid, reviewKey) =>
  collection(db, 'users', reviewerUid, 'ratings', String(reviewKey), 'comments');

// Returns the new comment's ID so callers can show it immediately (and reply to it).
// movieInfo: { id, title, mediaType } — used for the notification's link.
export const addComment = async (reviewerUid, reviewKey, text, author, movieInfo = {}, parent = null) => {
  const ref = await addDoc(commentsCollection(reviewerUid, reviewKey), {
    text,
    uid: author.uid,
    username: author.username || 'Anonymous',
    parentId: parent?.id || null,
    createdAt: Date.now(),
  });

  const notifyUid = parent ? parent.uid : reviewerUid;
  addNotification(notifyUid, {
    type: parent ? 'reply' : 'comment',
    fromUid: author.uid,
    fromUsername: author.username || 'Anonymous',
    movieId: movieInfo.id,
    movieTitle: movieInfo.title || '',
    mediaType: movieInfo.mediaType || 'movie',
    text,
  }).catch((err) => console.error('Failed to create notification:', err));

  return ref.id;
};

export const getComments = async (reviewerUid, reviewKey) => {
  const snap = await getDocs(commentsCollection(reviewerUid, reviewKey));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.createdAt - b.createdAt);
};

// ---- Likes on a review: users/{reviewerUid}/ratings/{reviewKey}/likes/{likerUid} ----
// Doc ID is the liker's own uid, so "have I liked this" is a single getDoc,
// and a user can only ever create/delete their own like (enforced in rules).

const likeDoc = (reviewerUid, reviewKey, likerUid) =>
  doc(db, 'users', reviewerUid, 'ratings', String(reviewKey), 'likes', likerUid);

export const getLikes = async (reviewerUid, reviewKey) => {
  const snap = await getDocs(collection(db, 'users', reviewerUid, 'ratings', String(reviewKey), 'likes'));
  return snap.docs.map((d) => d.id); // array of uids who liked it
};

// Toggles the current user's like on a review, returns the new liked state.
// movieInfo: { id, title, mediaType } — used for the notification's link.
export const toggleLike = async (reviewerUid, reviewKey, likerUid, likerUsername, movieInfo = {}) => {
  const ref = likeDoc(reviewerUid, reviewKey, likerUid);
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
    movieId: movieInfo.id,
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

// Real-time version — fires the callback immediately with current data, then
// again every time a notification is added/changed, no refresh needed.
// Returns an unsubscribe function; call it on cleanup (e.g. in useEffect).
export const watchNotifications = (uid, onChange) =>
  onSnapshot(
    notificationsCollection(uid),
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt - a.createdAt);
      onChange(list);
    },
    (err) => console.error('Notifications listener error:', err)
  );

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
// users/{uid}/customLists/{listId}/items/{itemKey}   (itemKey = `${mediaType}-${tmdbId}`)
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

const customItemRef = (uid, listId) => (key) =>
  doc(db, 'users', uid, 'customLists', listId, 'items', String(key));

export const addToCustomList = async (uid, listId, item) => {
  const { ref } = await locate(customItemRef(uid, listId), mediaTypeOf(item), item.id);
  await setDoc(ref, itemFields(item));
};

export const removeFromCustomList = async (uid, listId, mediaType, movieId) => {
  const { ref } = await locate(customItemRef(uid, listId), mediaType, movieId);
  await deleteDoc(ref);
};

export const getCustomListItems = async (uid, listId) => {
  const snap = await getDocs(collection(db, 'users', uid, 'customLists', listId, 'items'));
  return snap.docs.map((d) => ({ ...d.data(), key: d.id }));
};

export const isInCustomList = async (uid, listId, mediaType, movieId) => {
  const { snap } = await locate(customItemRef(uid, listId), mediaType, movieId);
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