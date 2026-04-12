// pages/_app.js
import Link from "next/link";
import "../styles/globals.css";
import { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="site-shell flex flex-col min-h-screen">
      <header className="site-header py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold site-logo-link">
            <img
              src="/favicon.ico"
              alt="Yo Mama Jokes Central"
              className="w-[70px] h-[70px]"
            />
          </Link>
          <nav className="site-nav space-x-6">
            <Link href="/" className="site-nav-link">
              Home
            </Link>
            <Link href="/categories" className="site-nav-link">
              Categories
            </Link>
            <a
              href="mailto:yomamajokescentral.contact@proton.me"
              className="site-nav-link"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="site-main mt-8 flex-grow">
        <Component {...pageProps} />
      </main>

      <footer className="site-footer py-8 mt-16 text-center">
        <p className="site-footer-text">
          &copy; {new Date().getFullYear()} Yo Mama Jokes Central. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default MyApp;
