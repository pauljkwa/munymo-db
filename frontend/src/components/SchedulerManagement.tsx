import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader, RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, PlayCircle, TestTube, Calendar2, Trash2 } from "lucide-react";
import { API_URL } from "app";

export interface SchedulerTask {
  task_id: string;
  task_type: string;
  exchange: string;
  hour_utc: number;
  minute_utc: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  custom_params?: Record<string, any> | null;
}

interface SchedulerStatus {
  is_enabled: boolean;
  is_initialized: boolean;
  sandbox_mode_enabled: boolean;
  sandbox_mode_active: boolean;
  tasks: SchedulerTask[];
  current_time_utc: string;
  recent_errors?: Array<{
    timestamp: string;
    task_id: string;
    task_type: string;
    exchange: string;
    error_message: string;
    stack_trace?: string;
  }>;
}

interface CronStatus {
  is_enabled: boolean;
  interval_minutes: number;
  last_run: string | null;
  next_run: string | null;
  current_time: string;
}

export function SchedulerManagement() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [cronInterval, setCronInterval] = useState<number>(5);
  const [showIntervalDialog, setShowIntervalDialog] = useState<boolean>(false);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [schedulerErrors, setSchedulerErrors] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState<boolean>(false);
  
  // Format dates
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Convert UTC time to local time
  const formatUTCTime = (hour: number, minute: number) => {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute));
    return utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Load scheduler status
  const fetchSchedulerStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/scheduler/status`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching scheduler status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchedulerStatus(data);
      
      // Update recent errors if available
      if (data.recent_errors && data.recent_errors.length > 0) {
        setSchedulerErrors(data.recent_errors);
      }
    } catch (error) {
      console.error("Failed to fetch scheduler status:", error);
      toast.error("Failed to fetch scheduler status");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  // Load cron status
  const fetchCronStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/cron/status`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching cron status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCronStatus(data);
      setCronInterval(data.interval_minutes);
    } catch (error) {
      console.error("Failed to fetch cron status:", error);
      toast.error("Failed to fetch cron status");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  // Initialize scheduler
  const initializeScheduler = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/scheduler/initialize`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error initializing scheduler: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchedulerStatus(data);
      toast.success("Scheduler initialized successfully");
    } catch (error) {
      console.error("Failed to initialize scheduler:", error);
      toast.error("Failed to initialize scheduler");
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle scheduler enabled state
  const toggleSchedulerEnabled = async () => {
    if (!schedulerStatus) return;
    
    try {
      const endpoint = schedulerStatus.is_enabled ? "disable" : "enable";
      const response = await fetch(`${API_URL}/scheduler/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error toggling scheduler: ${response.statusText}`);
      }
      
      // Update local state
      setSchedulerStatus({
        ...schedulerStatus,
        is_enabled: !schedulerStatus.is_enabled,
      });
      
      toast.success(`Scheduler ${schedulerStatus.is_enabled ? "disabled" : "enabled"} successfully`);
    } catch (error) {
      console.error("Failed to toggle scheduler:", error);
      toast.error("Failed to toggle scheduler state");
    }
  };
  
  // Toggle cron enabled state
  const toggleCronEnabled = async () => {
    if (!cronStatus) return;
    
    try {
      const endpoint = cronStatus.is_enabled ? "disable" : "enable";
      const response = await fetch(`${API_URL}/cron/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error toggling cron: ${response.statusText}`);
      }
      
      // Update local state
      setCronStatus({
        ...cronStatus,
        is_enabled: !cronStatus.is_enabled,
      });
      
      toast.success(`Cron ${cronStatus.is_enabled ? "disabled" : "enabled"} successfully`);
    } catch (error) {
      console.error("Failed to toggle cron:", error);
      toast.error("Failed to toggle cron state");
    }
  };
  
  // Toggle task active state
  const toggleTaskActive = async (taskId: string, currentState: boolean) => {
    if (!schedulerStatus) return;
    
    try {
      toast.info(`Toggling task ${taskId} to ${!currentState ? "active" : "inactive"}...`);
      
      const response = await fetch(`${API_URL}/scheduler/toggle-task-active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: taskId,
          is_active: !currentState
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error toggling task active state: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success(result.message || "Task status updated successfully");
      
      // Update local state
      const updatedTasks = schedulerStatus.tasks.map(task => 
        task.task_id === taskId ? { ...task, is_active: !currentState } : task
      );
      
      setSchedulerStatus({
        ...schedulerStatus,
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error(`Failed to toggle task ${taskId} active state:`, error);
      toast.error(`Failed to update task status`);
    }
  };
  
  // Run a task immediately
  const runTaskNow = async (taskId: string) => {
    try {
      toast.info(`Running task ${taskId}...`);
      const response = await fetch(`${API_URL}/scheduler/run-task/${taskId}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error running task: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success(result.message || "Task triggered successfully");
      
      // Refresh status after a short delay
      setTimeout(() => {
        fetchSchedulerStatus();
      }, 2000);
    } catch (error) {
      console.error(`Failed to run task ${taskId}:`, error);
      toast.error(`Failed to run task ${taskId}`);
    }
  };
  
  // Run the cron job now
  const runCronNow = async () => {
    try {
      toast.info("Running cron job...");
      const response = await fetch(`${API_URL}/cron/run-now`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error running cron job: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success(result.message || "Cron job triggered successfully");
      
      // Refresh status after a short delay
      setTimeout(() => {
        fetchSchedulerStatus();
        fetchCronStatus();
      }, 2000);
    } catch (error) {
      console.error("Failed to run cron job:", error);
      toast.error("Failed to run cron job");
    }
  };
  
  // Update cron interval
  const updateCronInterval = async () => {
    try {
      const response = await fetch(`${API_URL}/cron/set-interval?interval_minutes=${cronInterval}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error updating cron interval: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success(result.message || "Cron interval updated successfully");
      
      // Update local state
      if (cronStatus) {
        setCronStatus({
          ...cronStatus,
          interval_minutes: cronInterval,
        });
      }
      
      setShowIntervalDialog(false);
    } catch (error) {
      console.error("Failed to update cron interval:", error);
      toast.error("Failed to update cron interval");
    }
  };
  
  // Toggle sandbox mode
  const toggleSandboxMode = async () => {
    if (!schedulerStatus) return;
    
    try {
      const response = await fetch(`${API_URL}/scheduler/toggle-sandbox-mode`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error toggling sandbox mode: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update local state
      setSchedulerStatus({
        ...schedulerStatus,
        sandbox_mode_enabled: !schedulerStatus.sandbox_mode_enabled,
      });
      
      toast.success(result.message || "Sandbox mode toggled successfully");
    } catch (error) {
      console.error("Failed to toggle sandbox mode:", error);
      toast.error("Failed to toggle sandbox mode");
    }
  };
  
  // Fetch scheduler errors
  const fetchSchedulerErrors = async () => {
    try {
      setLoadingErrors(true);
      const response = await fetch(`${API_URL}/scheduler/errors`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching scheduler errors: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchedulerErrors(data);
      setShowErrorDialog(true);
    } catch (error) {
      console.error("Failed to fetch scheduler errors:", error);
      toast.error("Failed to fetch scheduler errors");
    } finally {
      setLoadingErrors(false);
    }
  };
  
  // Clear scheduler error logs
  const clearErrorLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/scheduler/clear-errors`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error clearing error logs: ${response.statusText}`);
      }
      
      setSchedulerErrors([]);
      toast.success("Error logs cleared successfully");
    } catch (error) {
      console.error("Failed to clear error logs:", error);
      toast.error("Failed to clear error logs");
    }
  };
  
  
  // Initial data load
  useEffect(() => {
    fetchSchedulerStatus();
    fetchCronStatus();
    
    // Fetch documentation
    fetch(`${API_URL}/scheduler/documentation`, {
      credentials: "include",
    })
    .then(resp => resp.json())
    .then(data => {
      // Render documentation
      const docsElement = document.getElementById("scheduler-docs");
      if (docsElement) {
        // Clear loading state
        docsElement.innerHTML = "";
        
        // Overview section
        const overview = document.createElement("div");
        overview.className = "space-y-4";
        overview.innerHTML = `
          <h3 class="text-lg font-semibold">${data.overview.title}</h3>
          <p>${data.overview.description}</p>
          <div class="space-y-2">
            <h4 class="text-sm font-medium">Key Features</h4>
            <ul class="space-y-1 list-disc pl-5">
              ${data.overview.key_features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        `;
        docsElement.appendChild(overview);
        
        // Task Types section
        const taskTypes = document.createElement("div");
        taskTypes.className = "space-y-4 mt-6";
        taskTypes.innerHTML = `
          <h3 class="text-lg font-semibold">Task Types</h3>
          <div class="space-y-4">
            ${Object.entries(data.task_types).map(([type, info]) => `
              <div class="border rounded-md p-4">
                <h4 class="font-medium">${type}</h4>
                <p class="mt-1 text-sm">${info.description}</p>
                <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span class="font-medium">Typical Timing:</span> ${info.typical_timing}</div>
                  <div><span class="font-medium">Dependencies:</span> ${info.dependencies}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        docsElement.appendChild(taskTypes);
        
        // Best Practices section
        const bestPractices = document.createElement("div");
        bestPractices.className = "space-y-4 mt-6";
        bestPractices.innerHTML = `
          <h3 class="text-lg font-semibold">Best Practices</h3>
          <ul class="space-y-2 list-disc pl-5">
            ${data.best_practices.map(practice => `<li>${practice}</li>`).join('')}
          </ul>
        `;
        docsElement.appendChild(bestPractices);
        
        // Troubleshooting section
        const troubleshooting = document.createElement("div");
        troubleshooting.className = "space-y-4 mt-6";
        troubleshooting.innerHTML = `
          <h3 class="text-lg font-semibold">Troubleshooting</h3>
          <div class="space-y-4">
            ${data.troubleshooting.common_issues.map(issue => `
              <div class="border border-muted rounded-md p-4">
                <h4 class="font-medium text-destructive">${issue.issue}</h4>
                <div class="mt-2">
                  <h5 class="text-sm font-medium">Things to check:</h5>
                  <ul class="space-y-1 list-disc pl-5 mt-1 text-sm">
                    ${issue.checks.map(check => `<li>${check}</li>`).join('')}
                  </ul>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        docsElement.appendChild(troubleshooting);
      }
    })
    .catch(err => {
      console.error("Failed to load documentation:", err);
      const docsElement = document.getElementById("scheduler-docs");
      if (docsElement) {
        docsElement.innerHTML = `
          <div class="p-4 border border-destructive/30 bg-destructive/10 rounded-md">
            <h3 class="text-lg font-semibold text-destructive">Failed to load documentation</h3>
            <p class="mt-2">An error occurred while loading the scheduler documentation. Please try refreshing the page.</p>
          </div>
        `;
      }
    });
  }, []);
  
  // Loading state
  if (loading && !schedulerStatus && !cronStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading scheduler status...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduler Management</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchSchedulerStatus();
            fetchCronStatus();
          }}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="scheduler">
        <TabsList>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="cron">Cron Settings</TabsTrigger>
          <TabsTrigger value="tests">Test Tools</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scheduler" className="space-y-4">
          {!schedulerStatus?.is_initialized ? (
            <Card>
              <CardHeader>
                <CardTitle>Scheduler Not Initialized</CardTitle>
                <CardDescription>
                  The scheduler needs to be initialized before it can be used.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={initializeScheduler}>
                  Initialize Scheduler
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Scheduler Status</CardTitle>
                  <CardDescription>
                    Current status and configuration of the game generation scheduler.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col space-y-1.5">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={schedulerStatus?.is_enabled} 
                          onCheckedChange={toggleSchedulerEnabled}
                        />
                        <span>{schedulerStatus?.is_enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <Label>Current Time (UTC)</Label>
                      <div>{formatDateTime(schedulerStatus?.current_time_utc)}</div>
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <Label>Sandbox Mode</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={schedulerStatus?.sandbox_mode_enabled} 
                            onCheckedChange={toggleSandboxMode}
                          />
                          <span>{schedulerStatus?.sandbox_mode_enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                        
                        {schedulerStatus?.sandbox_mode_enabled !== schedulerStatus?.sandbox_mode_active && (
                          <div className="flex items-center mt-1 text-amber-500">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Scheduler sandbox mode does not match app mode</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show error summary if there are recent errors */}
                  {schedulerStatus?.recent_errors && schedulerStatus.recent_errors.length > 0 && (
                    <div className="mt-4 p-3 border border-destructive/30 bg-destructive/5 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                          <span className="font-medium">
                            {schedulerStatus.recent_errors.length} recent error{schedulerStatus.recent_errors.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={fetchSchedulerErrors}
                          disabled={loadingErrors}
                        >
                          {loadingErrors ? (
                            <>
                              <Loader className="h-3 w-3 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'View Details'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={runCronNow}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Run All Tasks Now
                  </Button>
                </CardFooter>
              </Card>
            
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Tasks</CardTitle>
                  <CardDescription>
                    These tasks are automatically run at their scheduled times.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead>Schedule (Local)</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedulerStatus?.tasks.map((task) => (
                        <TableRow key={task.task_id}>
                          <TableCell className="font-medium">{task.task_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {task.task_type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.exchange}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatUTCTime(task.hour_utc, task.minute_utc)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.last_run ? (
                              <div title={formatDateTime(task.last_run)}>
                                {new Date(task.last_run).toLocaleDateString()}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(task.last_run).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.next_run ? (
                              <div title={formatDateTime(task.next_run)}>
                                {new Date(task.next_run).toLocaleDateString()}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(task.next_run).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not scheduled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={task.is_active} 
                                onCheckedChange={() => toggleTaskActive(task.task_id, task.is_active)}
                                size="sm"
                              />
                              <span>{task.is_active ? "Active" : "Inactive"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => runTaskNow(task.task_id)}
                            >
                              Run Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Scheduler Test Tools
              </CardTitle>
              <CardDescription>
                Test tools to validate the scheduler functionality without affecting production data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="process-results">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="process-results">Process Results</TabsTrigger>
                  <TabsTrigger value="generate-games">Generate Games</TabsTrigger>
                  <TabsTrigger value="update-clue">Update Clue</TabsTrigger>
                  <TabsTrigger value="full-cycle">Full Cycle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="process-results">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="process-exchange">Exchange</Label>
                        <Select defaultValue="ASX" id="process-exchange">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Exchange" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASX">ASX</SelectItem>
                            <SelectItem value="NYSE">NYSE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="process-date">Date (YYYY-MM-DD)</Label>
                        <Input 
                          type="date" 
                          id="process-date"
                          defaultValue={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={() => {
                      const exchange = (document.getElementById("process-exchange") as HTMLSelectElement).value;
                      const date = (document.getElementById("process-date") as HTMLInputElement).value;
                      toast.info(`Testing process_results for ${exchange} on ${date}...`);
                      
                      fetch(`${API_URL}/scheduler/test/process-results?exchange=${exchange}&target_date=${date}`, {
                        method: "POST",
                        credentials: "include",
                      })
                      .then(resp => resp.json())
                      .then(data => {
                        toast.success(data.message || "Test completed successfully");
                      })
                      .catch(err => {
                        toast.error(`Test failed: ${err.message}`);
                      });
                    }}>
                      Test Process Results
                    </Button>
                    
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p><strong>What it does:</strong> Tests processing results for a specific game date. This will update the game status and winners.</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="generate-games">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="generate-exchange">Exchange</Label>
                        <Select defaultValue="ASX" id="generate-exchange">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Exchange" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASX">ASX</SelectItem>
                            <SelectItem value="NYSE">NYSE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="days-ahead">Days Ahead</Label>
                        <Input 
                          type="number" 
                          id="days-ahead"
                          defaultValue="1"
                          min="1"
                          max="5"
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={() => {
                      const exchange = (document.getElementById("generate-exchange") as HTMLSelectElement).value;
                      const daysAhead = (document.getElementById("days-ahead") as HTMLInputElement).value;
                      toast.info(`Generating games for ${exchange} ${daysAhead} days ahead...`);
                      
                      fetch(`${API_URL}/scheduler/test/generate-games?exchange=${exchange}&days_ahead=${daysAhead}`, {
                        method: "POST",
                        credentials: "include",
                      })
                      .then(resp => resp.json())
                      .then(data => {
                        toast.success(data.message || "Games generated successfully");
                      })
                      .catch(err => {
                        toast.error(`Game generation failed: ${err.message}`);
                      });
                    }}>
                      Generate Games
                    </Button>
                    
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p><strong>What it does:</strong> Generates new games for upcoming trading days. This will create company pairs and set up the games in the database.</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="update-clue">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="clue-exchange">Exchange</Label>
                        <Select defaultValue="ASX" id="clue-exchange">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Exchange" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASX">ASX</SelectItem>
                            <SelectItem value="NYSE">NYSE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="clue-date">Date (YYYY-MM-DD)</Label>
                        <Input 
                          type="date" 
                          id="clue-date"
                          defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={() => {
                      const exchange = (document.getElementById("clue-exchange") as HTMLSelectElement).value;
                      const date = (document.getElementById("clue-date") as HTMLInputElement).value;
                      toast.info(`Testing clue update for ${exchange} on ${date}...`);
                      
                      fetch(`${API_URL}/scheduler/test/update-clue?exchange=${exchange}&target_date=${date}`, {
                        method: "POST",
                        credentials: "include",
                      })
                      .then(resp => resp.json())
                      .then(data => {
                        toast.success(data.message || "Clue updated successfully");
                      })
                      .catch(err => {
                        toast.error(`Clue update failed: ${err.message}`);
                      });
                    }}>
                      Test Clue Update
                    </Button>
                    
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p><strong>What it does:</strong> Ensures the next day clue is available for players, even on non-trading days (weekends/holidays).</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="full-cycle">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-1">
                      <div>
                        <Label htmlFor="cycle-exchange">Exchange</Label>
                        <Select defaultValue="ASX" id="cycle-exchange">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Exchange" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASX">ASX</SelectItem>
                            <SelectItem value="NYSE">NYSE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={() => {
                      const exchange = (document.getElementById("cycle-exchange") as HTMLSelectElement).value;
                      toast.info(`Testing full cycle for ${exchange}...`);
                      
                      fetch(`${API_URL}/scheduler/test/full-cycle?exchange=${exchange}`, {
                        method: "POST",
                        credentials: "include",
                      })
                      .then(resp => resp.json())
                      .then(data => {
                        toast.success(data.message || "Full cycle test completed successfully");
                      })
                      .catch(err => {
                        toast.error(`Full cycle test failed: ${err.message}`);
                      });
                    }}>
                      Test Full Cycle
                    </Button>
                    
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p><strong>What it does:</strong> Tests the complete scheduler cycle: processing yesterday's results, generating upcoming games, and ensuring clues are available.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Sandbox Data Management
              </CardTitle>
              <CardDescription>
                Tools for managing sandbox test data for development and testing purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="keep-days">Days of Data to Keep</Label>
                  <Input type="number" id="keep-days" defaultValue="2" min="1" max="7" />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      const daysToKeep = (document.getElementById("keep-days") as HTMLInputElement).value;
                      
                      // Confirm before proceeding
                      if (confirm(`This will delete all sandbox test data older than ${daysToKeep} days. Are you sure?`)) {
                        toast.info("Cleaning up sandbox data...");
                        
                        fetch(`${API_URL}/scheduler/test/cleanup-sandbox-data?days_to_keep=${daysToKeep}`, {
                          method: "POST",
                          credentials: "include",
                        })
                        .then(resp => resp.json())
                        .then(data => {
                          if (data.success) {
                            toast.success(`${data.removed_count} old game entries removed`);
                          } else {
                            toast.error(data.message || "Operation failed");
                          }
                        })
                        .catch(err => {
                          toast.error(`Cleanup failed: ${err.message}`);
                        });
                      }
                    }}
                  >
                    Clean Up Sandbox Data
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    Note: This only works in sandbox mode and will not affect production data.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar2 className="h-5 w-5 mr-2" />
                Scheduler Documentation
              </CardTitle>
              <CardDescription>
                Complete reference documentation for the scheduling system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div id="scheduler-docs" className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Loading documentation...</h3>
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cron" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cron Settings</CardTitle>
              <CardDescription>
                The cron job checks for scheduled tasks that need to be executed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={cronStatus?.is_enabled} 
                      onCheckedChange={toggleCronEnabled}
                    />
                    <span>{cronStatus?.is_enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label>Check Interval</Label>
                  <div className="flex items-center space-x-2">
                    <span>{cronStatus?.interval_minutes} minutes</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowIntervalDialog(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label>Last Run</Label>
                  <div>
                    {cronStatus?.last_run ? (
                      formatDateTime(cronStatus.last_run)
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label>Next Run</Label>
                  <div>
                    {cronStatus?.next_run ? (
                      formatDateTime(cronStatus.next_run)
                    ) : (
                      <span className="text-muted-foreground">Not scheduled</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label>Current Time</Label>
                  <div>{formatDateTime(cronStatus?.current_time)}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runCronNow}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Cron Now
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Interval Change Dialog */}
      <Dialog open={showIntervalDialog} onOpenChange={setShowIntervalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Cron Interval</DialogTitle>
            <DialogDescription>
              Set how often the system should check for scheduled tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cronInterval">Interval (minutes)</Label>
              <Input
                id="cronInterval"
                type="number"
                min="1"
                value={cronInterval}
                onChange={(e) => setCronInterval(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={updateCronInterval}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error management dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduler Error Logs</DialogTitle>
            <DialogDescription>
              Recent errors encountered during scheduled task execution.
            </DialogDescription>
          </DialogHeader>
          
          {schedulerErrors.length > 0 ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={clearErrorLogs}>
                  Clear All Errors
                </Button>
              </div>
              
              <div className="space-y-4">
                {schedulerErrors.map((error, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                            {error.task_type} task error
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Task ID: {error.task_id} | Exchange: {error.exchange}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {formatDateTime(error.timestamp)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-sm">
                        <span className="font-medium">Error message:</span> {error.error_message}
                      </div>
                      
                      {error.stack_trace && (
                        <div className="mt-2">
                          <details>
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors">
                              View stack trace
                            </summary>
                            <pre className="mt-2 p-2 text-xs bg-background/80 rounded border overflow-x-auto whitespace-pre-wrap max-h-60">
                              {error.stack_trace}
                            </pre>
                          </details>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <p>No errors have been recorded.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
