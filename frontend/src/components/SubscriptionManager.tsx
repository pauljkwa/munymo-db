import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import brain from "brain";

interface SubscriptionManagerProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function SubscriptionManager({ setError, setIsLoading }: SubscriptionManagerProps) {
  const [userId, setUserId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please enter a user ID");
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Call the admin endpoint to fix the subscription
      const response = await brain.admin_fix_subscription(
        { user_id: userId, tier: subscriptionTier }
      );
      const data = await response.json();
      
      if (data.status === "success") {
        toast.success(`User subscription updated to ${subscriptionTier}`);
        setResult(data);
      } else {
        toast.error(data.message || "Failed to update subscription");
        setError(data.message || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
      setError("An error occurred while updating the subscription.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
        <p className="text-sm font-medium">Admin Tool</p>
        <p className="text-sm mt-1">
          This tool allows you to manually update a user's subscription tier. Use this when subscription tier is
          not properly synchronized between Stripe and the user's account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              placeholder="Enter Supabase user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can copy this from the User Management tab
            </p>
          </div>

          <div>
            <Label htmlFor="subscription-tier">Subscription Tier</Label>
            <Select
              value={subscriptionTier}
              onValueChange={setSubscriptionTier}
            >
              <SelectTrigger id="subscription-tier">
                <SelectValue placeholder="Select subscription tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={processing} className="w-full">
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Subscription"
          )}
        </Button>
      </form>

      {result && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDialog(true)}
            className="w-full"
          >
            View Update Details
          </Button>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscription Update Details</DialogTitle>
                <DialogDescription>
                  Details of the subscription update operation
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <p className="text-sm">{result.status}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Message</h3>
                  <p className="text-sm">{result.message}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Previous Data</h3>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-48">
                    {JSON.stringify(result.previous_data, null, 2)}
                  </pre>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
