import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";
import "./styles/components.css";
import "./styles/layouts.css";
import { getSiteUrl } from "./lib/config";
import AnalyticsProvider from "./components/AnalyticsProvider";
import BetaGrowthShell from "./components/BetaGrowthShell";
import DevDebugOverlay from "../components/DevDebugOverlay";
import { UI_GATE } from "../core/ui/runtime/UI_GATE";

const siteUrl = getSiteUrl();

export const metadata = {
  title: {
    default: "Corvioz | Create Quotes, Send Invoices & Get Paid",
    template: "%s | Corvioz",
  },
  description:
    "Corvioz helps freelancers create quotes, send professional invoices, manage clients, and get paid faster.",
  keywords: [
    "corvioz business os",
    "freelance operating system",
    "freelance quote generator",
    "invoice creator",
    "invoice generator",
    "quote generator",
    "client portal",
    "payment status"
  ],
  authors: [{ name: "Corvioz Team" }],
  creator: "Corvioz",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteUrl}/rss.xml`,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: "Corvioz | Create Quotes, Send Invoices & Get Paid",
    description:
      "Corvioz helps freelancers create quotes, send professional invoices, manage clients, and get paid faster.",
    url: siteUrl,
    siteName: "Corvioz",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Corvioz dashboard preview',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvioz | Create Quotes, Send Invoices & Get Paid",
    description:
      "Corvioz helps freelancers create quotes, send professional invoices, manage clients, and get paid faster.",
    images: ['/twitter-image.png'],
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
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const safeTree = UI_GATE(children);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('theme') || 'light';
              var theme = 'light';
              if (savedTheme === 'dark') {
                theme = 'dark';
              } else {
                theme = 'light';
              }
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })();
        `}} />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            if (typeof window === 'undefined') return;
            window.__CORVIOZ_ERRORS__ = window.__CORVIOZ_ERRORS__ || [];
            
            window.addEventListener('error', function(event) {
              window.__CORVIOZ_ERRORS__.push({
                type: 'exception',
                message: event.message || (event.error && event.error.message) || 'Uncaught error',
                filename: event.filename || '',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                error: event.error ? {
                  message: event.error.message,
                  stack: event.error.stack
                } : null,
                timestamp: new Date().toISOString()
              });
            });

            window.addEventListener('unhandledrejection', function(event) {
              var reason = event.reason;
              window.__CORVIOZ_ERRORS__.push({
                type: 'unhandledrejection',
                message: (reason && reason.message) || String(reason),
                error: reason && reason.stack ? {
                  message: reason.message,
                  stack: reason.stack
                } : null,
                timestamp: new Date().toISOString()
              });
            });

            var originalConsoleError = console.error;
            console.error = function() {
              var args = Array.prototype.slice.call(arguments);
              var message = args.map(function(arg) {
                if (arg instanceof Error) return arg.message + '\\n' + arg.stack;
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');

              var isHydrationError = /hydration/i.test(message) || 
                                     /did not match/i.test(message) || 
                                     /Text content/i.test(message) ||
                                     /Prop .* did not match/i.test(message) ||
                                     /React will try to recreate/i.test(message);

              if (isHydrationError) {
                window.__CORVIOZ_ERRORS__.push({
                  type: 'hydration',
                  message: message,
                  timestamp: new Date().toISOString()
                });
              } else {
                window.__CORVIOZ_ERRORS__.push({
                  type: 'console_error',
                  message: message,
                  timestamp: new Date().toISOString()
                });
              }
              originalConsoleError.apply(console, arguments);
            };

            var originalFetch = window.fetch;
            window.fetch = function() {
              var args = arguments;
              var url = args[0];
              return originalFetch.apply(this, arguments)
                .then(function(response) {
                  if (!response.ok) {
                    window.__CORVIOZ_ERRORS__.push({
                      type: 'fetch_failed',
                      url: typeof url === 'string' ? url : (url && url.url) || String(url),
                      status: response.status,
                      statusText: response.statusText,
                      timestamp: new Date().toISOString()
                    });
                  }
                  return response;
                })
                .catch(function(error) {
                  window.__CORVIOZ_ERRORS__.push({
                    type: 'fetch_network_error',
                    url: typeof url === 'string' ? url : (url && url.url) || String(url),
                    message: error.message || String(error),
                    timestamp: new Date().toISOString()
                  });
                  throw error;
                });
            };
          })();
        `}} />
        {clarityId && (
          <script dangerouslySetInnerHTML={{__html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarityId}");
          `}}></script>
        )}

        <AnalyticsProvider>
          <BetaGrowthShell>
            {safeTree}
            <DevDebugOverlay />
          </BetaGrowthShell>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
