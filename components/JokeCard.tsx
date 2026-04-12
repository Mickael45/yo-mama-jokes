import React from 'react';
import SocialShareButtons from './SocialShareButtons';
import Link from 'next/link';

interface JokeCardProps {
  jokeText: string;
  categorySlug: string;
  categoryName?: string; // Optional: If you want to pass the full category name separately
}

const JokeCard: React.FC<JokeCardProps> = ({ jokeText, categorySlug, categoryName }) => {
  const jokeUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/jokes/${categorySlug}`;
  const displayCategoryName = categoryName || categorySlug.replace(/-/g, ' ').toUpperCase(); // Fallback to slug if name not provided

  return (
    <div className="joke-card">
      <div className="joke-card__body">
        <h2 className="joke-card__title">
          <Link href={`/jokes/${categorySlug}`}>
            {displayCategoryName}
          </Link>
        </h2>
        <p className="joke-card__text">{jokeText}</p>
      </div>
      <div className="joke-card__footer">
        <SocialShareButtons jokeText={jokeText} jokeUrl={jokeUrl} />
      </div>
    </div>
  );
};


export default JokeCard;