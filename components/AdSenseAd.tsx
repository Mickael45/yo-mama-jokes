import { useEffect } from 'react';

interface AdSenseAdProps {
  slot: string; // Your AdSense Ad Slot ID
  className?: string; // Optional Tailwind classes for styling
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'; // Ad format
  responsive?: 'true' | 'false'; // Responsive ad?
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ slot, className, format = 'auto', responsive = 'true' }) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') { // Only push ads in production
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }
  }, [slot]);

  if (process.env.NODE_ENV !== 'production') {
    return <div className={`border-dashed border-2 border-neutral-300 bg-neutral-100 p-4 text-center text-sm text-neutral-500 rounded-md ${className}`}>
      [AdSense Ad Placeholder - Production Only] Slot: {slot}
    </div>;
  }


  return (
    <ins className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID} // Your AdSense Client ID in .env.local
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}></ins>
  );
};

export default AdSenseAd;