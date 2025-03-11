import React from 'react';
import Head from 'next/head';
import Link from "next/link";
import { FAT_MAMA_JOKE_CATEGORY, SCARY_MAMA_JOKE_CATEGORY, NASTY_MAMA_JOKE_CATEGORY, UGLY_MAMA_JOKE_CATEGORY, DUMB_MAMA_JOKE_CATEGORY, AWFUL_MAMA_JOKE_CATEGORY, DIRTY_MAMA_JOKE_CATEGORY, TALL_MAMA_JOKE_CATEGORY, SHORT_MAMA_JOKE_CATEGORY, HAIRY_MAMA_JOKE_CATEGORY, BALD_MAMA_JOKE_CATEGORY, OLD_MAMA_JOKE_CATEGORY, POOR_MAMA_JOKE_CATEGORY, SKINNY_MAMA_JOKE_CATEGORY, CLUMSY_MAMA_JOKE_CATEGORY, EVIL_MAMA_JOKE_CATEGORY, GREEDY_MAMA_JOKE_CATEGORY, LAZY_MAMA_JOKE_CATEGORY, LOUD_MAMA_JOKE_CATEGORY, ENTITLED_MAMA_JOKE_CATEGORY, OTHER_MAMA_JOKE_CATEGORY } from '@/constants';
import { Category } from '@/types';
import { GoogleAnalytics } from '@next/third-parties/google';

export const categories: { name: string, slug: Category }[] = [ // Define your categories here -  consider fetching this dynamically later
    { name: 'Fat', slug: FAT_MAMA_JOKE_CATEGORY },
    { name: 'Scary', slug: SCARY_MAMA_JOKE_CATEGORY },
    { name: 'Nasty', slug: NASTY_MAMA_JOKE_CATEGORY },
    { name: 'Ugly', slug: UGLY_MAMA_JOKE_CATEGORY },
    { name: 'Dumb', slug: DUMB_MAMA_JOKE_CATEGORY },
    { name: 'Awful', slug: AWFUL_MAMA_JOKE_CATEGORY },
    { name: 'Dirty', slug: DIRTY_MAMA_JOKE_CATEGORY },
    { name: 'Tall', slug: TALL_MAMA_JOKE_CATEGORY },
    { name: 'Short', slug: SHORT_MAMA_JOKE_CATEGORY },
    { name: 'Hairy', slug: HAIRY_MAMA_JOKE_CATEGORY },
    { name: 'Bald', slug: BALD_MAMA_JOKE_CATEGORY },
    { name: 'Old', slug: OLD_MAMA_JOKE_CATEGORY },
    { name: 'Poor', slug: POOR_MAMA_JOKE_CATEGORY },
    { name: 'Skinny', slug: SKINNY_MAMA_JOKE_CATEGORY },
    { name: 'Clumsy', slug: CLUMSY_MAMA_JOKE_CATEGORY },
    { name: 'Evil', slug: EVIL_MAMA_JOKE_CATEGORY },
    { name: 'Greedy', slug: GREEDY_MAMA_JOKE_CATEGORY },
    { name: 'Lazy', slug: LAZY_MAMA_JOKE_CATEGORY },
    { name: 'Loud', slug: LOUD_MAMA_JOKE_CATEGORY },
    { name: 'Entitled', slug: ENTITLED_MAMA_JOKE_CATEGORY },
    { name: 'Other', slug: OTHER_MAMA_JOKE_CATEGORY },
];

const Categories = () => <div className="container mx-auto px-4 py-8">
    <Head>
        <title>Joke Categories | Yo Mama Jokes Central</title>
        <meta name="description" content="Explore all Yo Mama Joke Central categories! Find fat jokes, dumb jokes, ugly jokes, and many more. Browse our extensive collection and get ready to laugh." />
    </Head>
    <GoogleAnalytics gaId="G-L8P7J1TJSY" />

    <div className="max-w-5xl mx-auto text-center">

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Yo Mama Joke Categories</h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">Explore our wide range of Yo Mama Joke categories!  From classic insults to specific joke types, find the perfect category to start laughing. Browse all categories below:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto "> {/* Category Grid - more compact */}
            {categories.map((category) => (
                <Link
                    href={`/jokes/${category.slug}`}
                    key={category.slug}
                    className="block bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-neutral-200 text-center" // More compact category links
                >
                    <h3 className="text-lg font-semibold text-primary-600 capitalize">{category.name}</h3> {/* Smaller heading */}
                </Link>
            ))}
        </div>
    </div>
</div>



export default Categories