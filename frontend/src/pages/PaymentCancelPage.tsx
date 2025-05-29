import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { Header } from "components/Header"; // <-- Import Header
import { Footer } from "components/Footer"; // <-- Import Footer

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
               <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">Payment Cancelled</CardTitle>
            <CardDescription>Your subscription process was not completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              You have cancelled the checkout process. No charges were made.
            </p>
            <Button asChild variant="outline" className="mr-2">
              <Link to="/">View Plans</Link>
            </Button>
            <Button asChild>
              <Link to="/">Go to Home</Link> 
            </Button>
          </CardContent>
        </Card>
      </main>
      
    </div>
  );
}
