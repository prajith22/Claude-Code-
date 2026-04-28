import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Dopiq",
};

const SECTIONS = [
  {
    heading: "Introduction",
    body: "Dopiq is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Dopiq application. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy please do not use the App.",
  },
  {
    heading: "Information We Collect",
    body: "Information you provide directly includes your email address and name when you create an account, your password stored as a one-way encrypted hash, and Google account information if you sign in with Google OAuth. Information collected automatically includes simulation activity data, streak and savings counter data, subscription status and plan information, device type and browser information, and IP address and approximate location. Information we do NOT collect includes real payment card numbers, real purchase history, Social Security numbers, and precise GPS location.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use the information we collect to create and manage your account, process subscription payments through Stripe, track your simulation activity savings counter and streak, send transactional emails related to your account, improve and personalize your experience, comply with legal obligations, and detect and prevent fraud or abuse. We do not sell your personal information to third parties. We do not use your information for advertising purposes.",
  },
  {
    heading: "How We Share Your Information",
    body: "We share your information only with trusted service providers including Stripe for payment processing, Supabase for database hosting, and Vercel for application hosting. We may disclose your information if required by law or valid legal process. If Dopiq is acquired or merged your information may be transferred as part of that transaction and we will notify you before that occurs.",
  },
  {
    heading: "Data Retention",
    body: "We retain your account information for as long as your account is active. If you delete your account we permanently delete all your personal data within 30 days including your simulation history, savings data, streak data, and account credentials.",
  },
  {
    heading: "Data Security",
    body: "We implement industry standard security measures including encrypted data transmission via HTTPS, bcrypt hashing for passwords, encrypted database storage via Supabase on AWS infrastructure, and secure environment variable management for all API keys and secrets.",
  },
  {
    heading: "Payment Information",
    body: "All payment processing is handled by Stripe, a PCI DSS Level 1 certified payment processor. We never receive, store, or have access to your full credit card number, expiration date, or CVV. We only store a Stripe customer ID and subscription ID.",
  },
  {
    heading: "Cookies and Tracking",
    body: "Dopiq uses JWT tokens stored in secure HTTP-only cookies to manage authentication sessions. We do not use advertising cookies or third party tracking pixels. We do not use Google Analytics or similar tracking services.",
  },
  {
    heading: "Children's Privacy",
    body: "Dopiq is not intended for users under the age of 17. We do not knowingly collect personal information from anyone under 17. If we become aware that we have collected personal information from a user under 17 we will delete that information immediately.",
  },
  {
    heading: "Your Rights and Choices",
    body: "You may request a copy of your personal information by contacting [privacy@dopiqapp.com](mailto:privacy@dopiqapp.com). You may update your account information through the Settings page. You may delete your account and all associated data at any time through the Settings page. You may request an export of your personal data by contacting [privacy@dopiqapp.com](mailto:privacy@dopiqapp.com).",
  },
  {
    heading: "California Privacy Rights",
    body: "If you are a California resident you have rights under the CCPA including the right to know what personal information we collect, the right to delete your personal information, and the right to opt out of the sale of your personal information. Note that we do not sell your personal information. To exercise these rights contact [privacy@dopiqapp.com](mailto:privacy@dopiqapp.com).",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of material changes by updating the date at the top of this page. Your continued use of the App after changes constitutes your acceptance of the updated policy.",
  },
  {
    heading: "Contact Us",
    body: "If you have any questions about this Privacy Policy please contact us at [privacy@dopiqapp.com](mailto:privacy@dopiqapp.com)",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="Last updated: April 27, 2026"
      sections={SECTIONS}
    />
  );
}
