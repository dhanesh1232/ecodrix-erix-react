// src/components/email/builder/templates/index.ts
// Pre-built starter templates for the email canvas builder.
// Each template is a complete EmailDocument that users can clone and customize.

import type { EmailDocument } from "../types";
import { uid } from "../types";

// ─── Template metadata ────────────────────────────────────────────────────────

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  category: "Marketing" | "Transactional" | "Newsletter";
  thumbnail: string; // color placeholder
  document: EmailDocument;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // ── Welcome Email ──────────────────────────────────────────────────────────
  {
    id: "starter-welcome",
    name: "Welcome Email",
    description: "A warm onboarding email for new users or subscribers.",
    category: "Transactional",
    thumbnail: "#7c3aed",
    document: {
      backgroundColor: "#f1f5f9",
      contentWidth: 600,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      blocks: [
        {
          id: uid(),
          type: "menu",
          content: JSON.stringify([
            { label: "Home", href: "#" },
            { label: "Features", href: "#" },
            { label: "Pricing", href: "#" },
          ]),
          style: {
            backgroundColor: "#7c3aed",
            padding: "14px 24px",
            textAlign: "center",
            color: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "image",
          src: "",
          alt: "Company hero banner",
          style: {
            display: "block",
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#ede9fe",
            minHeight: "180px",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 1,
          content: "Welcome aboard! 🎉",
          style: {
            fontSize: "32px",
            fontWeight: "700",
            color: "#1a202c",
            padding: "32px 32px 8px",
            lineHeight: "1.2",
            textAlign: "center",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "We're thrilled to have you with us. You're now part of a community of thousands of people who trust us every day. Here's what you can expect next.",
          style: {
            fontSize: "16px",
            color: "#4a5568",
            padding: "8px 32px 24px",
            lineHeight: "1.75",
            textAlign: "center",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "list",
          content: JSON.stringify({
            style: "check",
            items: [
              "Access your personalized dashboard",
              "Explore all premium features for free",
              "Connect with our support team anytime",
            ],
          }),
          style: {
            backgroundColor: "#ffffff",
            padding: "0 32px 24px",
            fontSize: "15px",
            color: "#374151",
            lineHeight: "1.75",
          },
        },
        {
          id: uid(),
          type: "button",
          content: "Get Started →",
          href: "https://example.com/dashboard",
          style: {
            display: "block",
            backgroundColor: "#7c3aed",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
            textAlign: "center",
            padding: "16px 36px",
            borderRadius: "8px",
            maxWidth: "220px",
            margin: "0 auto 32px",
          },
        },
        {
          id: uid(),
          type: "divider",
          style: {
            padding: "0 32px",
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderWidth: "1px",
            borderStyle: "solid",
          },
        },
        {
          id: uid(),
          type: "footer",
          content: JSON.stringify({
            copyright: "© 2025 Your Company, Inc. All rights reserved.",
            links: [
              { label: "Unsubscribe", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Help Center", href: "#" },
            ],
          }),
          style: {
            backgroundColor: "#f8fafc",
            padding: "24px 32px",
            textAlign: "center",
          },
        },
      ],
    },
  },

  // ── Promotional Sale ───────────────────────────────────────────────────────
  {
    id: "starter-promo",
    name: "Promotional Sale",
    description:
      "Drive conversions with a bold, high-urgency sale announcement.",
    category: "Marketing",
    thumbnail: "#dc2626",
    document: {
      backgroundColor: "#0f172a",
      contentWidth: 600,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      blocks: [
        {
          id: uid(),
          type: "menu",
          content: JSON.stringify([
            { label: "Shop", href: "#" },
            { label: "Sale", href: "#" },
            { label: "New In", href: "#" },
            { label: "Contact", href: "#" },
          ]),
          style: {
            backgroundColor: "#1e293b",
            padding: "14px 24px",
            textAlign: "center",
            color: "#f1f5f9",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 1,
          content: "🔥 Flash Sale — 40% Off Everything",
          style: {
            fontSize: "30px",
            fontWeight: "800",
            color: "#ffffff",
            padding: "40px 32px 12px",
            lineHeight: "1.2",
            textAlign: "center",
            backgroundColor: "#1e1b4b",
            letterSpacing: "-0.5px",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "This weekend only. Use code <strong>FLASH40</strong> at checkout. Don't miss out — sale ends Sunday at midnight.",
          style: {
            fontSize: "16px",
            color: "#c4b5fd",
            padding: "0 32px 32px",
            lineHeight: "1.7",
            textAlign: "center",
            backgroundColor: "#1e1b4b",
          },
        },
        {
          id: uid(),
          type: "button",
          content: "Shop the Sale →",
          href: "https://example.com/sale",
          style: {
            display: "block",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            fontSize: "17px",
            fontWeight: "700",
            textAlign: "center",
            padding: "18px 40px",
            borderRadius: "8px",
            maxWidth: "240px",
            margin: "0 auto 40px",
            letterSpacing: "0.3px",
          },
        },
        {
          id: uid(),
          type: "twoColumns",
          style: {
            backgroundColor: "#ffffff",
            padding: "32px 24px",
            gap: "16px",
          },
          children: [
            {
              id: uid(),
              type: "productCard",
              src: "",
              alt: "Product 1",
              href: "#",
              price: "$49.99",
              content: JSON.stringify({
                title: "Product One",
                description: "Perfect for everyday use.",
                buttonLabel: "Buy Now",
              }),
              style: {
                backgroundColor: "#f8fafc",
                padding: "20px",
                textAlign: "center",
                borderRadius: "8px",
              },
            },
            {
              id: uid(),
              type: "productCard",
              src: "",
              alt: "Product 2",
              href: "#",
              price: "$79.99",
              content: JSON.stringify({
                title: "Product Two",
                description: "Premium quality, unbeatable value.",
                buttonLabel: "Buy Now",
              }),
              style: {
                backgroundColor: "#f8fafc",
                padding: "20px",
                textAlign: "center",
                borderRadius: "8px",
              },
            },
          ],
        },
        {
          id: uid(),
          type: "footer",
          content: JSON.stringify({
            copyright: "© 2025 BrandName. All rights reserved.",
            links: [
              { label: "Unsubscribe", href: "#" },
              { label: "Privacy", href: "#" },
            ],
          }),
          style: {
            backgroundColor: "#0f172a",
            padding: "24px 32px",
            textAlign: "center",
            color: "#64748b",
          },
        },
      ],
    },
  },

  // ── Newsletter ─────────────────────────────────────────────────────────────
  {
    id: "starter-newsletter",
    name: "Newsletter",
    description:
      "A clean, editorial newsletter layout with multiple content sections.",
    category: "Newsletter",
    thumbnail: "#0284c7",
    document: {
      backgroundColor: "#f1f5f9",
      contentWidth: 600,
      fontFamily: "Georgia, 'Times New Roman', serif",
      blocks: [
        {
          id: uid(),
          type: "menu",
          content: JSON.stringify([
            { label: "Archive", href: "#" },
            { label: "Subscribe", href: "#" },
            { label: "Sponsor", href: "#" },
          ]),
          style: {
            backgroundColor: "#0c4a6e",
            padding: "12px 24px",
            textAlign: "center",
            color: "#bae6fd",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 1,
          content: "The Weekly Digest",
          style: {
            fontSize: "36px",
            fontWeight: "700",
            color: "#0c4a6e",
            padding: "32px 32px 4px",
            lineHeight: "1.2",
            textAlign: "center",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "text",
          content: "Edition #42 · April 17, 2025",
          style: {
            fontSize: "13px",
            color: "#94a3b8",
            padding: "0 32px 24px",
            textAlign: "center",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "divider",
          style: {
            padding: "0 32px",
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderWidth: "2px",
            borderStyle: "solid",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 2,
          content: "This Week's Big Story",
          style: {
            fontSize: "22px",
            fontWeight: "700",
            color: "#0f172a",
            padding: "24px 32px 8px",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
          style: {
            fontSize: "16px",
            color: "#374151",
            padding: "0 32px 24px",
            lineHeight: "1.8",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "twoColumns",
          style: {
            backgroundColor: "#ffffff",
            padding: "0 32px 32px",
            gap: "24px",
          },
          children: [
            {
              id: uid(),
              type: "text",
              content:
                "<strong>Quick Take #1</strong><br>A short insight or opinion piece that your readers will find valuable.",
              style: {
                fontSize: "14px",
                color: "#4a5568",
                lineHeight: "1.7",
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
              },
            },
            {
              id: uid(),
              type: "text",
              content:
                "<strong>Quick Take #2</strong><br>Another short insight or data point worth highlighting for your audience.",
              style: {
                fontSize: "14px",
                color: "#4a5568",
                lineHeight: "1.7",
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
              },
            },
          ],
        },
        {
          id: uid(),
          type: "button",
          content: "Read the full story →",
          href: "#",
          style: {
            display: "block",
            backgroundColor: "#0284c7",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            textAlign: "center",
            padding: "14px 32px",
            borderRadius: "6px",
            maxWidth: "220px",
            margin: "0 auto 32px",
          },
        },
        {
          id: uid(),
          type: "footer",
          content: JSON.stringify({
            copyright:
              "© 2025 The Weekly Digest. You are receiving this because you subscribed.",
            links: [
              { label: "Unsubscribe", href: "#" },
              { label: "Manage Preferences", href: "#" },
            ],
          }),
          style: {
            backgroundColor: "#f8fafc",
            padding: "24px 32px",
            textAlign: "center",
          },
        },
      ],
    },
  },

  // ── Product Launch ─────────────────────────────────────────────────────────
  {
    id: "starter-product-launch",
    name: "Product Launch",
    description:
      "Announce a new product with a hero, features, and a strong CTA.",
    category: "Marketing",
    thumbnail: "#059669",
    document: {
      backgroundColor: "#ffffff",
      contentWidth: 600,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      blocks: [
        {
          id: uid(),
          type: "menu",
          content: JSON.stringify([
            { label: "Home", href: "#" },
            { label: "Features", href: "#" },
            { label: "Pricing", href: "#" },
          ]),
          style: {
            backgroundColor: "#022c22",
            padding: "14px 24px",
            textAlign: "center",
            color: "#6ee7b7",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 1,
          content: "Introducing Something New ✨",
          style: {
            fontSize: "34px",
            fontWeight: "800",
            color: "#022c22",
            padding: "40px 32px 12px",
            lineHeight: "1.2",
            textAlign: "center",
            backgroundColor: "#ecfdf5",
            letterSpacing: "-0.5px",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "We've been working on this for months and we can't wait for you to try it. Built from the ground up to solve the problems you told us about.",
          style: {
            fontSize: "17px",
            color: "#064e3b",
            padding: "0 32px 32px",
            lineHeight: "1.7",
            textAlign: "center",
            backgroundColor: "#ecfdf5",
          },
        },
        {
          id: uid(),
          type: "image",
          src: "",
          alt: "Product screenshot",
          style: {
            display: "block",
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#d1fae5",
            minHeight: "240px",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 2,
          content: "Why you'll love it",
          style: {
            fontSize: "22px",
            fontWeight: "700",
            color: "#0f172a",
            padding: "32px 32px 8px",
            textAlign: "center",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "list",
          content: JSON.stringify({
            style: "check",
            items: [
              "Works seamlessly with your existing workflow",
              "10x faster than the old way of doing things",
              "Secure, private, and yours — always",
              "World-class support, 24/7",
            ],
          }),
          style: {
            backgroundColor: "#ffffff",
            padding: "8px 48px 24px",
            fontSize: "16px",
            color: "#374151",
            lineHeight: "1.75",
          },
        },
        {
          id: uid(),
          type: "button",
          content: "Try it free for 14 days →",
          href: "https://example.com/signup",
          style: {
            display: "block",
            backgroundColor: "#059669",
            color: "#ffffff",
            fontSize: "17px",
            fontWeight: "700",
            textAlign: "center",
            padding: "18px 40px",
            borderRadius: "8px",
            maxWidth: "260px",
            margin: "0 auto 40px",
          },
        },
        {
          id: uid(),
          type: "footer",
          content: JSON.stringify({
            copyright:
              "© 2025 YourStartup, Inc. 340 Pine St, San Francisco, CA.",
            links: [
              { label: "Unsubscribe", href: "#" },
              { label: "Privacy Policy", href: "#" },
            ],
          }),
          style: {
            backgroundColor: "#f8fafc",
            padding: "24px 32px",
            textAlign: "center",
          },
        },
      ],
    },
  },

  // ── Transactional: Order Confirmation ─────────────────────────────────────
  {
    id: "starter-order-confirm",
    name: "Order Confirmation",
    description:
      "A clear, trust-building transactional email for e-commerce orders.",
    category: "Transactional",
    thumbnail: "#7c3aed",
    document: {
      backgroundColor: "#f1f5f9",
      contentWidth: 600,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      blocks: [
        {
          id: uid(),
          type: "heading",
          level: 1,
          content: "Order Confirmed ✓",
          style: {
            fontSize: "28px",
            fontWeight: "700",
            color: "#ffffff",
            padding: "32px 32px 20px",
            textAlign: "center",
            backgroundColor: "#7c3aed",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "Thank you for your order! We're getting it ready to ship. You'll receive a tracking update within 24 hours.",
          style: {
            fontSize: "16px",
            color: "#e9d5ff",
            padding: "0 32px 28px",
            textAlign: "center",
            lineHeight: "1.7",
            backgroundColor: "#7c3aed",
          },
        },
        {
          id: uid(),
          type: "heading",
          level: 2,
          content: "Order #{{order_number}}",
          style: {
            fontSize: "18px",
            fontWeight: "700",
            color: "#374151",
            padding: "24px 32px 4px",
            backgroundColor: "#ffffff",
          },
        },
        {
          id: uid(),
          type: "text",
          content:
            "Placed on {{order_date}} · Estimated delivery {{delivery_date}}",
          style: {
            fontSize: "14px",
            color: "#64748b",
            padding: "0 32px 16px",
            backgroundColor: "#ffffff",
            lineHeight: "1.6",
          },
        },
        {
          id: uid(),
          type: "divider",
          style: {
            padding: "0 32px",
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderWidth: "1px",
            borderStyle: "solid",
          },
        },
        {
          id: uid(),
          type: "twoColumns",
          style: {
            backgroundColor: "#ffffff",
            padding: "20px 32px",
            gap: "16px",
          },
          children: [
            {
              id: uid(),
              type: "text",
              content:
                "<strong>Ship to</strong><br>{{customer_name}}<br>{{address_line_1}}<br>{{city}}, {{state}} {{zip}}",
              style: {
                fontSize: "14px",
                color: "#374151",
                lineHeight: "1.8",
                padding: "0",
              },
            },
            {
              id: uid(),
              type: "text",
              content:
                '<strong>Order total</strong><br><span style="font-size:22px;font-weight:700;color:#7c3aed;">{{order_total}}</span><br>Including shipping & taxes',
              style: {
                fontSize: "14px",
                color: "#374151",
                lineHeight: "1.8",
                padding: "0",
              },
            },
          ],
        },
        {
          id: uid(),
          type: "divider",
          style: {
            padding: "0 32px",
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderWidth: "1px",
            borderStyle: "solid",
          },
        },
        {
          id: uid(),
          type: "button",
          content: "Track Your Order →",
          href: "https://example.com/orders/{{order_number}}",
          style: {
            display: "block",
            backgroundColor: "#7c3aed",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            textAlign: "center",
            padding: "14px 32px",
            borderRadius: "8px",
            maxWidth: "200px",
            margin: "24px auto",
          },
        },
        {
          id: uid(),
          type: "footer",
          content: JSON.stringify({
            copyright: "© 2025 Your Store. Questions? Reply to this email.",
            links: [
              { label: "Order History", href: "#" },
              { label: "Returns", href: "#" },
              { label: "Help", href: "#" },
            ],
          }),
          style: {
            backgroundColor: "#f8fafc",
            padding: "24px 32px",
            textAlign: "center",
          },
        },
      ],
    },
  },
];

// ─── Lookup ────────────────────────────────────────────────────────────────────

export function getTemplateById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id);
}
