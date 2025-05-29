
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_BASE_PATH } from "app";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
        &larr; Back to Home
      </Button>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none space-y-6 text-card-foreground">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Introduction</h2>
              <p>
                Welcome to Munymo! We are committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our web application (the
                "Service"). Please read this privacy policy carefully. If you do
                not agree with the terms of this privacy policy, please do not
                access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">
                Collection of Your Information
              </h2>
              <p>
                We may collect information about you in a variety of ways. The
                information we may collect via the Service includes:
              </p>
              <ul>
                <li>
                  <strong>Personal Data:</strong> Personally identifiable
                  information, such as your email address, that you voluntarily
                  give to us when you register with the Service or when you
                  choose to participate in various activities related to the
                  Service, such as submitting predictions and participating in
                  leaderboards.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information automatically
                  collected when you access the Service, such as your IP address,
                  browser type, operating system, access times, and the pages
                  you have viewed directly before and after accessing the Service.
                </li>
                 <li>
                  <strong>Prediction Data:</strong> Information related to the predictions you make within the game, including the companies selected and the time of submission.
                </li>
                 <li>
                  <strong>Push Notification Tokens:</strong> If you opt-in to receive push notifications, we collect a device token (e.g., FCM token) to send you game-related updates.
                </li>
                {/* Add sections for payment data if/when Stripe integration requires it */}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Use of Your Information</h2>
              <p>
                Having accurate information about you permits us to provide you
                with a smooth, efficient, and customized experience. Specifically,
                we may use information collected about you via the Service to:
              </p>
              <ul>
                <li>Create and manage your account.</li>
                <li>Administer the game, including processing your predictions and calculating leaderboard standings.</li>
                <li>Send you push notifications about game events or updates (if enabled).</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                <li>Notify you of updates to the Service.</li>
                <li>Process payments and refunds (if applicable for subscription tiers).</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
              </ul>
            </section>

             <section>
              <h2 className="text-2xl font-semibold text-primary">Disclosure of Your Information</h2>
              <p>
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              <ul>
                 <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                 <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data storage (e.g., Supabase), push notifications (e.g., Firebase Cloud Messaging), payment processing (e.g., Stripe), and data analysis.</li>
                 <li><strong>Leaderboards:</strong> Your username or chosen display name and score/rank may be visible to other users on the public leaderboard.</li>
              </ul>
              <p>We do not sell your personal information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures
                to help protect your personal information. While we have taken
                reasonable steps to secure the personal information you provide
                to us, please be aware that despite our efforts, no security
                measures are perfect or impenetrable, and no method of data
                transmission can be guaranteed against any interception or other
                type of misuse.
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-semibold text-primary">Policy for Children</h2>
              <p>
                We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">
                Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page. You are advised to review this Privacy Policy
                periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy,
                please contact us at: [Your Contact Email Address]
                 {/* Replace with actual contact info */}
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacyPolicyPage;
