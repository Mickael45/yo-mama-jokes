import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Nunito:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <meta
          name="google-site-verification"
          content="5LWdds1LtKAg7v_mojIG0FRYVWNkL8FIF3Q1f5ZT0n4"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
