import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons'; // Import Instagram and TikTok icons

interface SocialShareButtonsProps {
  jokeText: string;
  jokeUrl: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ jokeText, jokeUrl }) => {
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(jokeText)}&url=${encodeURIComponent(jokeUrl)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jokeUrl)}`;
  const instagramShareUrl = `https://www.instagram.com/?url=${encodeURIComponent(jokeUrl)}`; // Basic Instagram share (might need more customization)
  const tiktokShareUrl = `https://www.tiktok.com/upload?text=${encodeURIComponent(jokeText)}&url=${encodeURIComponent(jokeUrl)}`; // Basic TikTok share (might need more customization)

  return (
    <div className="w-full content-between space-x-3"> {/* More compact spacing */}
      <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="social-icon-button facebook-button text-blue-700 hover:text-blue-900 transition-colors duration-200">
        <FontAwesomeIcon icon={faFacebook} size="lg" />
        <span className="sr-only">Share on Facebook</span>
      </a>
      <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="social-icon-button twitter-button text-brand-DEFAULT hover:text-brand-dark transition-colors duration-200">
        <FontAwesomeIcon icon={faXTwitter} size="lg" />
        <span className="sr-only">Share on Twitter</span>
      </a>
      <a href={instagramShareUrl} target="_blank" rel="noopener noreferrer" className="social-icon-button instagram-button text-pink-500 hover:text-pink-700 transition-colors duration-200"> {/* Instagram color */}
        <FontAwesomeIcon icon={faInstagram} size="lg" />
        <span className="sr-only">Share on Instagram</span>
      </a>
      <a href={tiktokShareUrl} target="_blank" rel="noopener noreferrer" className="social-icon-button tiktok-button text-neutral-700 hover:text-neutral-900 transition-colors duration-200"> {/* TikTok - neutral color */}
        <FontAwesomeIcon icon={faTiktok} size="lg" />
        <span className="sr-only">Share on TikTok</span>
      </a>
    </div>
  );
};

export default SocialShareButtons;