import "./globals.css";
import { getSiteUrl } from "./lib/config";
import GlobalFeedbackMenu from "./components/GlobalFeedbackMenu";

const siteUrl = getSiteUrl();

export const metadata = {
  title: {
    default: "Freelancer Business OS — The operating system for modern freelancers",
    template: "%s | Freelancer Business OS",
  },
  description:
    "The operating system for modern freelancers in the US and Canada. Create a public profile, capture client requests, send milestone quotes, and clear payments with zero commission cuts.",
  keywords: [
    "freelancer business os",
    "freelance directory",
    "invoice templates",
    "milestone quotes",
    "client portal crm",
    "payment link checkouts",
    "freelance client intake"
  ],
  authors: [{ name: "Freelancer Business OS Team" }],
  creator: "Freelancer Business OS",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Freelancer Business OS — The operating system for modern freelancers",
    description:
      "Create a public profile, capture client requests, send milestone quotes, and clear payments in one place. Add your custom Stripe, PayPal, or LemonSqueezy billing link.",
    url: siteUrl,
    siteName: "Freelancer Business OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Freelancer Business OS — The operating system for modern freelancers",
    description:
      "The one-stop platform for freelancers to win clients, capture leads, compile proposals, track milestones, and collect payments.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('theme') || 'system';
              var theme = 'light';
              if (savedTheme === 'dark') {
                theme = 'dark';
              } else if (savedTheme === 'light') {
                theme = 'light';
              } else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  theme = 'dark';
                }
              }
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })();
        `}} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script dangerouslySetInnerHTML={{__html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}}></script>
          </>
        )}
        {clarityId && (
          <script dangerouslySetInnerHTML={{__html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarityId}");
          `}}></script>
        )}
      </head>
      <body>
        {children}
        <GlobalFeedbackMenu />
      </body>
    </html>
  );
}
