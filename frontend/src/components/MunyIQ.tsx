import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Trophy, TrendingUp, TrendingDown, Clock, Target, Zap, Award, AlertTriangle } from "lucide-react";
import { useAuthStore } from "utils/authStore";
import { useProfileStore } from "utils/profileStore";
import brain from "brain";
import { toast } from "sonner";

// Define TypeScript interfaces for our data structures
interface MunyIQScoreDetail {
  munyiq_id: string;
  user_id: string;
  munyiq_score: number;
  total_games: number;
  correct_games: number;
  accuracy_score: number;
  consistency_score: number;
  speed_score: number;
  participation_score: number;
  improvement_score?: number;
  calculation_date: string;
  improved_since_last?: boolean;
}

interface MunyIQHistoryEntry {
  calculation_date: string;
  munyiq_score: number;
}

interface MunyIQResponse {
  current_score: MunyIQScoreDetail;
  previous_scores: MunyIQHistoryEntry[];
  subscribed_since: string;
  games_until_next_calculation?: number;
}

interface StatsResponse {
  average_score: number;
  median_score: number;
  percentile_rank: number;
  total_users_with_scores: number;
  global_distribution: Record<string, number>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function MunyIQ() {
  const { session } = useAuthStore();
  const { profile } = useProfileStore();
  
  const [scoreData, setScoreData] = useState<MunyIQResponse | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert API data to format needed for charts
  const prepareScoreHistoryData = (data: MunyIQHistoryEntry[]) => {
    // Sort by date ascending
    return [...data].sort((a, b) => 
      new Date(a.calculation_date).getTime() - new Date(b.calculation_date).getTime()
    ).map(entry => ({
      date: format(parseISO(entry.calculation_date), 'MMM d'),
      score: entry.munyiq_score
    }));
  };

  const prepareComponentsData = (score: MunyIQScoreDetail) => [
    { name: 'Accuracy', value: score.accuracy_score, fill: '#0088FE' },
    { name: 'Consistency', value: score.consistency_score, fill: '#00C49F' },
    { name: 'Speed', value: score.speed_score, fill: '#FFBB28' },
    { name: 'Participation', value: score.participation_score * 2, fill: '#FF8042' }, // Scale 0-50 to 0-100
    ...(score.improvement_score !== undefined && score.improvement_score !== null
      ? [{ name: 'Improvement', value: score.improvement_score, fill: '#8884d8' }]
      : [])
  ];

  const prepareDistributionData = (distribution: Record<string, number>) => 
    Object.entries(distribution).map(([range, count], index) => ({
      name: range,
      value: count,
      fill: COLORS[index % COLORS.length]
    }));

  // Fetch MunyIQ score data
  useEffect(() => {
    const fetchMunyIQData = async () => {
      if (!session?.access_token) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch both score and stats in parallel
        const [scoreResponse, statsResponse] = await Promise.all([
          fetch(`${brain.baseUrl}/munyiq/score`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }),
          fetch(`${brain.baseUrl}/munyiq/stats`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })
        ]);

        if (!scoreResponse.ok) {
          const errorText = await scoreResponse.text();
          throw new Error(`Failed to fetch MunyIQ score: ${errorText}`);
        }

        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          throw new Error(`Failed to fetch MunyIQ stats: ${errorText}`);
        }

        const scoreData = await scoreResponse.json();
        const statsData = await statsResponse.json();

        setScoreData(scoreData);
        setStatsData(statsData);
      } catch (err: any) {
        console.error("Error fetching MunyIQ data:", err);
        setError(err.message || "Failed to load MunyIQ data. Please try again.");
        toast.error("Failed to load MunyIQ data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMunyIQData();
  }, [session]);

