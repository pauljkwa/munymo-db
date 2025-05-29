import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "utils/authStore"; // Import auth store
import { Header } from "components/Header"; // <-- Import Header
import { Footer } from "components/Footer"; // <-- Import Footer

// TODO: Implement actual login logic using authStore

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword); // Get function from store

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // console.log("Attempting login with:", { email }); // Placeholder
    // TODO: Replace with actual call to useAuthStore signInWithPassword
    // await new Promise(res => setTimeout(res, 1000)); // Simulate network request

    // Placeholder success/error
    // const success = Math.random() > 0.5; // Simulate success/failure
    // if (success) {
    //   console.log("Login successful (placeholder)");
    //   navigate("/"); // Navigate home on success
    // } else {
    //   setError("Invalid email or password (placeholder)");
    //   console.log("Login failed (placeholder)");
    // }
    try {
      await signInWithPassword(email, password);
      console.log("Login successful");
      navigate("/"); // Navigate home on successful login
    } catch (error: any) {
      console.error("Login error:", error.message);
      setError(error.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-secondary/30 pt-24 pb-12"> {/* Increased pt */}
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login to Munymo</CardTitle>
            <CardDescription>Enter your details below to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid w-full items-center gap-4">
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
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/#pricing" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      
    </div>
  );
}
