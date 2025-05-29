import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Header } from "components/Header"; // <-- Import Header
import { Footer } from "components/Footer"; // <-- Import Footer

export default function PaymentSuccessPage() {
  // TODO: Optionally retrieve session_id from URL query params if needed for display
  // const location = useLocation();
  // const queryParams = new URLSearchParams(location.search);
  // const sessionId = queryParams.get('session_id');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
            <CardDescription>Your subscription has been activated.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Thank you for subscribing! You can now access your premium features.
            </p>
            {/* <p className="text-xs text-muted-foreground">Session ID: {sessionId || 'N/A'}</p> */}
            <Button asChild className="mt-4">
              <Link to="/">Go to Home</Link> 
            </Button>
          </CardContent>
        </Card>
      </main>
      
    </div>
  );
}
