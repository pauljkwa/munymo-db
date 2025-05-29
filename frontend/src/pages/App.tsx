import React, { useState, useEffect } from "react"; // Import useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Import CardFooter
import { Badge } from "@/components/ui/badge"; // Import Badge
import { CheckCircle, Zap, Diamond } from "lucide-react";
import { Header } from 'components/Header'; // Correct import path
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Label } from "@/components/ui/label"; // Import Label
import { PricingCard } from "components/PricingCard"; // Import PricingCard
// Fixed missing Link import
import { useNavigate, useLocation, Link } from 'react-router-dom'; // <-- Import useLocation and Link
import { useAuthStore } from "utils/authStore"; // Import auth store
import { LogoMain } from 'components/LogoMain'; // Import LogoMain
import { testTickerRendering } from '../utils/stockApi'; // Import the chart testing utility
import { BetaSignupForm } from 'components/BetaSignupForm'; // Import beta signup form

export default function App() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // <-- Get location object
  const { session } = useAuthStore(); // Get session to potentially alter CTA later

  // Define Price IDs (Consider fetching these from config/backend later)
  const priceIds = {
    free: 'free', // Special identifier for the free plan
    pro_monthly: 'price_1RF92KRHhZZAsDMZt3CBr3NP',
    pro_annual: 'price_1RF95mRHhZZAsDMZWp4PXUC1',
    premium_monthly: 'price_1RF93ZRHhZZAsDMZp555lkHK',
    premium_annual: 'price_1RF94mRHhZZAsDMZ8dzWt7nr',
  };

  const handleRunChartTest = async () => {
    console.log("Running chart tests...");
    try {
      const results = await testTickerRendering();
      console.log("Chart test results:", results);
    } catch (err) {
      console.error("Error running chart tests:", err);
    }
  };


  // Function to scroll to the pricing section
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to scroll if the URL hash is #pricing
  useEffect(() => {
    if (location.hash === "#pricing") {
      scrollToPricing();
      // Optional: Remove the hash from the URL after scrolling
      // navigate(location.pathname, { replace: true });
    }
  }, [location.hash, navigate]); // Re-run if the hash changes

  // Handler for selecting a specific plan (unchanged)
  const handlePlanSelect = (priceId: string) => {
    // --- ADD LOG ---
    console.log(`[App.tsx] handlePlanSelect: Navigating with priceId: ${priceId}`);
    navigate(`/SignupPage?priceId=${priceId}`); // Corrected path to SignupPage
  };
