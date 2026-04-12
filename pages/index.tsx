import React from 'react';
import Head from 'next/head'; // Import Head for metadata
import getDailyRandomJokes from '@/services/dailyJokesPicker';
import JokeCard from '@/components/JokeCard';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';


interface HomePageProps {
  categories: { slug: string; name: string }[];
}


const featuredJokes = getDailyRandomJokes()

const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="site-page container mx-auto px-4 py-8">
      <Head>
        <title>Yo Mama Jokes Central - Hilarious Jokes for Everyone</title>
        <meta name="description" content="The funniest Yo Mama Jokes online! Get your daily dose of hilarious insults and witty comebacks. Browse categories or enjoy our featured jokes of the day." />
      </Head>
      <GoogleAnalytics gaId="G-L8P7J1TJSY" />

      <div className="site-inner site-inner--center">
        <h1 className="site-title">Welcome To Yo Mama Jokes Central</h1>
        <p className="site-lede">
          Get ready to laugh with the funniest Yo Mama Jokes online!  Enjoy our daily selection of 5 hilarious jokes, or browse hundreds more in our categories.  Find the perfect joke to share with friends!
        </p>

        <div className="site-feed">
          {featuredJokes.map(({ category, joke }) => (
            <JokeCard key={joke} jokeText={joke} categorySlug={category} />
          ))}
        </div>

        <Link href="/categories" className="site-primary-btn">
          See More Jokes
        </Link>
      </div>
    </div>
  );
};


export default HomePage;