  // Check if user needs to play more games before getting a score
  if (!isLoading && scoreData?.games_until_next_calculation && scoreData.games_until_next_calculation > 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">MunyIQ Score</CardTitle>
          <CardDescription>
            Your performance rating on a scale of 1-200
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
            <h3 className="text-xl font-semibold">Almost There!</h3>
            <p className="text-muted-foreground">
              You need to complete {scoreData.games_until_next_calculation} more games to receive your MunyIQ score.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              MunyIQ requires at least 20 completed games to calculate an accurate performance score.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <Button variant="outline" onClick={() => window.location.href = "/prediction-game"}>
            Play Now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">MunyIQ Score</CardTitle>
          <CardDescription>
            Your performance rating on a scale of 1-200
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-500" />
            <h3 className="text-xl font-semibold">Unable to Load Data</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  // If no score data is available yet but we passed the games check
  if (!scoreData?.current_score) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">MunyIQ Score</CardTitle>
          <CardDescription>
            Your performance rating on a scale of 1-200
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
            <h3 className="text-xl font-semibold">Score Not Available</h3>
            <p className="text-muted-foreground">
              We couldn't calculate your MunyIQ score yet. This might be because you haven't completed enough games
              or because your games haven't been processed yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const historyData = prepareScoreHistoryData([...scoreData.previous_scores, {
    calculation_date: scoreData.current_score.calculation_date,
    munyiq_score: scoreData.current_score.munyiq_score
  }]);

  const componentsData = prepareComponentsData(scoreData.current_score);
  const distributionData = statsData ? prepareDistributionData(statsData.global_distribution) : [];

  // Calculate score level and message
  const getScoreLevel = (score: number) => {
    if (score >= 175) return { level: "Elite", color: "text-purple-500" };
    if (score >= 150) return { level: "Expert", color: "text-blue-500" };
    if (score >= 125) return { level: "Advanced", color: "text-green-500" };
    if (score >= 100) return { level: "Intermediate", color: "text-yellow-500" };
    if (score >= 75) return { level: "Developing", color: "text-orange-500" };
    return { level: "Beginner", color: "text-red-500" };
  };

  const scoreLevel = getScoreLevel(scoreData.current_score.munyiq_score);

  // Main component rendering with score data
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">MunyIQ Score</CardTitle>
            <CardDescription>
              Your performance rating on a scale of 1-200
            </CardDescription>
          </div>
          <Badge variant="outline" className={`px-3 py-1 text-lg ${scoreLevel.color}`}>
            {scoreLevel.level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Current Score Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="text-6xl font-bold">{scoreData.current_score.munyiq_score}</div>
            {scoreData.current_score.improved_since_last && (
              <Badge className="absolute -top-2 -right-8 bg-green-500">
                <TrendingUp className="w-4 h-4 mr-1" /> 
                Improved
              </Badge>
            )}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Based on {scoreData.current_score.total_games} games with {scoreData.current_score.correct_games} correct predictions
            ({Math.round(scoreData.current_score.accuracy_score)}% accuracy)
          </div>

          {statsData && (
            <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm">
              <div>
                <span className="font-medium">Global Average:</span> {statsData.average_score}
              </div>
              <div>
                <span className="font-medium">Your Percentile:</span> {statsData.percentile_rank}%
              </div>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Score Components</TabsTrigger>
            <TabsTrigger value="history">Score History</TabsTrigger>
            <TabsTrigger value="distribution">Global Distribution</TabsTrigger>
          </TabsList>
          
          {/* Score Components Tab */}
          <TabsContent value="components" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={componentsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score Components"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-500" />
                      <span>Accuracy</span>
                    </div>
                    <span className="font-medium">{Math.round(scoreData.current_score.accuracy_score)}%</span>
                  </div>
                  <Progress value={scoreData.current_score.accuracy_score} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      <span>Consistency</span>
                    </div>
                    <span className="font-medium">{Math.round(scoreData.current_score.consistency_score)}%</span>
                  </div>
                  <Progress value={scoreData.current_score.consistency_score} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      <span>Speed</span>
                    </div>
                    <span className="font-medium">{Math.round(scoreData.current_score.speed_score)}%</span>
                  </div>
                  <Progress value={scoreData.current_score.speed_score} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-orange-500" />
                      <span>Participation</span>
                    </div>
                    <span className="font-medium">{scoreData.current_score.participation_score}/50</span>
                  </div>
                  <Progress value={scoreData.current_score.participation_score * 2} className="h-2" /> {/* Scale 0-50 to 0-100 */}
                </div>
                
                {scoreData.current_score.improvement_score !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2 text-purple-500" />
                        <span>Improvement</span>
                      </div>
                      <span className="font-medium">{Math.round(scoreData.current_score.improvement_score)}%</span>
                    </div>
                    <Progress value={scoreData.current_score.improvement_score} className="h-2" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="mb-2 font-medium">How MunyIQ is Calculated:</p>
              <p>MunyIQ measures your stock prediction prowess on a 1-200 scale. It combines accuracy, consistency, quick decision-making, and regular participation.</p>
              <p>After 40 games, an improvement factor is also considered to reward your growth over time.</p>
            </div>
          </TabsContent>
          
          {/* Score History Tab */}
          <TabsContent value="history" className="pt-4">
            {historyData.length > 1 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 200]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>Not enough history data to show a trend.</p>
                <p className="text-sm mt-2">Check back after your next few games!</p>
              </div>
            )}
          </TabsContent>
          
          {/* Global Distribution Tab */}
          <TabsContent value="distribution" className="pt-4">
            {statsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col justify-center space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Your Score: {scoreData.current_score.munyiq_score}</h3>
                    <p className="text-muted-foreground">Better than {statsData.percentile_rank}% of players</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-3 flex flex-col">
                      <span className="text-muted-foreground">Global Average</span>
                      <span className="text-lg font-semibold">{statsData.average_score}</span>
                    </div>
                    
                    <div className="bg-muted rounded p-3 flex flex-col">
                      <span className="text-muted-foreground">Median Score</span>
                      <span className="text-lg font-semibold">{statsData.median_score}</span>
                    </div>
                    
                    <div className="bg-muted rounded p-3 flex flex-col">
                      <span className="text-muted-foreground">Total Players</span>
                      <span className="text-lg font-semibold">{statsData.total_users_with_scores}</span>
                    </div>
                    
                    <div className="bg-muted rounded p-3 flex flex-col">
                      <span className="text-muted-foreground">Your Percentile</span>
                      <span className="text-lg font-semibold">{statsData.percentile_rank}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>Global statistics are not available right now.</p>
                <p className="text-sm mt-2">Please try again later.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-sm text-muted-foreground border-t pt-6">
        <div>
          <p>Premium Feature - Last updated: {format(parseISO(scoreData.current_score.calculation_date), 'MMM d, yyyy HH:mm')}</p>
          <p>Premium member since: {format(parseISO(scoreData.subscribed_since), 'MMM d, yyyy')}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
