import React from 'react';
import Head from 'next/head'; // Import Head for metadata
import AdSenseAd from '@/components/AdSenseAd';
import getDailyRandomJokes from '@/services/dailyJokesPicker';
import JokeCard from '@/components/JokeCard';
import Link from 'next/link';


interface HomePageProps {
  categories: { slug: string; name: string }[];
}


const featuredJokes = getDailyRandomJokes()

const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Yo Mama Jokes - Hilarious Jokes for Everyone</title>
        <meta name="description" content="The funniest Yo Mama Jokes online! Get your daily dose of hilarious insults and witty comebacks. Browse categories or enjoy our featured jokes of the day." />
      </Head>

      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome To Yo Mama Jokes</h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          Get ready to laugh with the funniest Yo Mama Jokes online!  Enjoy our daily selection of 5 hilarious jokes, or browse hundreds more in our categories.  Find the perfect joke to share with friends!
        </p>


        <div className="space-y-6">
          {featuredJokes.map(({ category, joke }) => (
            <JokeCard key={joke} jokeText={joke} categorySlug={category} />
          ))}
        </div>

        <Link href="/categories" className="bg-blue-400 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT focus:ring-opacity-50 transition-colors duration-200">
          See More Jokes
        </Link>


      </div>
    </div>
  );
};


export default HomePage;