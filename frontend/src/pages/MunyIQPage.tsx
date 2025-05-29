import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "utils/authStore";
import { useProfileStore } from "utils/profileStore";
import { MunyIQ } from "components/MunyIQ";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Lock } from "lucide-react";
import { Header } from "components/Header";
import { Footer } from "components/Footer";

export default function MunyIQPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfileStore();
  
  const isLoading = authLoading || profileLoading;
  const isPremium = profile?.subscription_tier === "premium" || profile?.subscription_tier === "pro";
  
  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!session) {
    navigate("/login?redirect=/munyiq");
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">MunyIQ Performance Score</h1>
        
        {!isPremium ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Crown className="h-16 w-16 text-amber-400" />
              </div>
              <CardTitle className="text-2xl text-center">Premium Feature</CardTitle>
              <CardDescription className="text-center">
                MunyIQ is available exclusively to Premium and Pro tier members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed space-y-3">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Unlock Your MunyIQ Score</h3>
                <p className="text-center text-muted-foreground">
                  MunyIQ measures your stock prediction prowess on a 1-200 scale, combining accuracy, consistency, speed, and participation.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Upgrade to Premium to track your progress and see how you stack up against other players!
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button size="lg" onClick={() => navigate("/")}>
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <MunyIQ />
        )}
      </main>
      <Footer />
    </div>
  );
}
