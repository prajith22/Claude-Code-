import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Dopiq",
};

const SECTIONS = [
  {
    heading: "Acceptance of Terms",
    body: "By accessing or using Dopiq you agree to be bound by these Terms of Service. If you do not agree to these terms please do not use the App.",
  },
  {
    heading: "Description of Service",
    body: "Dopiq is a behavioral wellness and impulse control application that provides simulated shopping, food ordering, and sports betting experiences using fake money. No real money is ever wagered, spent, or transacted within any simulation feature. Dopiq is not a gambling platform, a retail platform, or a food delivery service. All simulations are for entertainment and behavioral wellness purposes only.",
  },
  {
    heading: "Eligibility",
    body: "You must be at least 17 years of age to use Dopiq. By using the App you represent that you meet this age requirement. If you are under 17 you may not use the App.",
  },
  {
    heading: "User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You may not create accounts using automated means or under false pretenses.",
  },
  {
    heading: "Subscription and Billing",
    body: "Dopiq offers paid subscription plans including Dopiq Lite, Dopiq Plus, and Dopiq Pro. All plans include a 7-day free trial. Your payment method will be charged automatically at the end of the trial period unless you cancel before the trial ends. Subscriptions automatically renew at the end of each billing period. You may cancel your subscription at any time through the Settings page. Cancellation takes effect at the end of the current billing period and you retain access until that date. We do not offer refunds for partial billing periods except where required by law.",
  },
  {
    heading: "Simulated Content Disclaimer",
    body: "All products, restaurants, sports teams, odds, and other content displayed within Dopiq simulations are fictional and for simulation purposes only. Any resemblance to real products, businesses, or events is coincidental. No purchase, order, or wager is ever real. No money is ever transferred within simulations.",
  },
  {
    heading: "Prohibited Conduct",
    body: "You agree not to use Dopiq to violate any applicable law or regulation, attempt to circumvent any security or access controls, reverse engineer or decompile any part of the App, use the App for any commercial purpose without our written consent, or impersonate any person or entity.",
  },
  {
    heading: "Intellectual Property",
    body: "All content, features, and functionality of Dopiq including but not limited to text, graphics, logos, and software are owned by Dopiq and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.",
  },
  {
    heading: "Privacy",
    body: "Your use of Dopiq is also governed by our Privacy Policy which is incorporated into these Terms by reference. By using the App you consent to the collection and use of your information as described in the Privacy Policy.",
  },
  {
    heading: "Disclaimers",
    body: "Dopiq is provided on an as is and as available basis without warranties of any kind either express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.",
  },
  {
    heading: "Limitation of Liability",
    body: "To the maximum extent permitted by law Dopiq shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App. Our total liability to you for any claim arising from these Terms shall not exceed the amount you paid us in the 12 months preceding the claim.",
  },
  {
    heading: "Indemnification",
    body: "You agree to indemnify and hold harmless Dopiq and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the App or violation of these Terms.",
  },
  {
    heading: "Changes to Terms",
    body: "We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the date at the top of this page. Your continued use of the App after changes constitutes acceptance of the new Terms.",
  },
  {
    heading: "Governing Law",
    body: "These Terms are governed by the laws of the State of Texas without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Dallas County, Texas.",
  },
  {
    heading: "Contact",
    body: "If you have any questions about these Terms please contact us at [legal@dopiqapp.com](mailto:legal@dopiqapp.com)",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="Last updated: April 27, 2026"
      sections={SECTIONS}
    />
  );
}
