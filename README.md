# CineStream

A dark, cinematic movie discovery app — TMDb for movie/TV data, Firebase for auth + user data (watchlist, private list, ratings).

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## What's already wired up

- **Data**: `src/lib/tmdb.js` — trending, popular, top rated, now playing, search, genres, movie/TV/person details, trailers.
- **Auth + user data**: `src/lib/firebase.js` — email/password sign up & login, and per-user watchlist / private list / ratings stored in Firestore under `users/{uid}/{watchlist|privateList|ratings}/{itemId}`.
- **Pages**: Home (hero + rows), Search, Movie/TV Details (cast, trailer, watchlist/private list toggles, star rating), Genres (browse + sort), Movies (sort), Actor pages, Watchlist, Private List, Login/Signup, Profile (stats).
- **"Watch Now"** opens the official trailer via TMDb's linked YouTube video — there's no licensed full-length video source, so this app doesn't (and shouldn't) stream actual films.

## Before you deploy: set Firestore security rules

Your Firebase config values aren't secret (they're meant to ship in client code), but your **data** needs rules so one user can't read or edit another user's lists. In the Firebase console → Firestore → Rules, something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Also turn on **Email/Password** sign-in under Firebase Console → Authentication → Sign-in method — it's required for the login/signup pages to work.

## Not built yet (next steps)

- Actor search isn't separated from title search visually — it's currently all under one "People" section on the Search page, which matches the brief.
- No dedicated video-player "watch" page — intentionally, since there's no real video source to play (see note above). If you have licensed content later, I can build that page around it.
- Recommendations ("For You") aren't personalized yet — Home currently shows the same curated rows for everyone.
- Profile editing (avatar/username change) isn't wired up — Settings button is a placeholder.

Tell me which of these to tackle next, or if you want to adjust anything already built (colors, copy, layout).
