import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails, imageUrl } from '../lib/tmdb';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Person() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    getPersonDetails(id).then(setPerson);
    window.scrollTo(0, 0);
  }, [id]);

  if (!person) return <LoadingSpinner />;

  const credits = (person.combined_credits?.cast || [])
    .filter((c) => c.poster_path)
    .sort((a, b) => new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0));

  const knownFor = [...credits].sort((a, b) => b.popularity - a.popularity).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <img
          src={imageUrl(person.profile_path, 'w342')}
          alt={person.name}
          className="w-48 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/10"
        />
        <div className="flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-crimson-500">
            {person.known_for_department || 'Actor'}
          </p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{person.name}</h1>
          {person.birthday && (
            <p className="mt-2 text-sm text-white/50">
              Born {new Date(person.birthday).toLocaleDateString()}
              {person.place_of_birth ? ` · ${person.place_of_birth}` : ''}
            </p>
          )}
          {person.biography && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
              {person.biography.length > 600 ? `${person.biography.slice(0, 600)}…` : person.biography}
            </p>
          )}

          {knownFor.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Known For</p>
              <div className="flex flex-wrap gap-3">
                {knownFor.map((c) => (
                  <div
                    key={c.id}
                    className="w-24 cursor-pointer"
                    onClick={() => navigate(`/${c.media_type}/${c.id}`)}
                  >
                    <div className="aspect-[2/3] overflow-hidden rounded-lg bg-base-800">
                      <img src={imageUrl(c.poster_path, 'w185')} alt="" className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs">{c.title || c.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {credits.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Filmography</h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6">
            {credits.map((c) => (
              <div
                key={`${c.credit_id}`}
                className="cursor-pointer"
                onClick={() => navigate(`/${c.media_type}/${c.id}`)}
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-base-800">
                  <img src={imageUrl(c.poster_path, 'w185')} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{c.title || c.name}</p>
                <p className="text-[11px] text-white/40">
                  {(c.release_date || c.first_air_date || '').slice(0, 4)} · {c.character}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
