import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, mode, Mode } from "app";
import { toast } from "sonner";

interface Props {
  className?: string;
}

export const BetaSignupForm: React.FC<Props> = ({ className = "" }) => {
  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/beta-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        ...(mode === Mode.DEV && { credentials: "include" }),
        body: JSON.stringify({
          email,
          name,
          referral_source: referralSource,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitted(true);
        toast.success(data.message || "Thanks for joining the beta waitlist!");
      } else {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Beta signup error:", error);
      toast.error("We couldn't process your request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Join the Munymo Beta</CardTitle>
        <CardDescription>
          Be the first to test our market prediction game and give feedback.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="font-medium text-lg mb-2">You're on the list!</h3>
            <p className="text-muted-foreground">
              Thank you for your interest in Munymo. We'll notify you when beta access becomes available.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referral-source">How did you hear about us? <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger id="referral-source" disabled={isSubmitting}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="search_engine">Search Engine</SelectItem>
                  <SelectItem value="friend">Friend or Colleague</SelectItem>
                  <SelectItem value="financial_community">Financial Community</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : "Join the Beta"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-center text-xs text-muted-foreground">
        We respect your privacy and will never share your information with third parties.
      </CardFooter>
    </Card>
  );
};
