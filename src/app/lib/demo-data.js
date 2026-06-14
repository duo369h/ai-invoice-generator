// Static demo and sandbox data for Freelancer Business OS
// Used for /card/demo and local guest/sandbox dashboard previews

export const DEMO_PROFILES = [
  {
    id: "cp_demo123",
    user_id: "usr_demo123",
    username: "demo",
    name: "Alex Morgan",
    title: "Senior Product Designer & Developer",
    bio: "I design and build high-performance web applications and digital interfaces. Specializing in SaaS design, Next.js engineering, and complex interactive dashboard components.",
    tags: ["React", "UI/UX Design", "Next.js", "TailwindCSS", "Node.js"],
    services: [
      {
        id: "srv_1",
        name: "SaaS Platform Design & Prototyping",
        description: "End-to-end UX research, wireframing, and interactive design in Figma, optimized for developer handoff.",
        rate_type: "fixed",
        rate_amount: 3500
      },
      {
        id: "srv_2",
        name: "Front-End Development (React/Next.js)",
        description: "High fidelity frontend engineering with smooth transitions and production-ready clean JSX code.",
        rate_type: "hourly",
        rate_amount: 120
      }
    ],
    portfolio: [
      {
        title: "Stripe/Linear Redesign Concept",
        description: "Visual redesign showcasing calm SaaS themes and glassmorphic dashboards.",
        link: "https://example.com/stripe-redesign"
      },
      {
        title: "Growth Forest Web App",
        description: "AI-driven school communication platform build using Next.js 16.",
        link: "https://example.com/growth-forest"
      }
    ],
    contact_email: "demo@example.com",
    contact_phone: "+1 (555) 019-2834",
    social_links: {
      twitter: "alex_design",
      linkedin: "alex-morgan-ux",
      github: "alexmorgan",
      website: "https://alexmorgan.design"
    },
    created_at: "2026-06-13T22:00:00Z",
    updated_at: "2026-06-13T22:00:00Z"
  },
  {
    id: "cp_sarahdesign",
    user_id: "usr_sarahdesign",
    username: "sarahdesign",
    name: "Sarah Jenkins",
    title: "Brand Designer & Illustrator",
    bio: "Crafting beautiful, memorable brand identities and custom digital illustrations for high-growth startups across North America.",
    tags: ["Branding", "Vector Illustration", "Figma", "Logo Design"],
    services: [
      {
        id: "srv_s1",
        name: "Complete Brand Identity Package",
        description: "Includes custom logo files, dynamic color systems, style guide PDF, and presentation deck templates.",
        rate_type: "fixed",
        rate_amount: 2800
      }
    ],
    portfolio: [
      {
        title: "Acme Corp Brand Overhaul",
        description: "Complete visual guide and typography revamp.",
        link: "https://example.com/acme"
      }
    ],
    contact_email: "sarah@designstudio.co",
    social_links: {
      twitter: "sarah_illustrates",
      linkedin: "sarah-jenkins-brand"
    },
    created_at: "2026-06-13T22:00:00Z",
    updated_at: "2026-06-13T22:00:00Z"
  },
  {
    id: "cp_alexdev",
    user_id: "usr_alexdev",
    username: "alexdev",
    name: "Alex Rivera",
    title: "Full-Stack Web Engineer",
    bio: "Building robust Node.js backends and responsive React frontend systems. Expert in database modeling and third-party integrations.",
    tags: ["Node.js", "Express", "PostgreSQL", "React", "GraphQL"],
    services: [
      {
        id: "srv_a1",
        name: "Custom API & Integration Sprint",
        description: "Designing database structures, secure endpoints, and integrating payment or notification APIs.",
        rate_type: "fixed",
        rate_amount: 4000
      }
    ],
    portfolio: [
      {
        title: "SaaS Payment Controller",
        description: "Robust recurring subscription system integration.",
        link: "https://example.com/saas-payment"
      }
    ],
    contact_email: "alex@riveratech.com",
    social_links: {
      github: "alexrivera-dev"
    },
    created_at: "2026-06-13T22:00:00Z",
    updated_at: "2026-06-13T22:00:00Z"
  }
];

export const DEMO_LEADS = [
  {
    id: "lead_1",
    card_profile_id: "cp_demo123",
    freelancer_id: "usr_demo123",
    name: "Bruce Wayne",
    email: "bruce@waynecorp.com",
    message: "Hey Alex, we need a flat-fee design package for a new security dashboard project we are launching in Q3. Budget is around $5000.",
    status: "new",
    visitor_ip: "127.0.0.1",
    source_utm: {
      utm_source: "twitter",
      utm_medium: "social"
    },
    created_at: "2026-06-14T02:10:00.000Z",
    updated_at: "2026-06-14T02:10:00.000Z"
  },
  {
    id: "lead_2",
    card_profile_id: "cp_demo123",
    freelancer_id: "usr_demo123",
    name: "Tony Stark",
    email: "tony@stark.com",
    message: "Need hourly React consultation for our Arc Reactor dashboard interface. We want to bill 15 hours next week.",
    status: "contacted",
    visitor_ip: "192.168.1.1",
    source_utm: {
      utm_source: "linkedin"
    },
    created_at: "2026-06-14T01:15:00.000Z",
    updated_at: "2026-06-14T01:15:00.000Z"
  }
];

export const DEMO_QUOTES = [
  {
    id: "quote_1",
    user_id: "usr_demo123",
    quote_number: "QT-001",
    client_name: "Wayne Enterprises",
    client_email: "bruce@waynecorp.com",
    client_address: "1007 Mountain Drive, Gotham City",
    items: [
      {
        description: "Custom Security Dashboard UX Research & Interactive Prototyping",
        quantity: 1,
        unit_price: 500000
      }
    ],
    subtotal: 500000,
    discount_rate: 0,
    discount_amount: 0,
    tax_rate: 5,
    tax_amount: 25000,
    total: 525000,
    currency: "USD",
    notes: "Thank you for inviting me to quote. This estimate is valid for 30 days.",
    status: "sent",
    created_at: "2026-06-14T03:00:00.000Z",
    updated_at: "2026-06-14T03:00:00.000Z"
  }
];

export const DEMO_INVOICES = [
  {
    id: "inv_8w459xwzwes",
    user_id: "usr_demo123",
    object: "invoice",
    doc_type: "receipt",
    invoice_number: "WAYNE",
    status: "paid",
    client_name: "Valued Client",
    client_email: "bruce@waynecorp.com",
    client_address: "",
    business_name: "Alex Morgan Design",
    business_email: "demo@example.com",
    business_address: "",
    logo_url: "",
    currency: "usd",
    items: [
      {
        description: "Advisory hours and batmobile adjustments",
        quantity: 1,
        unit_price: 200,
        amount: 200
      }
    ],
    subtotal: 200,
    discount_rate: 0,
    discount_amount: 0,
    tax_rate: 0,
    tax_amount: 0,
    total: 200,
    invoice_date: "2026-06-11",
    due_date: "2026-07-11",
    payment_terms: "Net 30",
    notes: "",
    pdf_url: "/dashboard/print?id=sawl5mh64e",
    created_at: "2026-06-11T18:22:14.567Z"
  }
];
