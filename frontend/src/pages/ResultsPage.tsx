import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Header } from "components/Header"; // Assuming Header component exists
import { Footer } from "components/Footer"; // Assuming Footer component exists
import brain from "brain";
import { GameResultResponse, UserScoreDetail } from "types"; // Assuming types exist for the response

const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pairId = searchParams.get("pairId");
  const [results, setResults] = useState<GameResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pairId) {
      setError("No prediction pair ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    console.log(`Fetching results for pairId: ${pairId}`);
    setIsLoading(true);
    setError(null);

    // Fetch data from the backend
    async function fetchResults() {
      try {
        // Ensure the parameter object structure matches the client expectation
        const response = await brain.get_results_for_pair({ pair_id: pairId }); 
        const data: GameResultResponse = await response.json(); // Type the response
        if (response.ok) {
           setResults(data);
           console.log("Results fetched:", data);
        } else {
           // Use detail from response if available, otherwise generate message
           const errorMsg = (data as any)?.detail || `Failed to fetch results (status: ${response.status})`;
           setError(errorMsg);
           console.error("Error fetching results:", errorMsg, data);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError(err instanceof Error ? err.message : "An unknown network or client error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResults();

    // Clean up function (optional, for potential future use)
    // return () => { /* Cleanup logic */ };

  }, [pairId]);

  const renderLoading = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );

  const renderError = () => (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Error Loading Results</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{error}</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-4">
          Go Back Home
        </Button>
      </CardContent>
    </Card>
  );
  
  // Render the actual results
  const renderResults = () => {
    if (!results) return <p>No results data available.</p>; // Should ideally not happen if loading/error handled

    const { 
      pair_id,
      date,
      company_a_ticker,
      company_b_ticker,
      actual_winner_ticker,
      actual_loser_ticker,
      performance_data,
      user_scores 
    } = results;

    const winnerPerf = performance_data[actual_winner_ticker];
    const loserPerf = performance_data[actual_loser_ticker];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Results: {company_a_ticker} vs {company_b_ticker}</CardTitle>
            <CardDescription>Game Date: {date} (Pair ID: {pair_id})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Outcome</h3>
              <p className="text-lg">
                <span className="font-bold text-primary">{actual_winner_ticker}</span> won against {actual_loser_ticker}.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Performance Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {winnerPerf && (
                  <div className="p-3 border rounded bg-muted/50">
                    <p className="font-semibold">{actual_winner_ticker} (Winner)</p>
                    {winnerPerf.error ? (
                      <p className="text-destructive">Error: {winnerPerf.error}</p>
                    ) : (
                      <p>Change: <span className={winnerPerf.change_percent >= 0 ? "text-green-600" : "text-red-600"}>{winnerPerf.change_percent?.toFixed(2)}%</span></p>
                      // <p className="text-sm text-muted-foreground">Open: {winnerPerf.open?.toFixed(2)}, Close: {winnerPerf.close?.toFixed(2)}</p>
                    )}
                  </div>
                )}
                {loserPerf && (
                  <div className="p-3 border rounded bg-muted/50">
                    <p className="font-semibold">{actual_loser_ticker} (Loser)</p>
                    {loserPerf.error ? (
                      <p className="text-destructive">Error: {loserPerf.error}</p>
                    ) : (
                      <p>Change: <span className={loserPerf.change_percent >= 0 ? "text-green-600" : "text-red-600"}>{loserPerf.change_percent?.toFixed(2)}%</span></p>
                      // <p className="text-sm text-muted-foreground">Open: {loserPerf.open?.toFixed(2)}, Close: {loserPerf.close?.toFixed(2)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {user_scores.length === 0 ? (
              <p>No predictions were submitted for this game.</p>
            ) : (
              <ul className="space-y-2">
                {user_scores.map((score, index) => (
                  <li key={score.prediction_id || index} className="flex justify-between items-center p-2 border rounded">
                    <span>User: {score.user_id}</span> 
                    {/* TODO: Replace user_id with profile name when available */} 
                    <span>Predicted: {score.predicted_ticker || "N/A"}</span>
                    <span className={score.is_correct ? "text-green-600 font-semibold" : "text-red-600"}>
                      {score.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Game Results</h1>
        {!pairId ? (
           <Card className="border-destructive">
            <CardHeader><CardTitle className="text-destructive">Missing Information</CardTitle></CardHeader>
            <CardContent>
              <p>No prediction pair ID was specified in the URL.</p>
               <Button onClick={() => navigate("/")} variant="outline" className="mt-4">
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          // Render the fetched results
          renderResults()
        )}
      </main>
      
    </div>
  );
};

export default ResultsPage;