null
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Remove onGetStartedClick prop */}
      <Header />

      <main className="flex-grow pt-20"> {/* Add padding top to avoid overlap with fixed header */}
        {/* Hero Section */}
        <section className="py-10 md:py-16 text-center bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4">
            <p className="text-lg md:text-xl text-muted-foreground"> {/* Removed mb-0 */}
              eeny meeny...
            </p>
            {/* Replaced H1 with Logo */}
            <LogoMain height={256} className="mx-auto mb-2" /> {/* Changed mb-0 to mb-2 */}

            <p className="text-md md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto"> {/* Changed mb-6 to mb-10 */}
              This is not a guessing game. Do your homework and make your best prediction in the quickest time you can...
            </p>
            {/* Update onClick */}
            <Button size="lg" onClick={scrollToPricing} className="text-lg px-8 py-6">
              Start Predicting Now
            </Button>
            <div className="mt-12 flex justify-center"> {/* Changed mt-4 to mt-12 */}
              {/* Container with border and header text */}
              <div className="bg-card/50 border border-border rounded-xl p-6 w-auto max-w-2xl shadow-md">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Today's Game</h2>
                  <p className="text-muted-foreground">Which stock will perform better?</p>
                </div>
                {/* Existing cards container */}
                <div className="flex justify-center items-center gap-6 flex-wrap">
                  {/* Static Card 1 (Example: AAPL) */}
                  <div className="w-60 bg-card p-4 rounded-lg border border-border shadow-lg flex flex-col gap-4 transform transition-transform hover:scale-105">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-foreground">AAPL</span>
                      <Badge variant="secondary">Tech</Badge>
                    </div>
                    {/* Simplified Static Candlestick Chart Area */}
                    <div className="relative h-28 bg-muted/20 rounded flex items-end justify-around p-2 gap-1 border border-border/50 overflow-hidden">
                      {/* Candlesticks (position relative to allow absolute wicks/bodies) */}
                      {[40, 55, 60, 30, 70, 50, 65, 80].map((heightPercent, index) => {
                        const isGreen = index % 3 !== 1; // Example logic for color
                        const bodyHeight = Math.random() * 20 + 15; // Random body height % (e.g., 15-35%)
                        const wickHeight = heightPercent + 10; // Wick slightly taller than bar
                        const bodyTop = 100 - heightPercent; // Top position % from top
                        const wickTop = 100 - wickHeight; // Wick top position % from top
                        return (
                          <div key={index} className="relative w-3 h-full flex items-end justify-center">
                            {/* Wick (thin line) */}
                            <div
                              className="absolute bg-muted-foreground/60 w-0.5 rounded-full"
                              style={{
                                height: `${wickHeight}%`,
                                top: `${wickTop}%`
                              }}
                            />
                            {/* Body (thicker rectangle) */}
                            <div
                              className={`absolute ${isGreen ? 'bg-green-600' : 'bg-red-600'} w-2.5 rounded-sm`}
                              style={{
                                height: `${bodyHeight}%`,
                                top: `${bodyTop}%`,
                              }}
                            />
                          </div>
                        );
                      })}
                       {/* Simplified volume bars (kept as is) */}
                       <div className="absolute bottom-2 left-0 right-0 flex justify-around items-end px-2 gap-1 opacity-30">
                         <div className="w-2.5 h-[10%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[15%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[20%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[10%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[25%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[15%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[20%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[30%] bg-muted-foreground/50"></div>
                      </div>
                    </div>
                    <Button className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-2.5">Select</Button>
                  </div>

                  {/* Static Card 2 (Example: MSFT) */}
                  <div className="w-60 bg-card p-4 rounded-lg border border-border shadow-lg flex flex-col gap-4 transform transition-transform hover:scale-105">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-foreground">MSFT</span>
                      <Badge variant="secondary">Tech</Badge>
                    </div>
                    {/* Simplified Static Candlestick Chart Area */}
                    <div className="relative h-28 bg-muted/20 rounded flex items-end justify-around p-2 gap-1 border border-border/50 overflow-hidden">
                      {/* Candlesticks (position relative to allow absolute wicks/bodies) - Different Pattern */}
                       {[50, 65, 40, 75, 55, 80, 70, 85].map((heightPercent, index) => {
                        const isGreen = index % 2 !== 0; // Alternate logic for color
                        const bodyHeight = Math.random() * 25 + 15; // Random body height % (e.g., 15-40%)
                        const wickHeight = heightPercent + 15; // Wick slightly taller
                        const bodyTop = 100 - heightPercent - (bodyHeight / 2); // Center body roughly on wick top
                        const wickTop = 100 - wickHeight; // Wick top position % from top
                        return (
                          <div key={index} className="relative w-3 h-full flex items-end justify-center">
                            {/* Wick (thin line) */}
                            <div
                              className="absolute bg-muted-foreground/60 w-0.5 rounded-full"
                              style={{
                                height: `${Math.min(wickHeight, 100)}%`, // Ensure wick doesn't exceed 100%
                                top: `${Math.max(wickTop, 0)}%` // Ensure top isn't negative
                              }}
                            />
                            {/* Body (thicker rectangle) */}
                            <div
                              className={`absolute ${isGreen ? 'bg-green-600' : 'bg-red-600'} w-2.5 rounded-sm`}
                              style={{
                                height: `${bodyHeight}%`,
                                top: `${Math.max(bodyTop, wickTop, 0)}%`, // Ensure body starts within wick & bounds
                              }}
                            />
                          </div>
                        );
                      })}
                       {/* Simplified volume bars */}
                       <div className="absolute bottom-2 left-0 right-0 flex justify-around items-end px-2 gap-1 opacity-30">
                         <div className="w-2.5 h-[15%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[20%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[10%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[25%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[15%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[30%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[20%] bg-muted-foreground/50"></div>
                         <div className="w-2.5 h-[35%] bg-muted-foreground/50"></div>
                      </div>
                    </div>
                    <Button className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-2.5">Select</Button>
                  </div>
                </div> {/* End cards container */}
              </div> {/* End container with border */}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How Munymo Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-border hover:border-primary transition-colors">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-primary">1</span>
                  </div>
                  <CardTitle>Daily Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Each day, choose between two companies. Predict which one will perform better in the stock market.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-border hover:border-primary transition-colors">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                     <span className="text-3xl font-bold text-primary">2</span>
                  </div>
                  <CardTitle>Research & Decide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Use your financial knowledge, research skills, and gut feeling. Accuracy and speed matter!
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-border hover:border-primary transition-colors">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-primary">3</span>
                  </div>
                  <CardTitle>Climb the Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Compete globally, earn points for correct predictions, and rise through the ranks to become a Munymo Master.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Choose Your Plan</h2>
            {/* Billing Cycle Switch */}
            <div className="flex items-center justify-center space-x-2 mb-12">
              <Label htmlFor="billing-cycle" className={!isAnnual ? "text-foreground" : "text-muted-foreground"}>
                Monthly
              </Label>
              <Switch
                id="billing-cycle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label="Switch between monthly and annual billing"
              />
              <Label htmlFor="billing-cycle" className={isAnnual ? "text-foreground" : "text-muted-foreground"}>
                Annual (Save 20%)
              </Label>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Tier */}
              <PricingCard
                title="Free"
                description="Start playing and learn the basics"
                monthlyPrice={0}
                features={[
                  { icon: CheckCircle, text: "Basic gameplay" },
                  { icon: CheckCircle, text: "Social sharing" },
                ]}
                isAnnual={isAnnual}
                ctaText="Get Started Free"
                ctaVariant="outline"
                onCtaClick={() => handlePlanSelect(priceIds.free)}
              />

              {/* Pro Tier */}
              <PricingCard
                title="Pro"
                description="Unlock more features and compete seriously"
                monthlyPrice={4.99} // Updated price
                features={[
                  { icon: Zap, text: "Free features +" },
                  { icon: Zap, text: "Push Notifications" },
                  { icon: Zap, text: "Leaderboards" },
                  { icon: Zap, text: "Stats Dashboard" },
                ]}
                isAnnual={isAnnual}
                // isPopular={true} // Removed popular badge
                ctaText="Go Pro"
                onCtaClick={() => handlePlanSelect(isAnnual ? priceIds.pro_annual : priceIds.pro_monthly)}
              />

              {/* Premium Tier */}
              <PricingCard
                title="Premium"
                description="For the ultimate prediction masters"
                monthlyPrice={9.99} // Updated price
                features={[
                  { icon: Diamond, text: "Pro features +" },
                  { icon: Diamond, text: "MunyIQ calculation" },
                  { icon: Diamond, text: "MunyIQ digital rewards card" },
                ]}
                isAnnual={isAnnual}
                ctaText="Go Premium"
                ctaVariant="outline"
                onCtaClick={() => handlePlanSelect(isAnnual ? priceIds.premium_annual : priceIds.premium_monthly)}
              />
            </div>
          </div>
        </section> {/* End Pricing Section */}

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Predictors Say</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Testimonial 1: Free User */}
              <Card className="flex flex-col justify-between border-border">
                <CardContent className="pt-6">
                  <blockquote className="text-lg italic text-muted-foreground mb-4">
                    "Munymo is a fun way to dip my toes into market prediction without any pressure. Great for learning!"
                  </blockquote>
                </CardContent>
                <CardFooter className="text-sm">
                  <p>
                    <span className="font-semibold">Alex J.</span>
                    <br />
                    <span className="text-primary">Munymo Free Player</span>
                  </p>
                </CardFooter>
              </Card>

              {/* Testimonial 2: Pro User */}
              <Card className="flex flex-col justify-between border-primary shadow-lg">
                 <CardContent className="pt-6">
                  <blockquote className="text-lg italic text-muted-foreground mb-4">
                    "The leaderboards and stats dashboard on Pro are addictive! It pushes me to sharpen my predictions daily."
                  </blockquote>
                </CardContent>
                <CardFooter className="text-sm">
                  <p>
                    <span className="font-semibold">Sarah K.</span>
                    <br />
                    <span className="text-primary">Munymo Pro Member</span>
                  </p>
                </CardFooter>
              </Card>

              {/* Testimonial 3: Premium User */}
              <Card className="flex flex-col justify-between border-border">
                <CardContent className="pt-6">
                  <blockquote className="text-lg italic text-muted-foreground mb-4">
                    "Tracking my MunyIQ gives me real insight into my performance trends. The premium features are worth it for serious players."
                  </blockquote>
                </CardContent>
                <CardFooter className="text-sm">
                   <p>
                    <span className="font-semibold">Mike P.</span>
                    <br />
                    <span className="text-primary">Munymo Premium Analyst</span>
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

         {/* Beta Signup Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-primary/5 to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Beta Program</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Be one of the first to experience Munymo's innovative market prediction game. Our beta testers get:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Early access to premium features before official launch</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Opportunity to shape the future of Munymo with direct feedback</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Exclusive beta tester rewards and special subscription offers</span>
                  </li>
                </ul>
                <div className="hidden md:block">
                  <Button onClick={scrollToPricing} variant="outline" className="mr-4">
                    View Pricing Plans
                  </Button>
                </div>
              </div>
              <div>
                <BetaSignupForm className="shadow-lg" />
              </div>
              <div className="md:hidden text-center mt-4">
                <Button onClick={scrollToPricing} variant="outline">
                  View Pricing Plans
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="py-16 md:py-24 text-center bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Test Your Prediction Skills?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of financial enthusiasts predicting the market daily. Sign up now and make your first prediction!
            </p>
            {/* Update onClick */}
            <Button size="lg" onClick={scrollToPricing} className="text-lg px-8 py-6">
              Join Munymo Today
            </Button>
          </div>
        </section>
      </main>

    </div>
  );
}
