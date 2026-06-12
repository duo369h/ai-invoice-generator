"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getSupportEmail } from "../lib/config";


export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // MVP: Just show success message (no backend email service yet)
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="navbar">
        <div className="logo-container">
          <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">InvoiceAI</Link>
        </div>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      {/* Content */}
      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "700px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <span className="badge" style={{ marginBottom: "16px" }}>Get in Touch</span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px", letterSpacing: "-1px" }}>
            Contact Us
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "0.95rem" }}>
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
          </p>

          {/* Contact Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px" }}>
            <div className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📧</div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "4px" }}>Email</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{getSupportEmail()}</p>
            </div>
            <div className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🌐</div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "4px" }}>Social</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>@invoiceai on X</p>
            </div>
          </div>

          {/* Contact Form */}
          {submitted ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
                Message Sent!
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}
                className="btn btn-secondary"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="card" style={{ padding: "28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="contact-name">Your Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="contact-email">Your Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    className="form-input"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="form-textarea"
                    placeholder="Tell us more about your question or feedback..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    style={{ minHeight: "140px" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                  Send Message
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/contact" style={{ color: "var(--primary)" }}>Contact</Link>
        </div>
        <p style={{ marginTop: "12px" }}>© 2026 InvoiceAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
