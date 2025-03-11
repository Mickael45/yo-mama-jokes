// pages/_app.js
import Link from "next/link";
import "../styles/globals.css";
import { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <div className="flex flex-col min-h-screen">
    <header className="bg-neutral-100 border-b border-neutral-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary-600">
          Yo Mama Jokes Central
        </Link>
        <nav className="space-x-6">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <Link href="/categories" className="text-gray-700 hover:text-gray-900">
            Categories
          </Link>
        </nav>
      </div>
    </header>

    <main className="mt-8 flex-grow">
      <Component {...pageProps} />
    </main>

    <footer className="bg-neutral-100 border-t border-neutral-200 py-8 mt-16 text-center text-gray-500">
      <p>&copy; {new Date().getFullYear()} Yo Mama Jokes. All rights reserved.</p>
    </footer>
  </div>
}

export default MyApp