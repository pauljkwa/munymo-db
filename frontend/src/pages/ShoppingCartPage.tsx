import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle, CreditCard, Tag } from "lucide-react";
import brain from "brain";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "components/PricingCard";

// Store
import { useAuthStore } from "utils/authStore";
import { useProfileStore } from "utils/profileStore";

// Types
import { CreateCheckoutSessionRequest } from "types";

interface PlanDetails {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
}

const PRICING_PLANS: Record<string, PlanDetails> = {
  // Free plan
  "free": {
    id: "free",
    name: "Free",
    description: "Start playing and learn the basics",
    monthlyPrice: 0,
    features: ["Basic gameplay", "Social sharing"]
  },
  // Pro Monthly
  "price_pro_monthly": {
    id: "price_pro_monthly",
    name: "Pro (Monthly)",
    description: "Unlock more features and compete seriously",
    monthlyPrice: 4.99,
    features: ["Basic gameplay", "Push Notifications", "Leaderboards", "Stats Dashboard"]
  },
  // Pro Annual
  "price_pro_annual": {
    id: "price_pro_annual",
    name: "Pro (Annual)",
    description: "Unlock more features and compete seriously",
    monthlyPrice: 4.99 * 0.8, // 20% discount for annual
    features: ["Basic gameplay", "Push Notifications", "Leaderboards", "Stats Dashboard"]
  },
  // Premium Monthly
  "price_premium_monthly": {
    id: "price_premium_monthly",
    name: "Premium (Monthly)",
    description: "For the ultimate prediction masters",
    monthlyPrice: 9.99,
    features: ["All Pro features", "MunyIQ calculation", "MunyIQ digital rewards card"]
  },
  // Premium Annual
  "price_premium_annual": {
    id: "price_premium_annual",
    name: "Premium (Annual)",
    description: "For the ultimate prediction masters",
    monthlyPrice: 9.99 * 0.8, // 20% discount for annual
    features: ["All Pro features", "MunyIQ calculation", "MunyIQ digital rewards card"]
  }
};

