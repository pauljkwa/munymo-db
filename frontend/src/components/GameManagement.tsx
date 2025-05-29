import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Search, Plus, Edit, Trash } from "lucide-react";
import brain from "brain";

interface Game {
  pair_id: string;
  exchange: string;
  game_date: string;
  company_a_ticker: string;
  company_a_name: string;
  company_b_ticker: string;
  company_b_name: string;
  sector: string;
  reasoning: string;
  status: string;
  next_day_clue?: string;
  company_a_performance?: number;
  company_b_performance?: number;
  winner_ticker?: string;
  result_processed?: boolean;
}

interface GameManagementProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function GameManagement({ setError, setIsLoading }: GameManagementProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterExchange, setFilterExchange] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [processingResults, setProcessingResults] = useState(false);
  const [formData, setFormData] = useState<Partial<Game & {company_a_performance?: number, company_b_performance?: number, winner_ticker?: string}>>({
    exchange: "ASX",
    game_date: new Date().toISOString().split("T")[0],
    company_a_ticker: "",
    company_a_name: "",
    company_b_ticker: "",
    company_b_name: "",
    sector: "",
    reasoning: "",
    status: "scheduled",
    next_day_clue: "",
  });

  // Fetch games on component mount and when filters change
  useEffect(() => {
    fetchGames();
  }, [filterExchange, filterStatus, filterFromDate, filterToDate]);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      let queryParams: Record<string, string> = {};
      if (filterExchange !== "all") queryParams.exchange = filterExchange;
      if (filterStatus !== "all") queryParams.status = filterStatus;
      if (filterFromDate) queryParams.from_date = filterFromDate;
      if (filterToDate) queryParams.to_date = filterToDate;

      const response = await brain.list_games(queryParams);
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError("Failed to load games. Please try again.");
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    try {
      setIsLoading(true);
      const response = await brain.create_game(formData as any);
      const data = await response.json();
      
      toast.success("Game created successfully");
      setGames([data, ...games]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGame = async () => {
    if (!editingGame) return;
    
    try {
      setIsLoading(true);
      const response = await brain.update_game(
        { pair_id: editingGame.pair_id },
        formData as any
      );
      const data = await response.json();
      
      // Update the game in the list
      setGames(
        games.map((game) => 
          game.pair_id === editingGame.pair_id ? data : game
        )
      );
      
      toast.success("Game updated successfully");
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error updating game:", error);
      toast.error("Failed to update game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGame = async (pairId: string) => {
    if (!confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsLoading(true);
      await brain.delete_game({ pair_id: pairId });
      
      // Remove the game from the list
      setGames(games.filter((game) => game.pair_id !== pairId));
      
      toast.success("Game deleted successfully");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (game: Game) => {
    setEditingGame(game);
    setFormData({
      exchange: game.exchange,
      game_date: game.game_date,
      company_a_ticker: game.company_a_ticker,
      company_a_name: game.company_a_name,
      company_b_ticker: game.company_b_ticker,
      company_b_name: game.company_b_name,
      sector: game.sector,
      reasoning: game.reasoning,
      status: game.status,
      next_day_clue: game.next_day_clue || "",
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      exchange: "ASX",
      game_date: new Date().toISOString().split("T")[0],
      company_a_ticker: "",
      company_a_name: "",
      company_b_ticker: "",
      company_b_name: "",
      sector: "",
      reasoning: "",
      status: "scheduled",
      next_day_clue: "",
    });
    setEditingGame(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Filter games by search term (company name or ticker)
  const filteredGames = games.filter(
    (game) =>
      !searchTerm ||
      game.company_a_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.company_b_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.company_a_ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.company_b_ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle entering game results
  const openResultsDialog = (game: Game) => {
    setEditingGame(game);
    setFormData({
      ...formData,
      exchange: game.exchange,
      game_date: game.game_date,
      company_a_ticker: game.company_a_ticker,
      company_a_name: game.company_a_name,
      company_b_ticker: game.company_b_ticker,
      company_b_name: game.company_b_name,
      company_a_performance: game.company_a_performance || 0,
      company_b_performance: game.company_b_performance || 0,
      winner_ticker: game.winner_ticker || ""
    });
    setShowResultsDialog(true);
  };

  const handleEnterResults = async () => {
    if (!editingGame) return;
    
    try {
      setProcessingResults(true);
      
      // Determine which company is the winner based on performance
      const winnerTicker = formData.company_a_performance! > formData.company_b_performance! 
        ? formData.company_a_ticker 
        : formData.company_b_ticker;
      
      // Create request payload for the API
      const processRequest = {
        game_date_str: editingGame.game_date,
        exchange: editingGame.exchange,
        manual_results: {
          company_a_performance: formData.company_a_performance,
          company_b_performance: formData.company_b_performance,
          winner_ticker: formData.winner_ticker || winnerTicker
        }
      };
      
      // Call the process results API
      const response = await brain.process_game_results(processRequest);
      const data = await response.json();
      
      // Update the game in the list
      const updatedGame = {
        ...editingGame,
        company_a_performance: formData.company_a_performance,
        company_b_performance: formData.company_b_performance,
        winner_ticker: formData.winner_ticker || winnerTicker,
        result_processed: true,
        status: "completed"
      };
      
      setGames(
        games.map((game) => 
          game.pair_id === editingGame.pair_id ? updatedGame : game
        )
      );
      
      toast.success("Game results processed successfully");
      setShowResultsDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error processing game results:", error);
      toast.error("Failed to process game results. API might be unavailable.");
    } finally {
      setProcessingResults(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Game
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="exchange-filter">Exchange</Label>
              <Select 
                value={filterExchange} 
                onValueChange={setFilterExchange}
              >
                <SelectTrigger id="exchange-filter">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exchanges</SelectItem>
                  <SelectItem value="ASX">ASX</SelectItem>
                  <SelectItem value="NYSE">NYSE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No games found matching your filters.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Company A</TableHead>
                <TableHead>Company B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Results</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow key={game.pair_id}>
                  <TableCell>{game.game_date}</TableCell>
                  <TableCell>{game.exchange}</TableCell>
                  <TableCell>
                    <div className="font-medium">{game.company_a_ticker}</div>
                    <div className="text-sm text-muted-foreground">{game.company_a_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{game.company_b_ticker}</div>
                    <div className="text-sm text-muted-foreground">{game.company_b_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(game.status)}`}>
                      {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {game.company_a_performance !== undefined && game.company_b_performance !== undefined ? (
                      <div className="text-xs">
                        <div className="flex justify-between">
                          <span>{game.company_a_ticker}:</span>
                          <span className={game.company_a_performance > 0 ? "text-green-500" : "text-red-500"}>
                            {game.company_a_performance > 0 ? "+" : ""}{game.company_a_performance.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{game.company_b_ticker}:</span>
                          <span className={game.company_b_performance > 0 ? "text-green-500" : "text-red-500"}>
                            {game.company_b_performance > 0 ? "+" : ""}{game.company_b_performance.toFixed(2)}%
                          </span>
                        </div>
                        {game.winner_ticker && (
                          <div className="mt-1 text-center font-medium">
                            Winner: {game.winner_ticker}
                          </div>
                        )}
                      </div>
                    ) : game.status === "completed" ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openResultsDialog(game)}
                      >
                        Enter Missing Results
                      </Button>
                    ) : game.status === "active" ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openResultsDialog(game)}
                      >
                        Enter Results
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not available</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(game)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteGame(game.pair_id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Game Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Game</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exchange">Exchange</Label>
                <Select
                  value={formData.exchange}
                  onValueChange={(value) => handleSelectChange("exchange", value)}
                >
                  <SelectTrigger id="exchange">
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASX">ASX</SelectItem>
                    <SelectItem value="NYSE">NYSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="game_date">Game Date</Label>
                <Input
                  id="game_date"
                  name="game_date"
                  type="date"
                  value={formData.game_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_a_ticker">Company A Ticker</Label>
                <Input
                  id="company_a_ticker"
                  name="company_a_ticker"
                  value={formData.company_a_ticker}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="company_a_name">Company A Name</Label>
                <Input
                  id="company_a_name"
                  name="company_a_name"
                  value={formData.company_a_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_b_ticker">Company B Ticker</Label>
                <Input
                  id="company_b_ticker"
                  name="company_b_ticker"
                  value={formData.company_b_ticker}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="company_b_name">Company B Name</Label>
                <Input
                  id="company_b_name"
                  name="company_b_name"
                  value={formData.company_b_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="reasoning">Reasoning</Label>
              <Input
                id="reasoning"
                name="reasoning"
                value={formData.reasoning}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="next_day_clue">Next Day Clue (Optional)</Label>
              <Input
                id="next_day_clue"
                name="next_day_clue"
                value={formData.next_day_clue}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleCreateGame}>Create Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-exchange">Exchange</Label>
                <Select
                  value={formData.exchange}
                  onValueChange={(value) => handleSelectChange("exchange", value)}
                >
                  <SelectTrigger id="edit-exchange">
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASX">ASX</SelectItem>
                    <SelectItem value="NYSE">NYSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-game_date">Game Date</Label>
                <Input
                  id="edit-game_date"
                  name="game_date"
                  type="date"
                  value={formData.game_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-company_a_ticker">Company A Ticker</Label>
                <Input
                  id="edit-company_a_ticker"
                  name="company_a_ticker"
                  value={formData.company_a_ticker}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="edit-company_a_name">Company A Name</Label>
                <Input
                  id="edit-company_a_name"
                  name="company_a_name"
                  value={formData.company_a_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-company_b_ticker">Company B Ticker</Label>
                <Input
                  id="edit-company_b_ticker"
                  name="company_b_ticker"
                  value={formData.company_b_ticker}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="edit-company_b_name">Company B Name</Label>
                <Input
                  id="edit-company_b_name"
                  name="company_b_name"
                  value={formData.company_b_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-sector">Sector</Label>
              <Input
                id="edit-sector"
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="edit-reasoning">Reasoning</Label>
              <Input
                id="edit-reasoning"
                name="reasoning"
                value={formData.reasoning}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="edit-next_day_clue">Next Day Clue (Optional)</Label>
              <Input
                id="edit-next_day_clue"
                name="next_day_clue"
                value={formData.next_day_clue}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUpdateGame}>Update Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enter Game Results</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-a-performance">{formData.company_a_ticker} Performance (%)</Label>
                <Input
                  id="company-a-performance"
                  type="number"
                  step="0.01"
                  value={formData.company_a_performance}
                  onChange={(e) => handleInputChange({
                    target: {
                      name: "company_a_performance",
                      value: parseFloat(e.target.value)
                    }
                  } as any)}
                />
              </div>
              <div>
                <Label htmlFor="company-b-performance">{formData.company_b_ticker} Performance (%)</Label>
                <Input
                  id="company-b-performance"
                  type="number"
                  step="0.01"
                  value={formData.company_b_performance}
                  onChange={(e) => handleInputChange({
                    target: {
                      name: "company_b_performance",
                      value: parseFloat(e.target.value)
                    }
                  } as any)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="winner-ticker">Winner Ticker (Auto-selected based on performance)</Label>
              <Select
                value={formData.winner_ticker || (formData.company_a_performance! > formData.company_b_performance! ? formData.company_a_ticker : formData.company_b_ticker)}
                onValueChange={(value) => handleSelectChange("winner_ticker", value)}
              >
                <SelectTrigger id="winner-ticker">
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={formData.company_a_ticker}>{formData.company_a_ticker} ({formData.company_a_name})</SelectItem>
                  <SelectItem value={formData.company_b_ticker}>{formData.company_b_ticker} ({formData.company_b_name})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Winner is automatically determined based on performance, but can be manually overridden.  
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm mb-2 font-medium">Manual Result Entry</p>
              <p className="text-xs text-muted-foreground">
                Use this feature to manually enter game results when the automated API data collection fails. 
                This will update the game status to completed and process all user predictions against these results.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleEnterResults} 
              disabled={processingResults}
            >
              {processingResults ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Results"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to get badge color based on status
function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-purple-100 text-purple-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
