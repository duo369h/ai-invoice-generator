import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Freelance Pricing Guide — Hourly vs Fixed Project Rates',
  description: 'Learn how to price your freelance services. Compare hourly rates versus value-based fixed project quotes to optimize your business earnings.',
  keywords: ['freelance pricing guide', 'hourly rate vs fixed price', 'freelancer pricing strategy', 'value based pricing', 'freelance rates calculator'],
};

export default function PricingGuide() {
  const faqItems = [
    {
      question: 'When should I charge an hourly rate?',
      answer: 'Hourly rates are best for projects with ambiguous scope, client consultation, ongoing support, or projects where the timeline is dictated entirely by client feedback speed.'
    },
    {
      question: 'Why is fixed pricing often more profitable?',
      answer: 'With fixed project pricing, as you become faster and more efficient at your work, your effective hourly rate increases. It rewards expertise and results, not just hours logged.'
    },
    {
      question: 'How do I pitch value-based pricing to a client?',
      answer: 'Focus on the client’s business goals (e.g. increase conversion by 20%, automate a manual workflow saving 10 hours a week) rather than listing your execution tasks.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        Determining how much to charge is the single most important decision you make as an independent business owner. Setting rates too low hurts your financial stability, while overpricing without demonstrating value leads to lost proposals.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Hourly Pricing Structure</h3>
      <p style={{ marginBottom: '16px' }}>
        Charging by the hour is simple to understand and low-risk for freelancers. You get paid for every hour you sit at your desk.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Pros:</strong> Guaranteed pay for all hours worked. Highly flexible for loose scopes.</li>
        <li><strong>Cons:</strong> Puts a hard ceiling on your income. As you get faster and more experienced, you are penalized with lower pay.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Fixed Project Pricing (Value-Based)</h3>
      <p style={{ marginBottom: '16px' }}>
        Fixed pricing charges a set amount for a defined set of deliverables (e.g., &quot;$4,500 for a SaaS Web Application&quot;).
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Pros:</strong> Uncapped earnings. Rewarding efficiency and quality output. Clients appreciate cost predictability.</li>
        <li><strong>Cons:</strong> High risk if scope creep occurs or deliverables are poorly defined.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>3. Pricing Framework Rule of Thumb</h3>
      <p style={{ marginBottom: '20px' }}>
        Use a **hybrid model**: charge a premium flat fee for standard deliverables (like initial design and deployment), and bill an hourly rate for subsequent revisions, strategy consultation, or ongoing support tasks.
      </p>
    </div>
  );

  return (
    <SeoPageLayout
      title="Freelance Pricing Guide"
      subtitle="Mastering hourly consultation billing versus fixed-rate project quotes, value-based proposals, and contract alignment."
      ctaText="Plan Your Services"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
