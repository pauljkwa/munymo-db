import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "utils/authStore";
import { APP_BASE_PATH } from "app";
import { supabase } from "utils/supabaseClient"; // Import supabase client directly
import { Header } from "components/Header";
import { Footer } from "components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For displaying errors
import { toast } from "sonner";

// TODO: Implement actual signup logic using authStore


export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState(""); // State for username
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // We'll call supabase auth directly, store function is too simple for this now
  // const signUpWithPassword = useAuthStore((state) => state.signUpWithPassword);

  const queryParams = new URLSearchParams(location.search);
  const priceId = queryParams.get("priceId") || "free";
  // --- ADD LOG ---
  console.log(`[SignupPage.tsx] Page Load: URL Search = "${location.search}", Extracted priceId = "${priceId}"`);
  
  // Redirect to pricing if no priceId is provided
  useEffect(() => {
    if (!location.search) {
      console.log("[SignupPage.tsx] No priceId in URL, redirecting to pricing");
      navigate("/#pricing");
      toast.info("Please select a plan to continue");
    }
  }, [location.search, navigate]);
  
  // Construct the full redirect URL pointing to the AuthCallbackPage
  // We rely on localStorage, not the URL, to pass the priceId after email verification.
  // Make sure to use the correct path format that matches router.tsx
  const redirectUrl = `${window.location.origin}${APP_BASE_PATH}auth-callback-page`;
  console.log("Using redirect URL for Supabase email confirmation:", redirectUrl);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // MYA-20: Store the intended priceId before attempting signup
    try {
      // --- ADD LOG ---
      console.log(`[SignupPage.tsx] handleSignup: Attempting to store pendingPriceId: "${priceId}"`);
      console.log(`[SignupPage] Attempting to set localStorage 'pendingPriceId' to: ${priceId}`);
      localStorage.setItem('pendingPriceId', priceId);
      const storedPriceId = localStorage.getItem('pendingPriceId');
      console.log(`[SignupPage] Value in localStorage 'pendingPriceId' immediately after setItem: ${storedPriceId}`);
      // console.log(`Signup attempt: Stored pendingPriceId: ${priceId}`);
    } catch (storageError) {
      console.error("Failed to write pendingPriceId to localStorage:", storageError);
      // Decide if this is a critical error. For now, we'll proceed,
      // but ideally, we might want to inform the user or halt.
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting Supabase signup with email:", email);
      // Step 1: Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl, // Use the FULL path now
          data: {
            username: username,
            // Other metadata to store with the user
            subscription_tier: "free"
          }
        },
      });

      if (signUpError) {
        console.error("Supabase signUp error:", signUpError.message);
        throw signUpError; // Throw error to be caught below
      }

      // Check if user object exists (it should, even if confirmation is needed)
      const user = authData?.user;
      if (!user) {
        // This case is unlikely if no error was thrown, but good to handle
        console.error("Supabase signup response missing user object.");
        throw new Error("Signup failed: Could not retrieve user information.");
      }
      console.log("Supabase signup successful, User ID:", user.id);


      // Step 2: Create a profile for the user
      try {
        console.log("Creating user profile with ID:", user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: username,
              subscription_tier: "free",
              is_admin: false,
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't throw here - we want the signup to succeed even if profile creation fails
          // The profile can be fixed later
        } else {
          console.log("Profile created successfully");
        }
      } catch (profileError) {
        console.error("Exception creating profile:", profileError);
        // Don't throw here either
      }

      // Step 3: Success: Inform user to check email (standard Supabase flow)
      // Success! Inform user to check email.
      // Supabase emailRedirectTo handles the next step.
      alert("Signup successful! Please check your email for a confirmation link to activate your account.");
      // DO NOT navigate programmatically here. User clicks email link.
      setError(null); // Clear any previous errors

    } catch (error: any) {
      console.error("Signup process failed:", error);
      setError(error.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-secondary/30 pt-24 pb-12">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your Munymo Account</CardTitle>
            <CardDescription>Enter your details below to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                {/* <Terminal className="h-4 w-4" /> Temporarily remove Terminal icon */}
                <AlertTitle>Signup Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSignup}>
              <div className="grid w-full items-center gap-4">
                 {/* Username */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a public username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>



                {/* Password */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/LoginPage" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      
    </div>
  );
}
