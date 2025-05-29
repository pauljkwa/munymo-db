import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Terminal, Loader2 } from "lucide-react"; // Removed ArrowUpDown
import brain from "brain";
import { SubmitPredictionRequest, SubmitPredictionResponse, LeaderboardResponse, LeaderboardEntry } from "brain/data-contracts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import StockCard from "components/StockCard"; // Import the new stock card component with professional design
import { toast } from "sonner";
import { useAuthStore } from "utils/authStore";
import { supabase } from "utils/supabaseClient";
import { API_URL, mode, Mode } from "app"; // Import mode detection
import { SandboxControls } from "components/SandboxControls"; // Import the new component

// Define the structure of the game data we expect from Supabase
interface GameData {
  id: number;
  exchange: string;
  game_date: string;
  company_a_ticker: string;
  company_a_name: string;
  company_b_ticker: string;
  company_b_name: string;
  sector: string;
  reasoning?: string | null;
  submitted_by_player_id?: string | null;
  next_day_clue?: string | null;
  status?: string | null;
}

// Define which columns are sortable
type SortableColumn = "rank" | "score" | "correct_ratio" | "avg_time" | "avg_response_time";

// Helper function to format seconds into M:SS format or display dash
const formatAverageTime = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "-";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
};

// Helper function to format milliseconds or display dash
const formatAvgSpeed = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return "-";
  }
  return `${Math.round(ms)} ms`;
};

