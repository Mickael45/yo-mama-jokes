// pages/_app.js
import Link from "next/link";
import "../styles/globals.css";
import { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#f9f7f3] py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold">
            <img
              src="/favicon.ico"
              alt="Yo Mama Jokes Central"
              className="w-[70px] h-[70px]"
            />
          </Link>
          <nav className="space-x-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-gray-900"
            >
              Categories
            </Link>
            <a
              href="mailto:yomamajokescentral.contact@proton.me"
              className="text-gray-700 hover:text-gray-900"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="mt-8 flex-grow">
        <Component {...pageProps} />
      </main>

      <footer className="bg-[#f9f7f3] py-8 mt-16 text-center text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Yo Mama Jokes Central. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default MyApp;
