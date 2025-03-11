import { GoogleAnalytics } from "@next/third-parties/google";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <GoogleAnalytics gaId="G-L8P7J1TJSY" />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
