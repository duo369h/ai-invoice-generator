import HomeHeader from './home/HomeHeader';
import HomeHero from './home/HomeHero';
import HomeWorkflow from './home/HomeWorkflow';
import HomeWhy from './home/HomeWhy';
import HomeForPhotographers from './home/HomeForPhotographers';
import HomePricing from './home/HomePricing';
import HomeResources from './home/HomeResources';
import HomeFaq from './home/HomeFaq';
import { HOME_FAQ } from './home/homeFaqData';
import HomeFounderTrust from './home/HomeFounderTrust';
import HomeFinalCta from './home/HomeFinalCta';
import HomeFooter from './home/HomeFooter';
import HomeTelemetry from './home/HomeTelemetry';
import HomeBodyReveal from './home/HomeBodyReveal';
import styles from './home/home-01.module.css';

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const FAQ_SCHEMA_JSON = JSON.stringify(FAQ_SCHEMA).replace(/</g, '\\u003c');

export default function Home() {
  return (
    <div className={styles.home01}>
      <HomeTelemetry />
      <HomeBodyReveal />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA_JSON }}
      />
      <HomeHeader />
      <HomeHero />
      <HomeWorkflow />
      <HomeWhy />
      <HomeForPhotographers />
      <HomePricing />
      <HomeResources />
      <HomeFaq />
      <HomeFounderTrust />
      <HomeFinalCta />
      <HomeFooter />
    </div>
  );
}
