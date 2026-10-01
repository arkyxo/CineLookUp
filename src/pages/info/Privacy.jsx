import { Link } from 'react-router-dom';
import InfoPage, { Section } from '../../components/InfoPage';

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="What CineLookUp collects, why, and the control you have over it."
      updated="October 2026"
    >
      <Section title="Information we collect">
        <p>When you create an account we store your email address and a username. Passwords are handled by Firebase Authentication and are never visible to us.</p>
        <p>As you use the site we store what you create: your watchlist, private collection, custom lists, ratings, reviews, comments and likes, and the notifications those generate.</p>
      </Section>

      <Section title="How we use it">
        <p>Your data powers the features you see: your lists, your stats, your public profile and the reviews you post. We use your email only for account purposes such as sign-in and password resets.</p>
      </Section>

      <Section title="What is public and what is private">
        <p>Reviews, comments, likes and your username are visible to other signed-in users. Your email address is not shown on your public profile. Your private collection is meant for you only.</p>
      </Section>

      <Section title="Third-party services">
        <p>CineLookUp uses Google Firebase for authentication and data storage, and The Movie Database (TMDB) for movie and TV information and images. This product uses the TMDB API but is not endorsed or certified by TMDB. These providers have their own privacy policies.</p>
        <p>We also save a small cache of movie data in your browser's local storage to speed up loading, along with your light/dark theme preference.</p>
      </Section>

      <Section title="Your choices">
        <p>You can change your username or password, and permanently delete your account along with your watchlist, lists and ratings, from <Link to="/settings" className="text-crimson-400 hover:underline">Settings</Link>.</p>
        <p>Questions about your data? <Link to="/contact" className="text-crimson-400 hover:underline">Contact us</Link>.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If we change how we handle data, we will update this page and the date above.</p>
      </Section>
    </InfoPage>
  );
}