import { Link } from 'react-router-dom';
import InfoPage, { Section } from '../../components/InfoPage';

export default function Terms() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle="The ground rules for using CineLookUp."
      updated="October 2026"
    >
      <Section title="Using the site">
        <p>CineLookUp is a place to discover movies and TV, track what you want to watch, and share ratings and reviews. By creating an account or using the site you agree to these terms.</p>
        <p>You are responsible for your account and for keeping your password secure.</p>
      </Section>

      <Section title="Your content">
        <p>You keep ownership of the reviews and comments you write. By posting them you allow CineLookUp to display them to other users on the site.</p>
      </Section>

      <Section title="Community rules">
        <p>Be respectful. Do not post harassment, hate speech, spam, illegal content, or content that exposes other people's private information. We may remove content or suspend accounts that break these rules.</p>
        <p>Please mark or avoid spoilers where you can, and do not attempt to disrupt or abuse the service.</p>
      </Section>

      <Section title="Movie data and attribution">
        <p>Movie and TV information and images come from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB. Availability and accuracy of that data are not guaranteed.</p>
      </Section>

      <Section title="Availability and liability">
        <p>The service is provided "as is", without warranties. We may change or discontinue features at any time, and we are not liable for losses resulting from use of the site.</p>
      </Section>

      <Section title="Ending your account">
        <p>You can delete your account at any time from <Link to="/settings" className="text-crimson-400 hover:underline">Settings</Link>. Deletion is permanent.</p>
      </Section>

      <Section title="Questions">
        <p>Reach us through the <Link to="/contact" className="text-crimson-400 hover:underline">contact page</Link>.</p>
      </Section>
    </InfoPage>
  );
}