// Helper function to format percentage or display dash
const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(2)}%`;
};

// Helper function to format score or display dash
const formatScore = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }
  return value.toFixed(2);
};

function PredictionGamePage() {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showThankYouPopup, setShowThankYouPopup] = useState<boolean>(false);
  const [decisionTime, setDecisionTime] = useState<number>(0);
  const [selectionTimestamp, setSelectionTimestamp] = useState<number | null>(null);
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedGameId, setSubmittedGameId] = useState<number | null>(null);
  const [pendingCheckoutPriceId, setPendingCheckoutPriceId] = useState<string | null>(null);
  const checkoutCheckPerformed = useRef(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState<boolean>(false);
  const [leaderboardTimeFrame, setLeaderboardTimeFrame] = useState<string>("month");

  // Next Day Clue State
  const [nextDayClue, setNextDayClue] = useState<string | null>(null);
  const [isClueLoading, setIsClueLoading] = useState<boolean>(true);

  // Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>('asx'); // Added exchange selector state
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  // We keep sortBy and sortOrder for backward compatibility during transition
  const [sortBy, setSortBy] = useState<SortableColumn>('rank');
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (column: SortableColumn) => {
    const isAsc = sortBy === column && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortBy(column);
    setOffset(0);
    console.log(`[DEBUG] Sorting changed: sortBy=${column}, sortOrder=${isAsc ? 'desc' : 'asc'}`);
  };

  // Game Timing State
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [predictionDeadline, setPredictionDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isUrgentTime, setIsUrgentTime] = useState<boolean>(false);
  const [isPredictionWindowClosed, setIsPredictionWindowClosed] = useState<boolean>(false);
  
  // UI Animation State
  const [pulseAnimation, setPulseAnimation] = useState<boolean>(false);

  // Game Timer State variables
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log(`[DEBUG] Initial State: isGameActive=${isGameActive}, submittedGameId=${submittedGameId}, loading=${loading}, error=${error}, currentGame=${currentGame ? currentGame.id : null}, predictionDeadline=${predictionDeadline}`);

  // Set up timer when the game starts and fetch game data
  const handleStartGame = async () => {
    // Start loading
    setLoading(true);
    
    console.log("[DEBUG] handleStartGame called - NOW loading sensitive game data.");
    
    // 1. First set game as active (shows loading state)
    setIsGameActive(true);
    
    // 2. IMPORTANT: Fetch game data ONLY after player has started game
    // This is the key security change - no game details are fetched until now
    await fetchTodaysGame();
    
    // 3. Record the start timestamp for decision time calculation
    setSelectionTimestamp(Date.now());
    
    // 4. Always clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 5. Start the timer if we have a deadline
    if (predictionDeadline) {
      const updateTimer = () => {
        const now = new Date();
        const diff = predictionDeadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("00:00:00");
          setIsPredictionWindowClosed(true);
          setIsUrgentTime(false);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          const newTimeRemaining = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          
          if (newTimeRemaining !== timeRemaining) {
            setTimeRemaining(newTimeRemaining);
          }
          
          setIsPredictionWindowClosed(false);
          
          // Update urgency indicator - less than 5 minutes remaining
          const newUrgency = diff <= 5 * 60 * 1000;
          if (newUrgency !== isUrgentTime) {
            setIsUrgentTime(newUrgency);
          }
        }
      };

      // Run immediately
      updateTimer();

      // Then set interval
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      console.warn("[DEBUG] Cannot start timer: predictionDeadline is null");
    }
    
    // Done loading
    setLoading(false);
  };

  const { session, loading: authLoading } = useAuthStore((state) => ({
    session: state.session,
    loading: state.loading,
  }));

  // We now set selection timestamp when game starts, not when component loads
  // This ensures decision time is measured from when player starts seeing the options

  // Format average time (seconds) to human-readable format
  const formatAverageTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  };
  
  // Format decision time for display in ms to human-readable format
  const formatDecisionTime = (ms: number): string => {
    const seconds = ms / 1000;
    if (seconds < 1) {
      return `${(ms).toFixed(0)} milliseconds`;
    } else if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  };
  
  // Stage 1: Check if game exists without fetching sensitive details
  // This only checks if a game is scheduled, not the actual company details
  useEffect(() => {
    console.log("[DEBUG] Initial game availability check. AuthLoading:", authLoading, "Session:", !!session);
    const checkGameAvailability = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split("T")[0];
        console.log(`[DEBUG] Checking if game exists for date: ${today} (no sensitive data fetched yet)`);

        // Only check if game exists without fetching full details
        const { count, error: countError } = await supabase
          .from("asx_games")
          .select("id", { count: "exact" })
          .eq("game_date", today)
          .eq("status", "scheduled");

        if (countError) {
          console.error("[DEBUG] Error checking game availability:", countError);
          throw new Error(countError.message || "Failed to check game availability.");
        }

        if (!count || count === 0) {
          console.log("[DEBUG] No game scheduled for today.");
          setError("No game scheduled for today. Check back tomorrow!");
        }
        // Don't fetch game details yet - we'll do that after game starts
      } catch (err: any) {
        console.error("[DEBUG] Failed to check game availability:", err);
        setError(err.message || "An unexpected error occurred while checking for today's game.");
      } finally {
        setLoading(false);
      }
    };
    
    // Stage 1: Only check if a game exists
    checkGameAvailability();
    
    // Next day clue is okay to fetch immediately as it doesn't reveal current game details
    const fetchNextClue = async () => {
      setIsClueLoading(true);
      try {
        const response = await brain.get_next_game_clue();
        const data = await response.json();
        setNextDayClue(data.next_day_clue || null);
      } catch (err) {
        console.error("[DEBUG] Error fetching next day clue:", err);
        setNextDayClue(null);
      } finally {
        setIsClueLoading(false);
      }
    };

    // Only fetch next day clue initially - game details will be fetched on start
    fetchNextClue();

    // Checkout Logic
    if (!checkoutCheckPerformed.current) {
      try {
        const priceId = localStorage.getItem('pendingPriceId');
        if (priceId) {
          console.log(`PredictionGamePage: Found pendingPriceId in localStorage: ${priceId}`);
          setPendingCheckoutPriceId(priceId);
          localStorage.removeItem('pendingPriceId');
          console.log('PredictionGamePage: Cleared pendingPriceId from localStorage.');

          if (!authLoading && session) {
            const currentSubscriptionTier = session.user?.app_metadata?.subscription_tier;
            console.log('PredictionGamePage: Current user subscription_tier:', currentSubscriptionTier);

            if (currentSubscriptionTier && currentSubscriptionTier !== 'free') {
              console.log('PredictionGamePage: User has active paid subscription. Clearing pending checkout.');
              setPendingCheckoutPriceId(null);
            } else {
              console.log(`PredictionGamePage: User tier is '${currentSubscriptionTier || "undefined"}'. Initiating checkout.`);
              const initiateCheckout = async (priceIdToCheckout: string) => {
                if (isRedirectingToCheckout) return;
                setIsRedirectingToCheckout(true);
                const toastId = toast.loading("Preparing secure checkout...");
                try {
                  console.log(`PredictionGamePage: Calling create_checkout_session for priceId: ${priceIdToCheckout}`);
                  // const response = await brain.create_checkout_session({ price_id: priceIdToCheckout }); // KEEP COMMENTED for now
                  console.warn("MYA-20 TODO: Re-enable brain.create_checkout_session call if needed");
                  toast.info("Checkout simulation complete.", { id: toastId }); // Simulation
                  setIsRedirectingToCheckout(false); // Simulation
                  setPendingCheckoutPriceId(null); // Simulation
                  /* // Original brain call logic:
                  if (!response.ok) { throw new Error(`Checkout session failed (status: ${response.status})`); }
                  const data = await response.json();
                  if (!data.checkout_url) throw new Error("Checkout URL missing.");
                  toast.success("Redirecting to secure checkout...", { id: toastId });
                  window.location.href = data.checkout_url;
                  */
                } catch (error: any) {
                  console.error("PredictionGamePage: Error during checkout:", error);
                  toast.error(`Checkout failed: ${error.message || "Unknown error"}`, { id: toastId });
                  setIsRedirectingToCheckout(false);
                  setPendingCheckoutPriceId(null);
                }
              };
              if (priceId && !isRedirectingToCheckout) {
                initiateCheckout(priceId);
              }
            }
          } else {
            console.log('PredictionGamePage: Auth loading or no session, cannot check subscription for pending checkout yet.');
            if (!authLoading && !session) setPendingCheckoutPriceId(null);
          }
        } else {
          console.log('PredictionGamePage: No pendingPriceId found.');
        }
      } catch (e) {
        console.error('PredictionGamePage: Error accessing localStorage:', e);
      }
      checkoutCheckPerformed.current = true;
    }
  }, [authLoading, session]);
  
  // Stage 2: Fetch sensitive game details ONLY after player starts the game
  // This prevents game details from appearing in console before player starts
  const fetchTodaysGame = async () => {
    console.log("[DEBUG] fetchTodaysGame started AFTER player clicked start.");
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error: dbError } = await supabase
        .from("asx_games")
        .select("*")
        .eq("game_date", today)
        .eq("status", "scheduled")
        .limit(1)
        .single();

      if (dbError) {
        if (dbError.code === "PGRST116") {
          console.log("[DEBUG] No game scheduled for today found in Supabase.");
          setError("No game scheduled for today. Check back tomorrow!");
        } else {
          console.error("[DEBUG] Supabase fetch error:", dbError);
          throw new Error(dbError.message || "Failed to fetch game data from database.");
        }
      }

      if (data) {
        // Now that game has started, we can safely set the game data
        const game = data as GameData;
        setCurrentGame(game);

        if (session?.user?.id) {
          const userId = session.user.id;
          const gameId = game.id;
          
          const { data: predictionRecord, error: predictionError } = await supabase
            .from("predictions")
            .select("predicted_ticker")
            .eq("user_id", userId)
            .eq("pair_id", String(gameId))
            .maybeSingle();

          if (predictionError) {
            console.error("[DEBUG] Error checking for existing prediction:", predictionError);
            setSubmittedGameId(null);
          } else if (predictionRecord) {
            let predictedCompanyName = "Unknown";
            if (predictionRecord.predicted_ticker === game.company_a_ticker) {
              predictedCompanyName = game.company_a_name;
            } else if (predictionRecord.predicted_ticker === game.company_b_ticker) {
              predictedCompanyName = game.company_b_name;
            }
            setPrediction(predictedCompanyName);
            setSubmittedGameId(game.id);
            setSelectedTicker(predictionRecord.predicted_ticker);
          } else {
            setPrediction(null);
            setSubmittedGameId(null);
            setSelectedTicker(null);
          }
        } else {
           setPrediction(null);
           setSubmittedGameId(null);
           setSelectedTicker(null);
        }
      } else if (!dbError) {
         setError("No game scheduled for today. Check back tomorrow!");
         setCurrentGame(null);
         setSubmittedGameId(null);
      }
    } catch (err: any) {
      console.error("[DEBUG] Failed to fetch today's game:", err);
      if (!error) setError(err.message || "An unexpected error occurred while fetching the game.");
      setCurrentGame(null);
      setSubmittedGameId(null);
    } finally {
      console.log("[DEBUG] fetchTodaysGame finished.");
      setLoading(false);
    }
  };

  // Set Prediction Deadline Effect
  useEffect(() => {
     console.log(`[DEBUG] Prediction Deadline Effect triggered. currentGame: ${currentGame ? currentGame.id : null}, current predictionDeadline: ${predictionDeadline}`);
    if (currentGame && !predictionDeadline) {
      const gameDateStr = currentGame.game_date;
      const gameDateParts = gameDateStr.split("-").map(Number);
      if (gameDateParts.length === 3 && !gameDateParts.some(isNaN) && gameDateParts[1] >= 1 && gameDateParts[1] <= 12 && gameDateParts[2] >= 1 && gameDateParts[2] <= 31) {
         const year = gameDateParts[0];
         const month = gameDateParts[1] - 1;
         const day = gameDateParts[2];
         const gameDateMidnightLocal = new Date(year, month, day, 0, 0, 0, 0);
         const deadlineLocal = new Date(gameDateMidnightLocal);
         deadlineLocal.setHours(10, 0, 0, 0);
         console.log(`[DEBUG] Setting prediction deadline. Derived from ${gameDateStr}. Target: 10 AM local.`);
         console.log(`[DEBUG] Calculated local deadline time object:`, deadlineLocal);
         if (!isNaN(deadlineLocal.getTime())) {
             console.log("[DEBUG] Successfully created Date object (Local):", deadlineLocal.toString(), "getTime():", deadlineLocal.getTime());
             setPredictionDeadline(deadlineLocal);
         } else {
             console.error(`[DEBUG] Failed to create valid date for prediction deadline.`);
             setError("Could not determine prediction deadline (Invalid Date).");
             setPredictionDeadline(null);
         }
      } else {
         console.error(`[DEBUG] Invalid game_date format or parts: ${gameDateStr}`);
         setError("Could not determine prediction deadline (Invalid Game Date).");
         setPredictionDeadline(null);
      }
    } else if (!currentGame && predictionDeadline) {
       console.log("[DEBUG] currentGame is null, clearing predictionDeadline.");
       setPredictionDeadline(null);
    }
  }, [currentGame]);

  // Countdown Timer Effect - Improved with useRef to prevent memory leaks
  useEffect(() => {
    console.log(`[DEBUG] Timer Effect triggered. predictionDeadline: ${predictionDeadline}, submittedGameId: ${submittedGameId}, currentGame: ${currentGame ? currentGame.id : null}, isPredictionWindowClosed: ${isPredictionWindowClosed}`);

    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // We still want to show the timer on the ready screen or when the game is active but not submitted
    if (!predictionDeadline || !currentGame) {
      console.log("[DEBUG] Timer conditions not met: no predictionDeadline or no currentGame. Clearing timer.");
      if (!isPredictionWindowClosed && timeRemaining !== "") {
        setTimeRemaining("");
      }
      if (isUrgentTime) {
        setIsUrgentTime(false);
      }
      return;
    }

    // If the window is closed or submission is made, we still want to show the timer but not count down
    if (isPredictionWindowClosed || submittedGameId !== null) {
      console.log("[DEBUG] Prediction window closed or game submitted, not starting new timer.");
      return;
    }

    // Function to update the time remaining
    const updateTimer = () => {
      if (!predictionDeadline) {
        console.warn("[DEBUG] predictionDeadline became null inside interval.");
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        return;
      }

      const now = new Date();
      const diff = predictionDeadline.getTime() - now.getTime();

      if (diff <= 0) {
        console.log("[DEBUG] Timer: Time is up. Setting prediction window closed.");
        setTimeRemaining("00:00:00");
        setIsPredictionWindowClosed(true);
        setIsUrgentTime(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const newTimeRemaining = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        
        if (newTimeRemaining !== timeRemaining) {
          setTimeRemaining(newTimeRemaining);
        }
        
        setIsPredictionWindowClosed(false);
        
        // Update urgency indicator - less than 5 minutes remaining
        const newUrgency = diff <= 5 * 60 * 1000;
        if (newUrgency !== isUrgentTime) {
          setIsUrgentTime(newUrgency);
        }
      }
    };

    // Run once immediately to avoid delay
    updateTimer();
    
    // Start interval
    console.log("[DEBUG] Timer conditions met. Starting interval.");
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      console.log("[DEBUG] Timer cleanup function running.");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [predictionDeadline, submittedGameId, currentGame, isPredictionWindowClosed, timeRemaining, isUrgentTime]);

  // Use API endpoint for next game clue instead of querying Supabase directly
  useEffect(() => {
    const fetchNextDayClue = async () => {
      setIsClueLoading(true);
      try {
        const response = await brain.get_next_game_clue();
        const data = await response.json();
        setNextDayClue(data.next_day_clue || null);
      } catch (error) {
        console.error("[DEBUG] Error fetching next day clue:", error);
        setNextDayClue(null);
      } finally {
        setIsClueLoading(false);
      }
    };
    
    // Fetch the next day clue whenever the game status changes
    fetchNextDayClue();
    
    // Also set up a refresh interval to check for updated clues
    const refreshInterval = setInterval(fetchNextDayClue, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [isPredictionWindowClosed]);

  // Leaderboard Fetch Effect
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      // Use selectedExchange instead of hardcoded value
      console.log(`[DEBUG] Fetching leaderboard: exchange=${selectedExchange}, sortBy=${sortBy}, sortOrder=${sortOrder}, limit=${limit}, offset=${offset}`);
      try {
        // Get Supabase token
        const { data: { session: currentAuthSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !currentAuthSession?.access_token) {
          console.error("[DEBUG] Failed to get Supabase session/token for leaderboard fetch:", sessionError);
          throw new Error("Authentication error. Please log in again.");
        }
        const token = currentAuthSession.access_token;
        console.log("[DEBUG] Got Supabase token for leaderboard fetch:", token ? "Yes" : "No");

        // Pass token in headers - Updated to use selectedExchange
        const response = await brain.get_leaderboard(
            { exchange: selectedExchange, sort_by: sortBy, sort_order: sortOrder, limit, offset },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          let errorDetail = "Failed to fetch leaderboard.";
          try { errorDetail = (await response.json())?.detail || errorDetail; } catch (e) {}
          throw new Error(errorDetail);
        }
        const data: LeaderboardResponse = await response.json();
        setLeaderboardData(data);
        console.log("[DEBUG] Leaderboard data fetched successfully:", data);
      } catch (err: any) {
        console.error("[DEBUG] Failed to fetch leaderboard:", err);
        const msg = err.message || "An unexpected error occurred while fetching the leaderboard.";
        setLeaderboardError(msg);
        setLeaderboardData(null);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    if (session) fetchLeaderboard();
    else {
        setLeaderboardLoading(false);
        setLeaderboardError("Log in to view the leaderboard.");
        setLeaderboardData(null);
    }
  }, [session, selectedExchange, sortBy, sortOrder, limit, offset]);

  // Handle Confirmation - called before submission
  const handleConfirmSelection = () => {
    if (!selectedTicker || !currentGame) return;
    
    // Calculate time from game start or last loading to selection
    const now = Date.now();
    const startTime = selectionTimestamp || now - 30000; // Default to 30 seconds if no timestamp
    const calculatedDecisionTime = now - startTime;
    
    setDecisionTime(calculatedDecisionTime);
    setShowThankYouPopup(true);
  };
  
  // Close thank you popup and submit prediction
  const handleCloseThankYouPopup = () => {
    setShowThankYouPopup(false);
    handleSubmit();
  };
  
  // Handle backdrop click for the popup
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseThankYouPopup();
    }
  };

  // Handle Submission
  const handleSubmit = async () => {
    if (isPredictionWindowClosed && mode !== Mode.DEV) { toast.warning("The prediction window for today's game has closed."); return; } // Bypass for DEV
    if (!selectedTicker) { toast.warning("Please select a company first."); return; }
    if (!currentGame) { toast.error("Game data is missing. Please refresh."); return; }
    if (isSubmitting) { toast.info("Submission already in progress..."); return; }
    if (submittedGameId !== null) { toast.info("You have already submitted a prediction for today's game."); return; }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your prediction...");
    const predictedCompanyName = selectedTicker === currentGame.company_a_ticker ? currentGame.company_a_name : currentGame.company_b_name;
    const requestBody: SubmitPredictionRequest = { pair_id: String(currentGame.id), predicted_ticker: selectedTicker };

    try {
      console.log("[DEBUG] Submitting prediction (manual fetch). Body:", requestBody);
      const { data: { session: currentAuthSession }, error: sessionError } = await supabase.auth.getSession(); // Renamed to avoid conflict
      if (sessionError || !currentAuthSession?.access_token) {
        console.error("[DEBUG] Failed to get Supabase session or token for submission:", sessionError);
        throw new Error("Authentication error. Please log in again.");
      }
      const token = currentAuthSession.access_token;
      console.log("[DEBUG] Got Supabase token for submission:", token ? "Yes" : "No");

      const response = await fetch(`${API_URL}/predictions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(mode === Mode.DEV && { credentials: "include" }),
        body: JSON.stringify(requestBody),
      });
      console.log("[DEBUG] Manual fetch response status:", response.status);

      if (!response.ok) {
        let errorDetail = "Failed to submit prediction.";
        let errorJson: { detail?: string; message?: string } | null = null;
        try { errorJson = await response.json(); errorDetail = errorJson?.message || errorJson?.detail || `Status: ${response.status}`; } catch (e) { errorDetail = `${response.status} - ${response.statusText || errorDetail}`; }
        if (response.status === 409 && errorJson?.message === "You have already submitted a prediction for this game.") {
            toast.info(errorJson.message, { id: toastId });
            setPrediction(predictedCompanyName);
            setSubmittedGameId(currentGame.id);
        } else if (response.status === 401) {
           console.error("[DEBUG] Manual fetch failed with 401:", errorDetail);
           throw new Error("Authentication failed. Please log out and log back in.");
        } else {
          console.error("[DEBUG] Manual fetch failed:", errorDetail);
          throw new Error(errorDetail);
        }
      } else {
         const result: SubmitPredictionResponse = await response.json();
         console.log("[DEBUG] Prediction submitted successfully (manual fetch):", result);

         // Prepare success message with conditional clue
         let baseSuccessMessage = result?.message || "Prediction submitted successfully!";
         let finalSuccessMessage = baseSuccessMessage;
         if (nextDayClue) {
           finalSuccessMessage += ` Next game's clue: ${nextDayClue}`;
         } else if (!isClueLoading) { // Only mention if loading finished and no clue found
           finalSuccessMessage += " (No clue available for the next game yet.)";
         }

         setPrediction(predictedCompanyName);
         setSubmittedGameId(currentGame.id);
         toast.success(finalSuccessMessage, { id: toastId }); // Use the final message
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      console.error("Failed to submit prediction (Caught Error):", errorMessage);
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic --- //
  console.log(`[DEBUG] Render Cycle: isGameActive=${isGameActive}, submittedGameId=${submittedGameId}, loading=${loading}, error=${error}, currentGame=${currentGame ? currentGame.id : null}, timeRemaining='${timeRemaining}', predictionDeadline=${predictionDeadline}`);

  // Loading State
  // Add a timeout to prevent infinite loading state in development
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        if (loading && mode === Mode.DEV) {
          console.log("[DEBUG] Loading timeout reached, providing fallback game data for development");
          setLoading(false);
          setError(null);
          
          // Create mock game data for development
          if (!currentGame && mode === Mode.DEV) {
            const mockGame: GameData = {
              id: 999,
              exchange: "ASX",
              game_date: new Date().toISOString().split("T")[0],
              company_a_ticker: "AAPL",
              company_a_name: "Apple Inc.",
              company_b_ticker: "MSFT",
              company_b_name: "Microsoft Corporation",
              sector: "Technology",
              reasoning: "Mock game for development testing",
              status: "scheduled"
            };
            setCurrentGame(mockGame);
            setPredictionDeadline(new Date(Date.now() + 30 * 60 * 1000)); // 30 minutes from now
            
            // Don't start the game immediately - let user click the start button
            setIsGameActive(false);
          }
        }
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, mode, currentGame]);
  
  // Force development preview to show the game (skip long loading)
  useEffect(() => {
    if (mode === Mode.DEV && !currentGame && !error) {
      // Immediately set up a test game without waiting for the timeout
      setLoading(false);
      const mockGame: GameData = {
        id: 999,
        exchange: "ASX",
        game_date: new Date().toISOString().split("T")[0],
        company_a_ticker: "AAPL",
        company_a_name: "Apple Inc.",
        company_b_ticker: "MSFT",
        company_b_name: "Microsoft Corporation",
        sector: "Technology",
        reasoning: "Mock game for development testing",
        status: "scheduled"
      };
      setCurrentGame(mockGame);
      setPredictionDeadline(new Date(Date.now() + 30 * 60 * 1000)); // 30 minutes from now
      setIsGameActive(false); // Important: Start in pre-game state
    }
  }, [mode]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Card className="mb-8"><CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
      </div>
    );
  }

  // Error State
  if (error) {
    if (error === "No game scheduled for today. Check back tomorrow!") {
      return (<div className="container mx-auto p-4 md:p-8 max-w-4xl text-center"><Card className="inline-block p-6"><CardHeader><CardTitle>No Game Today</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{error}</p></CardContent></Card></div>);
    }
    return (<div className="container mx-auto p-4 md:p-8 max-w-4xl"><Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error} Please try refreshing the page.</AlertDescription></Alert></div>);
  }

  // Pre-Game Overlay
  if (!isGameActive && !loading && !error && currentGame) {
      return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
            <Card className="inline-block shadow-md border-muted-foreground/40">
                <CardHeader>
                    <CardTitle className="text-2xl">Ready to Play?</CardTitle>
                    <CardDescription>Today's Prediction Game: ASX - Predictions close at 10:00 AM</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-2">The prediction window closes soon. Click start when you're ready.</p>
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                            Once you click Start Game, the timer will begin! Make your prediction as quickly as possible for the best score.
                        </AlertDescription>
                    </Alert>
                    <div className="flex flex-col items-center space-y-4">
                        <Button 
                            size="lg" 
                            onClick={handleStartGame}
                            className={`transition-all duration-300 ${pulseAnimation ? 'animate-pulse scale-105' : ''}`}
                            onMouseEnter={() => setPulseAnimation(true)}
                            onMouseLeave={() => setPulseAnimation(false)}
                        >
                            Start Game
                        </Button>
                        <div className="flex flex-col items-center w-full max-w-xs space-y-2 mt-2">
                          {timeRemaining ? (
                            <Card className="py-3 px-4 w-full border-muted-foreground/30 h-[80px] flex flex-col justify-center items-center">
                                <p className={`font-bold text-xl tabular-nums ${isUrgentTime ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                                    {timeRemaining}
                                </p>
                                <p className="text-xs text-muted-foreground">Time Remaining</p>
                            </Card>
                          ) : predictionDeadline ? (
                            <Card className="py-3 px-4 w-full border-muted-foreground/30 h-[80px] flex flex-col justify-center items-center">
                                <p className="text-muted-foreground">Loading timer...</p>
                            </Card>
                          ) : null}
                          {/* Render closed message using state */}
                          {isPredictionWindowClosed && (
                            <Card className="py-3 px-4 w-full bg-destructive/10 border-destructive/30 h-[80px] flex flex-col justify-center items-center">
                                <p className="font-semibold text-destructive">
                                    Prediction Window Closed
                                </p>
                            </Card>
                          )}
                        </div>

                    </div>
                    {/* Provide next day clue here when available */}
                    {nextDayClue && (
                      <div className="mt-6 p-3 border rounded-md border-primary/30 bg-primary/5">
                        <p className="text-xs font-medium text-primary mb-1">TOMORROW'S GAME CLUE</p>
                        <p className="text-sm">{nextDayClue}</p>
                      </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Only display leaderboard and game history in pre-game state */}
            {session && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboardLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : leaderboardError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{leaderboardError}</AlertDescription>
                      </Alert>
                    ) : leaderboardData && leaderboardData.players && leaderboardData.players.length > 0 ? (
                      <>
                        <div className="flex flex-col space-y-4">
                          {/* Exchange selector */}
                          <div className="flex justify-between items-center mb-2">
                            <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select Exchange" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asx">ASX</SelectItem>
                                <SelectItem value="nyse">NYSE</SelectItem>
                                <SelectItem value="nasdaq">NASDAQ</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select value={leaderboardTimeFrame} onValueChange={setLeaderboardTimeFrame}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select Timeframe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                  
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Rank</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-right" onClick={() => handleSort("score")}>
                                  Score
                                </TableHead>
                                <TableHead className="text-right" onClick={() => handleSort("correct_ratio")}>
                                  Win Rate
                                </TableHead>
                                <TableHead className="text-right" onClick={() => handleSort("avg_time")}>
                                  Avg Time
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {leaderboardData.players.map((player) => (
                                <TableRow key={player.user_id}>
                                  <TableCell className="font-medium">{player.rank}</TableCell>
                                  <TableCell className="flex items-center space-x-2">
                                    <span className="font-medium truncate max-w-[140px]">{player.display_name || player.username || "Anonymous"}</span>
                                    {player.is_current_user && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                                  </TableCell>
                                  <TableCell className="text-right">{formatScore(player.score)}</TableCell>
                                  <TableCell className="text-right">{formatPercentage(player.correct_ratio)}</TableCell>
                                  <TableCell className="text-right">{formatAverageTime(player.avg_time)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                         
                          <div className="flex justify-between items-center mt-4">
                             <span className="text-sm text-muted-foreground">
                                Showing {leaderboardData.players.length} of {leaderboardData.total_players} players
                             </span>
                             <div className="flex items-center space-x-2">
                                <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setOffset(Math.max(0, offset - limit))}
                                   disabled={offset === 0}
                                >
                                   Previous
                                </Button>
                                <span>Page {Math.floor(offset / limit) + 1} of {Math.ceil(leaderboardData.total_players / limit)}</span>
                                <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setOffset(offset + limit)}
                                   disabled={offset + limit >= leaderboardData.total_players}
                                >
                                   Next
                                </Button>
                             </div>
                         </div>
                       </div>
                     </>
                   ) : (
                      <p className="text-center text-muted-foreground py-4">No leaderboard data available yet.</p>
                   )}
                  </CardContent>
                </Card>

                {/* Past Predictions Section (Placeholder) */}
                <Card className="mt-8">
                   <CardHeader><CardTitle>Your Past Predictions</CardTitle></CardHeader>
                   <CardContent>
                       <p className="text-center text-muted-foreground py-4">No past predictions recorded.</p>
                   </CardContent>
                </Card>
              </div>
            )}

            {/* Thank You Popup */}
            {showThankYouPopup && (
              <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={handleBackdropClick}
              >
                <Card className="max-w-md w-full bg-card" onClick={(e) => e.stopPropagation()}>
                  <CardHeader>
                    <CardTitle>Thank You!</CardTitle>
                    <CardDescription>Your prediction has been confirmed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      You selected <span className="font-bold">{currentGame?.company_a_ticker === selectedTicker ? currentGame?.company_a_name : currentGame?.company_b_name}</span>.
                    </p>
                    <div className="bg-muted p-3 rounded-md mb-4">
                      <p className="text-sm font-medium">Decision time: <span className="font-bold">{formatDecisionTime(decisionTime)}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Fast decisions can boost your MunyIQ score!</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleCloseThankYouPopup} className="w-full">Submit</Button>
                  </CardFooter>
                </Card>
              </div>
            )}
        </div>
      );
  }

  // Actual Game Screen (only shown after Start Game is clicked)
  if (isGameActive && currentGame) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Today's Prediction</h1>
            <p className="text-muted-foreground">
              {currentGame.sector} - ASX
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Card className={`py-2 px-3 border ${isUrgentTime ? 'border-destructive animate-pulse' : 'border-muted-foreground/30'}`}>
              <p className={`font-mono text-lg tabular-nums ${isUrgentTime ? 'text-destructive' : 'text-muted-foreground'}`}>
                {timeRemaining}
              </p>
            </Card>
            {isPredictionWindowClosed && (
              <Alert variant="destructive" className="py-1 px-2 h-[40px] flex items-center">
                <span className="text-xs font-medium">Prediction Window Closed</span>
              </Alert>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Alert className="bg-muted">
            <AlertTitle>Who will perform better today?</AlertTitle>
            <AlertDescription>
              Select the company you predict will have a better stock performance by market close today.
            </AlertDescription>
          </Alert>
        </div>

        {submittedGameId !== null ? (
          <Card className="p-6 text-center border-primary/50 bg-primary/5">
            <CardTitle className="mb-4 text-xl">Prediction Submitted</CardTitle>
            <p className="mb-6">You predicted <span className="font-bold">{prediction}</span> will perform better today.</p>
            <p className="text-sm text-muted-foreground">Results will be available after market close.</p>
            
            {nextDayClue && (
              <div className="mt-8 p-4 border rounded-md border-muted">
                <h3 className="text-sm font-medium mb-2">Tomorrow's Game Clue:</h3>
                <p className="text-sm text-muted-foreground">{nextDayClue}</p>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Company A Card */}
            <StockCard
              companyName={currentGame.company_a_name}
              ticker={currentGame.company_a_ticker}
              sector={currentGame.sector}
              exchange={currentGame.exchange}
              isSelected={selectedTicker === currentGame.company_a_ticker}
              onSelect={() => {
                setSelectedTicker(currentGame.company_a_ticker);
                handleConfirmSelection();
              }}
              isDisabled={isPredictionWindowClosed}
            />

            {/* Company B Card */}
            <StockCard
              companyName={currentGame.company_b_name}
              ticker={currentGame.company_b_ticker}
              sector={currentGame.sector}
              exchange={currentGame.exchange}
              isSelected={selectedTicker === currentGame.company_b_ticker}
              onSelect={() => {
                setSelectedTicker(currentGame.company_b_ticker);
                handleConfirmSelection();
              }}
              isDisabled={isPredictionWindowClosed}
            />
          </div>
        )}

        {/* Reasoning (if available) */}
        {currentGame.reasoning && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI-Generated Investment Analysis</CardTitle>
              <CardDescription>Comparative analysis for today's stock pair</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {currentGame.reasoning.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="italic">Note: This analysis is generated by AI and should not be considered financial advice.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thank You Popup */}
        {showThankYouPopup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <Card className="max-w-md w-full bg-card" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Thank You!</CardTitle>
                <CardDescription>Your prediction has been confirmed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  You selected <span className="font-bold">{currentGame?.company_a_ticker === selectedTicker ? currentGame?.company_a_name : currentGame?.company_b_name}</span>.
                </p>
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="text-sm font-medium">Decision time: <span className="font-bold">{formatDecisionTime(decisionTime)}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Fast decisions can boost your MunyIQ score!</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCloseThankYouPopup} className="w-full">Submit</Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Sandbox Controls (DEV only) */}
        {mode === Mode.DEV && <div className="mt-8"><SandboxControls /></div>}
      </div>
    );
  }

  // Fallback if no state matches (should ideally not be reached)
  return (
    <Card 
      className={`container mx-auto p-4 md:p-8 max-w-4xl text-center bg-card text-card-foreground border-border`}
    >
      <p className="py-4">Loading game state...</p>
    </Card>
  );
}

export default PredictionGamePage;