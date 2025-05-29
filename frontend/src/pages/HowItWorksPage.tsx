
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_BASE_PATH } from "app";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" onClick={() => navigate(APP_BASE_PATH)} className="mb-4">
        &larr; Back to Home
      </Button>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            How Munymo Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none space-y-6 text-card-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-primary">The Daily Challenge</h2>
              <p>
                Welcome to Munymo, where financial insight meets competitive
                spirit! Each day, you'll be presented with a pair of publicly
                traded companies (e.g., Company A vs. Company B).
              </p>
              <p>
                Your mission, should you choose to accept it, is to predict
                which company's stock will perform better by the end of that
                trading day. Will Company A outperform Company B, or vice
                versa? Make your prediction before the market opens!
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">The Sector Clue</h2>
              <p>
                To aid your decision, you'll receive a clue about the general
                sector or industry for the <em>next</em> day's company pair.
                Use this information strategically to research and prepare your
                prediction in advance. This clue is revealed after you submit
                your prediction for the current day.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Scoring & Accuracy</h2>
              <p>
                Success in Munymo isn't just about luck; it requires research,
                analysis, and timely decision-making. Points are awarded based
                on the accuracy of your predictions.
              </p>
              <p>
                {/* TODO: Add details on scoring if different tiers have different rules or if speed matters */}
                Consistently accurate predictions are key to improving your
                standing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Climbing the Leaderboard</h2>
              <p>
                Compete against a global community of financial enthusiasts!
                Your performance is tracked, and your rank is displayed on the
                global Leaderboard.
              </p>
              <p>
                The leaderboard ranks players based on a combination of factors:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Accuracy:</strong> The percentage of correct predictions you've made
                </li>
                <li>
                  <strong>Total Games:</strong> The number of games you've participated in
                </li>
                <li>
                  <strong>Speed:</strong> How quickly you submit your predictions (for correct predictions)
                </li>
                <li>
                  <strong>Average Score:</strong> Your average points per game
                </li>
              </ul>
              <p>
                Leaderboards are exchange-specific, so you can compete with others 
                trading on the same markets. Check back regularly to see your rank improve as
                you make more successful predictions!  
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">The MunyIQ Score System</h2>
              <p>
                For our premium subscribers, we offer the exclusive MunyIQ score system—a comprehensive 
                metric that measures your stock prediction prowess on a scale of 1-200.
              </p>
              <p>
                Your MunyIQ score is calculated based on five key components:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Accuracy (40%):</strong> The percentage of your predictions that were correct
                </li>
                <li>
                  <strong>Consistency (20%):</strong> How stable your performance is over time, avoiding wild swings
                </li>
                <li>
                  <strong>Speed (20%):</strong> How quickly you make your predictions after a game opens
                </li>
                <li>
                  <strong>Participation:</strong> Initially 20% for the first 20-game streak, then reduces to 10% for subsequent streaks
                </li>
                <li>
                  <strong>Improvement:</strong> After 40+ games (your second 20-game streak), a 10% weight is applied to reward your growth over time
                </li>
              </ul>
              <p>
                MunyIQ provides a deeper analysis of your performance than the leaderboard alone, with performance 
                levels ranging from Beginner (1-74) to Elite (175-200). It also shows your percentile rank compared to 
                all other premium users and tracks your score history over time.
              </p>
              <p>
                <strong>Important note:</strong> Your MunyIQ score is calculated only after you complete a 20-game streak and
                is recalculated after each subsequent 20-game streak. This makes consistent participation and improvement 
                over time key factors in maximizing your score.
              </p>
              <p>
                Use your MunyIQ insights to identify strengths and areas for improvement in your prediction strategy!
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">Subscription Tiers</h2>
              <p>
                Munymo offers different subscription levels, including a free
                tier to get you started. While core gameplay is available to
                all, higher tiers might offer additional benefits or insights.
                (Details on specific tier features will be available soon).
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Ready to Play?</h3>
              <p>
                Dive in, make your daily prediction, use the clues wisely, and
                climb the ranks. Good luck!
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HowItWorksPage;
