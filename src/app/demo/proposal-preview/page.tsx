"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DemoProposalPreviewPage() {
  const [aiEnhanced, setAiEnhanced] = useState(false);

  const sampleOriginal = {
    client: "Acme Corp",
    project: "Website Redesign & SEO Optimization",
    scope: "We will redesign your website and do SEO optimization to help you get more traffic. The budget is $5,000.",
    pitch: "I am a skilled web designer with 5 years of experience. I have done many websites like yours. Let me know if you are interested.",
  };

  const sampleEnhanced = {
    client: "Acme Corp",
    project: "AI-Powered Website Redesign & Organic Lead Generation Pipeline",
    scope: "Comprehensive UX/UI overhaul of Acme Corp's website optimized for conversion rates. Plus, setting up a programmatic SEO system targeting high-intent long-tail keywords to increase organic leads by 30-50% in 90 days.",
    pitch: "Having analyzed Acme's current site speed and layout bottlenecks, we propose a Jamstack-based redesign reducing bounce rates by ~25%. I will implement a modern marketing funnel directly within your CMS, backed by automated analytics tracking to prove ROI. Let's convert your traffic into revenue.",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      color: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "16px", background: "linear-gradient(to right, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          See how AI improves your proposal
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
          This is what your client would receive. Standard proposals fail to highlight business value. Our AI transforms your pitch into a client-winning asset.
        </p>
      </div>

      <div style={{
        width: "100%",
        maxWidth: "800px",
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "32px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        marginBottom: "40px"
      }}>
        {/* Toggle Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Live Proposal Demo
            </span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "4px" }}>
              {aiEnhanced ? "🚀 AI-Optimized Version" : "📄 Standard Proposal"}
            </h2>
          </div>
          <button
            onClick={() => setAiEnhanced(!aiEnhanced)}
            style={{
              padding: "10px 20px",
              borderRadius: "9999px",
              background: aiEnhanced ? "#6366f1" : "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            {aiEnhanced ? "View Original Draft" : "Toggle AI Optimization"}
          </button>
        </div>

        {/* Proposal Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Client</label>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "4px" }}>{aiEnhanced ? sampleEnhanced.client : sampleOriginal.client}</p>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Project Target</label>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px", color: aiEnhanced ? "#38bdf8" : "#f8fafc" }}>{aiEnhanced ? sampleEnhanced.project : sampleOriginal.project}</p>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Project Scope</label>
            <p style={{ fontSize: "1rem", lineHeight: "1.6", marginTop: "4px", color: "#cbd5e1" }}>{aiEnhanced ? sampleEnhanced.scope : sampleOriginal.scope}</p>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Professional Pitch</label>
            <p style={{ fontSize: "1rem", lineHeight: "1.6", marginTop: "4px", color: "#cbd5e1", fontStyle: "italic", borderLeft: "3px solid #6366f1", paddingLeft: "16px" }}>
              {aiEnhanced ? sampleEnhanced.pitch : sampleOriginal.pitch}
            </p>
          </div>
        </div>

        {/* How this wins clients */}
        {aiEnhanced && (
          <div style={{
            marginTop: "32px",
            padding: "20px",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "12px",
            fontSize: "0.95rem"
          }}>
            <h4 style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: "8px" }}>How this would win you clients:</h4>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", color: "#cbd5e1" }}>
              <li>Reframes the proposal from a simple redesign to a high-value <strong>revenue generator</strong>.</li>
              <li>Addresses the client's conversion rates, showing deep business understanding.</li>
              <li>Calculates and suggests a clear ROI strategy to justify premium pricing.</li>
            </ul>
          </div>
        )}
      </div>

      {/* CTA Box */}
      <div style={{ textAlign: "center" }}>
        <Link href="/quotes/create?prefill=true" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "16px 32px",
          borderRadius: "12px",
          background: "linear-gradient(to right, #3b82f6, #6366f1)",
          color: "#ffffff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "1.1rem",
          boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.4)",
          transition: "all 0.2s"
        }}>
          Try with your own job →
        </Link>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "12px" }}>
          Free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}
