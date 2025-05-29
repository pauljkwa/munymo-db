import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "utils/authStore"; // Correct import for auth state
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import brain from "brain"; // Import brain client
import { CreateCheckoutSessionRequest } from "types"; // Import request type

// --- Constants ---
const PREDICTION_GAME_PATH = "/PredictionGamePage";
const SIGNUP_PATH = "/SignupPage";

// --- Component ---
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
    const { session, loading: authLoading } = useAuthStore((state) => ({
    session: state.session,
    loading: state.loading,
  })); // Use the correct store and select necessary state

  const [status, setStatus] = useState<
    "loading" | "waiting_session" | "processing" | "authenticated" | "error"
  >("loading");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasProcessedSession, setHasProcessedSession] = useState(false); // Flag to prevent re-processing

  // --- Effect: Handle Authentication ---
  useEffect(() => {
    console.log(
      `AuthCallbackPage Effect: Auth loading: ${authLoading}, Session exists: ${!!session}, Has processed: ${hasProcessedSession}`,
    );

    // Conditions for WAITING:
    // 1. Auth state is still loading.
    // 2. Auth loading is done, but no session has been detected yet.
    // 3. Auth loading is done, session detected, but we've ALREADY processed it.
    if (authLoading || !session || hasProcessedSession) {
      if (hasProcessedSession) {
        console.log(
          "AuthCallbackPage Effect: Already processed session, exiting effect.",
        );
      } else if (authLoading) {
        setStatus("loading");
        setStatusMessage("Waiting for authentication details...");
        console.log("AuthCallbackPage Effect: Auth is loading...");
      } else { // !session must be true here
        setStatus("waiting_session");
        setStatusMessage(
          "Authentication check complete, waiting for session details...",
        );
        console.log(
          "AuthCallbackPage Effect: Auth loading false, but no session yet. Waiting...",
        );
        
        // If we've been waiting too long without a session, show an error
        // This helps catch cases where the URL might be malformed or token expired
        const sessionCheckTimeout = setTimeout(() => {
          if (!session && !authLoading) {
            console.log("AuthCallbackPage: No session detected after timeout, showing error");
            setStatus("error");
            setErrorMessage("Authentication verification took too long. Please try signing in again.");
          }
        }, 5000); // 5 second timeout
        
        return () => clearTimeout(sessionCheckTimeout);
      }
      return; // Wait for the next effect run when state changes
    }

    // --- Conditions for PROCESSING: ---
    // authLoading is false AND session exists AND hasProcessedSession is false

    setHasProcessedSession(true); // Mark as processed IMMEDIATELY to prevent re-entry
    console.log("AuthCallbackPage: User session found:", session.user.email);
    toast.success("Email confirmed successfully!");
    setStatusMessage(
      `Authentication successful! Welcome ${session.user.email}. Preparing next step...`,
    );
    setStatus("processing"); // Indicate we're now processing the redirect logic

    // --- MYA-26: Conditional Redirect Logic (defined inside useEffect) ---
    const handleRedirect = async () => {
      let priceId: string | null = null;
      try {
        console.log("[AuthCallbackPage.tsx] handleRedirect: Attempting to get 'pendingPriceId' from localStorage.");
        priceId = localStorage.getItem("pendingPriceId");
        console.log(`[AuthCallbackPage.tsx] handleRedirect: Retrieved value for 'pendingPriceId': "${priceId}"`);

        if (priceId) {
          console.log(`[AuthCallbackPage.tsx] handleRedirect: Found priceId "${priceId}". Attempting to remove from localStorage.`);
          localStorage.removeItem("pendingPriceId");
          console.log(`AuthCallbackPage: Removed pendingPriceId: ${priceId} after retrieval.`);
        } else {
          console.log("AuthCallbackPage: No pendingPriceId found in localStorage.");
        }
      } catch (storageError) {
        console.error("AuthCallbackPage: Error accessing localStorage:", storageError);
        priceId = null;
      }

      console.log(`[AuthCallbackPage.tsx] handleRedirect: Checking condition: priceId ("${priceId}") && priceId !== "free"`);
      if (priceId && priceId !== "free") {
        // Paid plan flow
        console.log("[AuthCallbackPage.tsx] handleRedirect: Condition TRUE (Paid Plan Flow)");
        setStatusMessage("Email confirmed! Redirecting to shopping cart...");
        
        // Instead of creating checkout session directly, redirect to shopping cart page
        // The shopping cart page will read pendingPriceId from localStorage
        console.log("AuthCallbackPage: Redirecting to ShoppingCartPage");
        toast.success("Email confirmed! Preparing your order...");
        
        // Keep pendingPriceId in localStorage so shopping cart can access it
        localStorage.setItem("pendingPriceId", priceId);
        setTimeout(() => navigate("/shopping-cart-page"), 1500);
      } else {
        // Free plan or error reading priceId flow
        console.log(
          "[AuthCallbackPage.tsx] handleRedirect: Condition FALSE (Free Plan Flow)",
        );
        console.log(
          "AuthCallbackPage: Free plan or no priceId. Redirecting to game page.",
        );
        setStatus("authenticated");
        setStatusMessage(
          "Authentication successful! Redirecting to the game...",
        );
        setTimeout(() => {
          navigate(PREDICTION_GAME_PATH);
        }, 1500);
        // Invalid cleanup function removed here
      }
    };

    handleRedirect(); // Call the async redirect handler

  }, [session, authLoading, navigate, hasProcessedSession]); // Dependency array correctly placed

  // --- Render Logic ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      {/* Combined loading, waiting, and processing states show loader */}
      {status === "loading" ||
      status === "waiting_session" ||
      status === "processing" ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">{statusMessage}</p>
        </>
      ) : status === "authenticated" ? ( // Optional: Keep showing loader/message during final redirect phase
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">{statusMessage}</p>
        </>
      ) : (
        // Error state - better error messaging and actions
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold mb-2 text-destructive">Authentication Issue</p>
          <p className="mb-4">
            {errorMessage || "We couldn't verify your email. Please try again or contact support."}
          </p>
          <button
            onClick={() => navigate(SIGNUP_PATH)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Return to Signup
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthCallbackPage;