/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 4,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 1000,
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth',
        permanent: true,
      },
      {
        source: '/tools/invoice-generator',
        destination: '/invoice-generator',
        permanent: true,
      },
      {
        source: '/tools/quote-generator',
        destination: '/quote-generator',
        permanent: true,
      },
      {
        source: '/ai-invoice-generator',
        destination: '/invoice-generator',
        permanent: true,
      },
      {
        source: '/ai-quote-generator',
        destination: '/quote-generator',
        permanent: true,
      },
      {
        source: '/freelance-pricing-guide',
        destination: '/blog/how-to-price-web-design-projects',
        permanent: true,
      },
      {
        source: '/how-to-get-paid-faster-as-freelancer',
        destination: '/blog/best-invoice-software-for-freelancers',
        permanent: true,
      },
      {
        source: '/how-to-invoice-clients-as-freelancer',
        destination: '/blog/invoice-vs-quote-vs-receipt',
        permanent: true,
      },
      {
        source: '/invoice-vs-quote-vs-receipt',
        destination: '/blog/invoice-vs-quote-vs-receipt',
        permanent: true,
      },
      {
        source: '/invoice-template-for-developer',
        destination: '/invoice-template/developer',
        permanent: true,
      },
      {
        source: '/invoice-template-for-consultant',
        destination: '/invoice-template/consultant',
        permanent: true,
      },
      {
        source: '/invoice-template-for-designer',
        destination: '/invoice-template/graphic-designer',
        permanent: true,
      },
      {
        source: '/invoice-template-for-freelancer',
        destination: '/invoice-generator',
        permanent: true,
      },
      {
        source: '/invoice-template-for-agency',
        destination: '/invoice-generator',
        permanent: true,
      },
      {
        source: '/quote-template/photographer',
        destination: '/photographer-quote-template',
        permanent: true,
      },
      {
        source: '/invoice-template/photographer',
        destination: '/photographer-invoice-template',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
