
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_BASE_PATH } from "app";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
        &larr; Back to Home
      </Button>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none space-y-6 text-card-foreground">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold text-primary">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Munymo web application (the "Service"),
                you agree to be bound by these Terms of Service ("Terms"). If you
                disagree with any part of the terms, then you may not access the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">2. Description of Service</h2>
              <p>
                Munymo provides a daily prediction game where users predict the
                relative stock performance of two companies. The Service includes
                features such as daily predictions, sector clues, leaderboards,
                and potentially subscription-based tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">3. User Accounts</h2>
              <ul>
                <li>
                  To access certain features of the Service, you may be required
                  to register for an account. You agree to provide accurate,
                  current, and complete information during the registration
                  process.
                </li>
                <li>
                  You are responsible for safeguarding your account password and
                  for any activities or actions under your account.
                </li>
                <li>
                  You agree not to disclose your password to any third party.
                  You must notify us immediately upon becoming aware of any
                  breach of security or unauthorized use of your account.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">4. User Conduct</h2>
              <p>
                You agree not to use the Service:
              </p>
              <ul>
                <li>In any way that violates any applicable local, national, or international law or regulation.</li>
                <li>To engage in any activity that interferes with or disrupts the Service.</li>
                <li>To attempt to gain unauthorized access to the Service or its related systems or networks.</li>
                <li>To impersonate or attempt to impersonate Munymo, a Munymo employee, another user, or any other person or entity.</li>
                <li>To exploit, harm, or attempt to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                 <li>To use any automated system, including without limitation "robots," "spiders," or "offline readers," to access the Service in a manner that sends more request messages to the Munymo servers than a human can reasonably produce in the same period by using a conventional on-line web browser.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">5. Subscriptions and Payments (If Applicable)</h2>
               {/* Add details once subscription tiers are finalized */}
              <p>
                If Munymo offers subscription tiers:
              </p>
              <ul>
                <li>Subscription fees, billing cycles, and features associated with each tier will be clearly communicated within the Service.</li>
                <li>Payments will be processed through a third-party payment processor (e.g., Stripe). Your payment information will be handled according to their terms and privacy policy.</li>
                <li>Subscriptions may automatically renew unless cancelled before the end of the current billing period.</li>
                <li>We reserve the right to change subscription fees upon reasonable notice.</li>
              </ul>
            </section>

             <section>
              <h2 className="text-2xl font-semibold text-primary">6. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Munymo and its licensors. The Service is protected by copyright, trademark, and other laws of both the [Your Country] and foreign countries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">7. Disclaimers</h2>
               <p><strong>IMPORTANT: Munymo is a game for entertainment purposes only. It does not provide financial advice.</strong></p>
              <ul>
                <li>The predictions and outcomes within the game are based on real-world stock market data but should not be interpreted as investment recommendations or financial advice.</li>
                <li>We do not guarantee the accuracy, completeness, or timeliness of the data used within the game. Market data can be delayed or contain errors.</li>
                <li>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis.</li>
                <li>Munymo does not warrant that a) the Service will function uninterrupted, secure, or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">8. Limitation of Liability</h2>
              <p>
                In no event shall Munymo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">9. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction, e.g., State, Country], without regard to its conflict of law provisions.
                 {/* Replace with actual Jurisdiction */}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">10. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">11. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at: [Your Contact Email Address]
                 {/* Replace with actual contact info */}
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TermsOfServicePage;