export default function ShoppingCartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuthStore();
  const { profile } = useProfileStore();
  
  // State
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total price
  const selectedPlan = selectedPlanId ? PRICING_PLANS[selectedPlanId] : null;
  const basePrice = selectedPlan?.monthlyPrice || 0;
  const billingCycle = isAnnual ? "annually" : "monthly";
  const cycleMultiplier = isAnnual ? 12 : 1;
  const subtotal = basePrice * cycleMultiplier;
  const discount = discountApplied ? discountAmount : 0;
  const total = Math.max(0, subtotal - discount);

  // Effect to get the plan ID from localStorage
  useEffect(() => {
    try {
      const pendingPriceId = localStorage.getItem("pendingPriceId");
      console.log(`[ShoppingCartPage] Loaded pendingPriceId from localStorage: ${pendingPriceId}`);
      
      if (pendingPriceId && pendingPriceId !== "free") {
        // Determine if it's an annual plan
        const isAnnualPlan = pendingPriceId.includes("annual");
        setIsAnnual(isAnnualPlan);
        
        // Set the selected plan ID
        setSelectedPlanId(pendingPriceId);
      } else if (pendingPriceId === "free") {
        // Redirect to home if free plan
        navigate("/");
        toast.info("Free plan activated. No payment required.");
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      setError("Could not retrieve your selected plan. Please try again.");
    }
  }, [navigate]);

  // Handle plan type toggle (monthly/annual)
  const handlePlanTypeToggle = (checked: boolean) => {
    setIsAnnual(checked);
    
    // Update the price ID based on the new billing cycle
    if (selectedPlanId) {
      const currentPlanBase = selectedPlanId.split('_').slice(0, -1).join('_');
      const newPlanId = `${currentPlanBase}_${checked ? 'annual' : 'monthly'}`;
      
      if (PRICING_PLANS[newPlanId]) {
        setSelectedPlanId(newPlanId);
      }
    }
  };

  // Handle plan selection change
  const handlePlanChange = (planId: string) => {
    if (PRICING_PLANS[planId]) {
      setSelectedPlanId(planId);
    }
  };

  // Apply discount code
  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    // Simulate discount code validation
    // In a real app, this would call an API to validate the code
    setIsLoading(true);
    setTimeout(() => {
      const validCodes: Record<string, number> = {
        "LAUNCH20": 0.2, // 20% off
        "WELCOME10": 0.1, // 10% off
        "BETASIGNUP": 0.15 // 15% off
      };

      if (validCodes[discountCode.toUpperCase()]) {
        const discountPercent = validCodes[discountCode.toUpperCase()];
        const discountValue = subtotal * discountPercent;
        setDiscountAmount(discountValue);
        setDiscountApplied(true);
        toast.success(`Discount code applied: ${(discountPercent * 100).toFixed(0)}% off`);
      } else {
        toast.error("Invalid discount code");
        setDiscountApplied(false);
        setDiscountAmount(0);
      }
      setIsLoading(false);
    }, 1000);
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = async () => {
    if (!selectedPlanId || selectedPlanId === "free") {
      toast.error("Please select a plan to continue");
      return;
    }

    if (!session) {
      toast.error("You must be logged in to complete checkout");
      navigate("/LoginPage");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing secure checkout...");

    try {
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;

      if (!userId || !userEmail) {
        throw new Error("User details not available");
      }

      console.log(`ShoppingCartPage: Calling create_checkout_session for user ${userId}, email ${userEmail}, price ${selectedPlanId}`);
      
      const checkoutPayload: CreateCheckoutSessionRequest = {
        price_id: selectedPlanId,
        user_id: userId,
        user_email: userEmail,
        // Add discount code if applied
        ...(discountApplied && { discount_code: discountCode })
      };
      
      const response = await brain.create_checkout_session(checkoutPayload);

      if (response.ok) {
        const data = await response.json();
        if (data.checkout_url) {
          console.log("ShoppingCartPage: Checkout session created. Redirecting to Stripe...");
          toast.success("Redirecting to secure payment...", { id: toastId });
          window.location.href = data.checkout_url;
        } else {
          throw new Error("Checkout session response missing checkout_url.");
        }
      } else {
        const errorBody = await response.text();
        throw new Error(`Failed to create checkout session (status: ${response.status}): ${errorBody}`);
      }
    } catch (error: any) {
      console.error("ShoppingCartPage: Error creating Stripe checkout session:", error);
      toast.error("Could not initiate payment. Please try again or contact support.", { id: toastId });
      setError(`Payment initiation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // If still loading auth state, show loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Complete Your Purchase</CardTitle>
          <CardDescription>Review your plan selection before proceeding to payment</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Selected Plan Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selected Plan</h3>
            
            {selectedPlan ? (
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-xl font-bold">{selectedPlan.name}</h4>
                    <p className="text-muted-foreground">{selectedPlan.description}</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    ${selectedPlan.monthlyPrice.toFixed(2)}/{isAnnual ? "mo (billed annually)" : "month"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate("/")}
                >
                  Change Plan
                </Button>
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No plan selected. Please choose a plan from our pricing page.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/")}
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Billing Cycle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Cycle</h3>
            
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4 border border-border">
              <div className="space-y-1">
                <h4 className="font-medium">Billing Frequency</h4>
                <p className="text-sm text-muted-foreground">
                  {isAnnual ? "Annual billing (save 20%)" : "Monthly billing"}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={!isAnnual ? "font-semibold" : "text-muted-foreground"}>Monthly</span>
                <Switch 
                  checked={isAnnual}
                  onCheckedChange={handlePlanTypeToggle}
                  disabled={isLoading}
                />
                <span className={isAnnual ? "font-semibold" : "text-muted-foreground"}>Annual</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Discount Code Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Discount Code</h3>
            
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="discount-code">Have a discount code?</Label>
                <Input 
                  id="discount-code"
                  placeholder="Enter code here"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={isLoading || discountApplied}
                />
              </div>
              <Button 
                variant={discountApplied ? "outline" : "default"}
                onClick={discountApplied ? () => {
                  setDiscountApplied(false);
                  setDiscountAmount(0);
                  setDiscountCode("");
                } : handleApplyDiscount}
                disabled={isLoading || (!discountCode && !discountApplied)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : discountApplied ? (
                  "Remove"
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
            
            {discountApplied && (
              <div className="flex items-center text-green-600 text-sm">
                <Tag className="h-4 w-4 mr-2" />
                <span>Discount applied: ${discountAmount.toFixed(2)} off</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            
            <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discountApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold">
                <span>Total {isAnnual ? "(annually)" : "(monthly)"}</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {isAnnual ? 
                  `Billed annually as one payment of $${total.toFixed(2)}` : 
                  `Billed monthly at $${total.toFixed(2)}/month`
                }
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-4">
          {error && (
            <div className="w-full p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => navigate("/")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              className="sm:flex-1 gap-2"
              onClick={handleProceedToCheckout}
              disabled={isLoading || !selectedPlanId || selectedPlanId === "free"}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CreditCard className="h-4 w-4 mr-1" />
              Proceed to Checkout
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our <a href="/TermsOfServicePage" className="underline hover:text-primary">Terms of Service</a> and <a href="/PrivacyPolicyPage" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
