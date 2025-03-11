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
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"> {/* Rounded corners, shadow, overflow hidden for visual appeal */}
      <div className="px-6 py-5"> {/* Padding inside the card content area */}
        <h2 className="font-bold text-xl text-brand-DEFAULT mb-3 hover:text-brand-dark transition-colors duration-200"> {/* Category Link Title */}
          <Link href={`/jokes/${categorySlug}`}>
            {displayCategoryName}
          </Link>
        </h2>
        <p className="text-gray-800 text-lg leading-relaxed mb-5">{jokeText}</p> {/* Joke Text */}
      </div>
      <div className="bg-neutral-100 px-6 py-4 border-t border-neutral-200 flex"> {/* Footer with Share Buttons */}
        <SocialShareButtons jokeText={jokeText} jokeUrl={jokeUrl} />
      </div>
    </div>
  );
};


export default JokeCard;