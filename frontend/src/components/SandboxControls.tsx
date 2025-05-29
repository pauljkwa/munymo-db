import React, { useState, useEffect, useCallback } from 'react';
import brain from 'brain';
import { SandboxStatusResponse, SetGameRequest, TriggerResponse } from 'types'; // Assuming types exist
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { mode, Mode } from 'app'; // Import mode for conditional check (though component only renders in DEV)
import { useAuthStore } from 'utils/authStore';

interface SandboxStatus {
  is_sandbox_mode: boolean;
  current_sandbox_game_id: string | null;
}

export function SandboxControls() {
  const [status, setStatus] = useState<SandboxStatus | null>(null);
  const [gameIdInput, setGameIdInput] = useState<string>('');
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSettingGame, setIsSettingGame] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false); // Generic trigger loading state
  const { session } = useAuthStore();

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      console.log("Fetching sandbox status...");
      // Add authorization header with the token if session exists
      const params = session ? {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      } : {};
      
      const response = await brain.get_sandbox_status(params);
      const data: SandboxStatusResponse = await response.json();
      console.log("Sandbox status received:", data);
      setStatus(data);
      // Optionally pre-fill input if a game ID is already set
      setGameIdInput(data.current_sandbox_game_id || '');
    } catch (error) {
      console.error('Error fetching sandbox status:', error);
      toast.error('Failed to fetch sandbox status.');
      setStatus(null); // Reset status on error
    } finally {
      setIsLoadingStatus(false);
    }
  }, [session]);  // Add session to dependency array

  useEffect(() => {
    // Fetch status only if in DEV mode (redundant check, but safe)
    if (mode === Mode.DEV && session) {
      fetchStatus();
    }
  }, [fetchStatus, session]);

  const handleSetGame = async () => {
    if (!gameIdInput.trim()) {
        toast.error("Please enter a Game ID to set.");
        return;
    }
    setIsSettingGame(true);
    try {
      const body: SetGameRequest = { game_id: gameIdInput.trim() };
      // Add authorization header with the token if session exists
      const params = session ? {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      } : {};
      
      const response = await brain.set_sandbox_game(body, params);
      const data = await response.json(); // Type if available, otherwise any
      toast.success(data.message || `Sandbox game ID set to: ${gameIdInput.trim()}`);
      await fetchStatus(); // Refresh status after setting
    } catch (error: any) {
      console.error('Error setting sandbox game ID:', error);
       const errorData = await error.response?.json();
      toast.error(`Failed to set game ID: ${errorData?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsSettingGame(false);
    }
  };

  const handleClearGame = async () => {
    setIsSettingGame(true);
    try {
      const body: SetGameRequest = { game_id: null };
      // Add authorization header with the token if session exists
      const params = session ? {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      } : {};
      
      const response = await brain.set_sandbox_game(body, params);
      const data = await response.json();
      toast.success(data.message || 'Sandbox game ID cleared.');
      setGameIdInput(''); // Clear input field
      await fetchStatus(); // Refresh status
    } catch (error: any) {
      console.error('Error clearing sandbox game ID:', error);
      const errorData = await error.response?.json();
      toast.error(`Failed to clear game ID: ${errorData?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsSettingGame(false);
    }
  };

  // Generic trigger function
  const handleTrigger = async (triggerFn: (params?: any) => Promise<any>, actionName: string) => {
     if (!status?.current_sandbox_game_id) {
      toast.error(`Cannot trigger '${actionName}': No sandbox game ID is set.`);
      return;
    }
    setIsTriggering(true);
    try {
      console.log(`Triggering ${actionName}...`);
      // Add authorization header with the token if session exists
      const params = session ? {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      } : {};
      
      const response = await triggerFn(params);
      const data: TriggerResponse = await response.json();
      console.log(`${actionName} response:`, data);
      toast.success(data.message || `${actionName} triggered successfully.`);
      // Optionally refresh status if the action might change it (e.g., close predictions)
      if (actionName === 'Close Predictions') {
          // Maybe add a small delay? Or rely on user seeing the effect elsewhere.
          // await fetchStatus();
      }
    } catch (error: any) {
      console.error(`Error triggering ${actionName}:`, error);
      const errorData = await error.response?.json();
      toast.error(`Failed to trigger ${actionName}: ${errorData?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsTriggering(false);
    }
  };


  // Render nothing if not in DEV mode (this component shouldn't be mounted anyway, but belts and braces)
  if (mode !== Mode.DEV) {
    return null;
  }

  return (
    <Card className="mt-6 border-yellow-500 border-2">
      <CardHeader>
        <CardTitle className="text-yellow-500">🚧 Sandbox Controls (DEV ONLY) 🚧</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingStatus ? (
          <p>Loading status...</p>
        ) : status ? (
          <div className="space-y-2">
            <p><strong>Mode:</strong> {status.is_sandbox_mode ? 'Sandbox (DEV)' : 'Production'}</p>
            <p><strong>Current Game ID:</strong> {status.current_sandbox_game_id || 'None Set'}</p>
          </div>
        ) : (
          <p className="text-red-500">Could not load sandbox status.</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="sandboxGameId">Set Sandbox Game ID:</Label>
          <div className="flex space-x-2">
            <Input
              id="sandboxGameId"
              placeholder="Enter Game ID (e.g., ASX_2024-01-15_ABC_XYZ)"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              disabled={isLoadingStatus || isSettingGame}
            />
            <Button onClick={handleSetGame} disabled={isLoadingStatus || isSettingGame || !gameIdInput.trim()}>
              {isSettingGame ? 'Setting...' : 'Set ID'}
            </Button>
             <Button variant="outline" onClick={handleClearGame} disabled={isLoadingStatus || isSettingGame || !status?.current_sandbox_game_id}>
              {isSettingGame ? 'Clearing...' : 'Clear ID'}
            </Button>
          </div>
        </div>

         <div className="space-y-2">
            <Label>Trigger Actions:</Label>
            <div className="flex flex-wrap gap-2">
                 <Button
                    variant="destructive"
                    onClick={() => handleTrigger(brain.trigger_close_predictions, 'Close Predictions')}
                    disabled={isLoadingStatus || isTriggering || !status?.current_sandbox_game_id}
                 >
                    {isTriggering ? 'Working...' : 'Trigger Close Predictions'}
                 </Button>
                 <Button
                    variant="secondary"
                    onClick={() => handleTrigger(brain.trigger_process_results, 'Process Results')}
                    disabled={isLoadingStatus || isTriggering || !status?.current_sandbox_game_id}
                 >
                    {isTriggering ? 'Working...' : 'Trigger Process Results'}
                 </Button>
                 <Button
                    variant="secondary"
                    onClick={() => handleTrigger(brain.trigger_leaderboard_update, 'Leaderboard Update')}
                    disabled={isLoadingStatus || isTriggering || !status?.current_sandbox_game_id}
                 >
                    {isTriggering ? 'Working...' : 'Trigger Leaderboard Update (Sim.)'}
                 </Button>
            </div>
            <p className="text-xs text-muted-foreground">Ensure the correct Game ID is set before triggering actions.</p>
        </div>

      </CardContent>
       <CardFooter>
         <p className="text-xs text-muted-foreground">This panel is only visible in the development environment.</p>
       </CardFooter>
    </Card>
  );
}
