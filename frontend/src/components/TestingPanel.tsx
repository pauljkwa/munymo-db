import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, ArrowRight, Shield, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import brain from "brain";
import { API_URL } from "app";
import { useAuthStore } from "utils/authStore";

interface Props {
  title?: string;
}

const TestingPanel: React.FC<Props> = ({ title = "Testing Panel" }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const { session } = useAuthStore();
  
  // Game testing state
  const [exchangeCode, setExchangeCode] = useState<string>("NYSE");
  const [gameId, setGameId] = useState<string>("");
  const [companyPair, setCompanyPair] = useState<any>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [predictionChoice, setPredictionChoice] = useState<string>("");
  const [testPhase, setTestPhase] = useState<"setup" | "prediction" | "results" | "">("");
  const [testResults, setTestResults] = useState<any[]>([]);
  
  // Authentication test state
  const [testAuthToken, setTestAuthToken] = useState<string>("");
  const [testUserId, setTestUserId] = useState<string>("");
  const [testRole, setTestRole] = useState<string>("user");
  const [testTier, setTestTier] = useState<string>("free");
  const [useTestAuth, setUseTestAuth] = useState<boolean>(false);
  
  // Notification test state
  const [userId, setUserId] = useState<string>("");
  const [browser, setBrowser] = useState<string>("chrome");
  const [category, setCategory] = useState<string>("game_results");
  const [deviceCount, setDeviceCount] = useState<number>(3);

  // Generate test authentication token
  const handleGenerateTestAuth = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/test-auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: testUserId || undefined, // Only send if not empty
          role: testRole,
          tier: testTier
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setTestAuthToken(data.access_token);
      setTestUserId(data.user_id); // Update with generated ID if one wasn't provided
      
      toast.success('Test authentication token generated', {
        description: `Token generated for user ${data.user_id} with role ${data.role} and tier ${data.tier}`
      });
      
      // Auto-enable test auth when token is generated
      setUseTestAuth(true);
      
    } catch (error) {
      console.error('Error generating test auth token:', error);
      toast.error('Failed to generate test token', {
        description: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get Auth headers that works in both real and test modes
  const getAuthHeaders = () => {
    // First try to use real authentication
    if (session) {
      return {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      };
    }
    
    // Fall back to test authentication if enabled
    if (useTestAuth && testAuthToken) {
      return {
        headers: {
          authorization: `Bearer ${testAuthToken}`
        }
      };
    }
    
    // No authentication available
    toast.error('Authentication required', {
      description: 'You need to be logged in or use test auth to perform this action.'
    });
    return null;
  };

  // Function to generate a test report after tests have been run
  const generateTestReport = async () => {
    try {
      const response = await fetch(`${API_URL}/test/documentation/test-status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating test report:', error);
      return null;
    }
  };
  
  // Use this for development error logging
  const logTestError = (functionName: string, error: any) => {
    console.error(`Error in ${functionName}:`, error);
    let errorMessage = String(error);
    
    // Try to extract more detailed error information
    if (error.response) {
      try {
        error.response.json().then((data: any) => {
          console.error('Detailed error:', data);
        });
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    return errorMessage;
  };
  
  const handleSignupTest = async () => {
    try {
      setLoading(true);
      
      // Generate random values if empty
      // Generate unique identifiers for this test run to avoid conflicts
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const testEmail = email || `test_${randomStr}_${timestamp}@example.com`;
      const testUsername = username || `tester_${randomStr}`;
      
      console.log(`Testing signup with email: ${testEmail}, username: ${testUsername}`);
      
      // Ensure test_signup endpoint is called correctly with optional params
      const response = await brain.test_signup({
        email: testEmail,
        password: password,
        username: testUsername,
        plan: plan
      });
      
      const data = await response.json();
      console.log('Signup test response:', data);
      setResults(data);
      
      if (data.success) {
        toast.success('Signup test successful', {
          description: data.message
        });
        
        // Store the user ID for notification tests
        if (data.details?.user_id) {
          setUserId(data.details.user_id);
        }
      } else {
        toast.error('Signup test failed', {
          description: data.message
        });
      }
    } catch (error) {
      const errorMsg = logTestError('handleSignupTest', error);
      toast.error('Error running signup test', {
        description: errorMsg
      });
      setResults({ success: false, message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGamePair = async () => {
    try {
      setLoading(true);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setLoading(false);
        return;
      }
      
      // Call the company pair generation endpoint
      const response = await fetch(`${API_URL}/ai/generate-company-pair?exchange=${exchangeCode}`, {
        method: 'GET',
        ...authHeaders
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setResults(data);
      setCompanyPair(data);
      
      toast.success('Company pair generated', {
        description: `${data.company_a?.name} vs ${data.company_b?.name}`
      });
      
    } catch (error) {
      toast.error('Error generating company pair', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to test game generation
  const handleGenerateMockGame = async () => {
    try {
      setLoading(true);
      
      // Call mock game generation endpoint 
      const response = await brain.generate_mock_game_endpoint({
        exchange: exchangeCode
      });
      
      const data = await response.json();
      setResults(data);
      setGameData(data);
      
      // Add to test results log
      setTestResults(prev => [...prev, {
        step: "Generate Game",
        success: true,
        message: `Mock game generated for ${data.company_a_name} vs ${data.company_b_name}`,
        details: {
          game_date: data.game_date,
          sector: data.sector,
          companies: `${data.company_a_ticker} vs ${data.company_b_ticker}`
        },
        timestamp: new Date().toISOString()
      }]);
      
      // Save the game ID for future tests
      if (data && data.id) {
        setGameId(data.id);
        toast.success('Mock game generated', {
          description: `${data.company_a_name} vs ${data.company_b_name}`
        });
        
        // Set to prediction phase
        setTestPhase("setup");
      } else {
        toast.error('Failed to generate mock game', {
          description: 'No game ID returned'
        });
      }
      
    } catch (error) {
      const errorMsg = logTestError('handleGenerateMockGame', error);
      setTestResults(prev => [...prev, {
        step: "Generate Game",
        success: false,
        message: errorMsg,
        timestamp: new Date().toISOString()
      }]);
      toast.error('Error generating mock game', {
        description: errorMsg
      });
      setResults({ success: false, message: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for submitting a prediction
  const handleSubmitPrediction = async () => {
    try {
      setLoading(true);
      if (!gameData || !predictionChoice) {
        toast.error("Missing required information", {
          description: "Both game data and a prediction choice are required."
        });
        setLoading(false);
        return;
      }
      
      // Log the test step
      setTestResults(prev => [...prev, {
        step: "Submit Prediction",
        success: true,
        message: `Attempting to submit prediction for ${predictionChoice}...`,
        timestamp: new Date().toISOString()
      }]);
      
      // For now, we'll just simulate this since it needs real authentication
      // In a real implementation we'd call the submit_prediction endpoint
      
      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestPhase("prediction");
      
      // Log the result
      setTestResults(prev => [...prev, {
        step: "Submit Prediction",
        success: true,
        message: `Prediction submitted for ${predictionChoice}`,
        details: {
          game_id: gameData.id || "mock-game-id",
          predicted_ticker: predictionChoice,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }]);
      
      toast.success("Prediction submitted", {
        description: `You predicted ${predictionChoice} will perform better`
      });
    } catch (error) {
      const errorMsg = logTestError('handleSubmitPrediction', error);
      setTestResults(prev => [...prev, {
        step: "Submit Prediction",
        success: false,
        message: errorMsg,
        timestamp: new Date().toISOString()
      }]);
      toast.error("Failed to submit prediction", {
        description: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for processing results
  const handleProcessResults = async () => {
    try {
      setLoading(true);
      if (!gameData) {
        toast.error("Missing game data", {
          description: "Game data is required to process results."
        });
        setLoading(false);
        return;
      }
      
      // Log the test step
      setTestResults(prev => [...prev, {
        step: "Process Results",
        success: true,
        message: "Attempting to process game results...",
        timestamp: new Date().toISOString()
      }]);
      
      // For now, we'll just simulate this since it needs admin authentication
      // In a real implementation we'd call the process_game_results endpoint
      
      // Simulate successful processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const winner = Math.random() > 0.5 ? gameData.company_a_ticker : gameData.company_b_ticker;
      const isCorrect = winner === predictionChoice;
      
      setTestPhase("results");
      
      // Log the result
      setTestResults(prev => [...prev, {
        step: "Process Results",
        success: true,
        message: `Results processed. ${winner} was the winner.`,
        details: {
          game_id: gameData.id || "mock-game-id",
          winner: winner,
          your_prediction: predictionChoice,
          is_correct: isCorrect,
          points_earned: isCorrect ? 10 : 0
        },
        timestamp: new Date().toISOString()
      }]);
      
      toast.success("Results processed", {
        description: `Winner: ${winner}. Your prediction was ${isCorrect ? 'correct!' : 'incorrect.'}`
      });
    } catch (error) {
      const errorMsg = logTestError('handleProcessResults', error);
      setTestResults(prev => [...prev, {
        step: "Process Results",
        success: false,
        message: errorMsg,
        timestamp: new Date().toISOString()
      }]);
      toast.error("Failed to process results", {
        description: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to test AI reasoning
  const handleTestAiReasoning = async () => {
    try {
      setLoading(true);
      
      // Call AI reasoning test endpoint
      const response = await brain.test_ai_reasoning(getAuthParams());
      
      const data = await response.json();
      setResults(data);
      
      toast.success('AI reasoning test completed', {
        description: 'See results below'
      });
      
    } catch (error) {
      toast.error('Error testing AI reasoning', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to test the full scheduler cycle
  const handleTestFullCycle = async () => {
    try {
      setLoading(true);
      
      // Call full scheduler cycle test endpoint
      const response = await brain.test_full_scheduler_cycle({
        exchange: exchangeCode
      }, getAuthParams());
      
      const data = await response.json();
      setResults(data);
      
      toast.success('Full scheduler cycle test completed', {
        description: data.message || 'Test completed successfully'
      });
      
    } catch (error) {
      toast.error('Error testing full scheduler cycle', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationTest = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        toast.error('User ID required', {
          description: 'Please run the signup test first or enter a user ID'
        });
        return;
      }
      
      // Call notification test endpoint using brain client
      const response = await brain.test_notification_delivery({

        user_id: userId,
        browser: browser,
        category: category
      });
      
      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        toast.success('Notification test successful', {
          description: data.message
        });
      } else {
        toast.error('Notification test failed', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error running notification test', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiDeviceTest = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        toast.error('User ID required', {
          description: 'Please run the signup test first or enter a user ID'
        });
        return;
      }
      
      // Call multi-device test endpoint using brain client
      const response = await brain.test_multi_device({

        user_id: userId,
        device_count: deviceCount
      });
      
      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        toast.success('Multi-device test successful', {
          description: data.message
        });
      } else {
        toast.error('Multi-device test failed', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error running multi-device test', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleEdgeCaseTest = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        toast.error('User ID required', {
          description: 'Please run the signup test first or enter a user ID'
        });
        return;
      }
      
      // Call edge case test endpoint using brain client
      const response = await brain.test_edge_cases({

        user_id: userId
      });
      
      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        toast.success('Edge case test successful', {
          description: data.message
        });
      } else {
        toast.error('Edge case test failed', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error running edge case test', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      // Call report generation endpoint using brain client
      const response = await brain.generate_test_report(getAuthParams());
      
      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        toast.success('Test report generated', {
          description: data.message
        });
      } else {
        toast.error('Failed to generate test report', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error generating test report', {
        description: String(error)
      });
      setResults({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Test suites for Munymo end-to-end functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signup">
          <TabsList className="grid grid-cols-7 mb-8">
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="notification">Notification</TabsTrigger>
            <TabsTrigger value="multi-device">Multi-Device</TabsTrigger>
            <TabsTrigger value="edge-cases">Edge Cases</TabsTrigger>
            <TabsTrigger value="game">Game Flow</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>
          
          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 mb-4">
              <p className="text-sm font-medium">Test Authentication</p>
              <p className="text-sm mt-1">
                Generate a valid authentication token that can be used to test protected endpoints.
                This token will work with the real authentication system in development mode.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="useTestAuth">Use Test Authentication</Label>
                <Switch
                  id="useTestAuth"
                  checked={useTestAuth}
                  onCheckedChange={setUseTestAuth}
                  disabled={!testAuthToken}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="testUserId">User ID (optional)</Label>
                <Input
                  id="testUserId"
                  placeholder="Leave empty to generate random ID"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="testRole">User Role</Label>
                <Select value={testRole} onValueChange={setTestRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="testTier">Subscription Tier</Label>
                <Select value={testTier} onValueChange={setTestTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleGenerateTestAuth} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating token...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Generate Test Auth Token
                  </>
                )}
              </Button>
              
              {testAuthToken && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Authentication Status:</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">User ID:</span> {testUserId}</p>
                    <p><span className="font-medium">Role:</span> {testRole}</p>
                    <p><span className="font-medium">Tier:</span> {testTier}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={useTestAuth ? "text-green-500 ml-1" : "text-yellow-500 ml-1"}>
                        {useTestAuth ? "Active" : "Inactive (toggle switch to use)"}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Report Tab with Test Plan */}
          <TabsContent value="report" className="space-y-4">
            <div className="grid gap-4">
              <div className="bg-primary/5 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Test Plans and Documentation
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive test plans for validating critical app functionality.
                  Use these plans to ensure all components work correctly before deployment.
                </p>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setLoading(true);
                      fetch(`${API_URL}/test-plan/payment`)
                        .then(response => response.json())
                        .then(data => {
                          setResults(data);
                          toast.success('Payment test plan loaded');
                        })
                        .catch(error => {
                          toast.error('Failed to load test plan', {
                            description: String(error)
                          });
                        })
                        .finally(() => setLoading(false));
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Load Payment Test Plan
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setLoading(true);
                      fetch(`${API_URL}/test-plan/database`)
                        .then(response => response.json())
                        .then(data => {
                          setResults(data);
                          toast.success('Database test plan loaded');
                        })
                        .catch(error => {
                          toast.error('Failed to load test plan', {
                            description: String(error)
                          });
                        })
                        .finally(() => setLoading(false));
                    }}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    Load Database Test Plan
                  </Button>
                </div>
              </div>
              
              {/* Test Plan Display */}
              {results && results.scenarios && (
                <div className="border rounded-md p-4">
                  <h3 className="text-xl font-medium mb-2">{results.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{results.description}</p>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {results.scenarios.map((scenario: any) => (
                      <AccordionItem key={scenario.id} value={scenario.id}>
                        <AccordionTrigger className="text-md">
                          <div className="flex items-center">
                            <span className="font-medium">{scenario.id}: {scenario.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-2">
                            <p className="mb-2 text-sm">{scenario.description}</p>
                            
                            {scenario.setup_required && (
                              <div className="mb-2 text-sm bg-amber-50 p-2 rounded">
                                <strong>Setup:</strong> {scenario.setup_required}
                              </div>
                            )}
                            
                            <div className="border rounded-md my-2">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2">ID</th>
                                    <th className="text-left p-2">Description</th>
                                    <th className="text-left p-2">Expected Result</th>
                                    <th className="text-left p-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scenario.steps.map((step: any) => (
                                    <tr key={step.id} className="border-t">
                                      <td className="p-2">{step.id}</td>
                                      <td className="p-2">{step.description}</td>
                                      <td className="p-2">{step.expected_result}</td>
                                      <td className="p-2">
                                        <div className="flex items-center">
                                          {step.implemented ? (
                                            <span className="text-green-500 flex items-center">
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              Implemented
                                            </span>
                                          ) : (
                                            <span className="text-amber-500 flex items-center">
                                              <XCircle className="h-4 w-4 mr-1" />
                                              Not Implemented
                                            </span>
                                          )}
                                          {step.critical && (
                                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                              Critical
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              
              {/* Manual Test Execution Plan */}
              <div className="bg-primary/5 p-4 rounded-md mt-6">
                <h3 className="text-lg font-medium mb-2">Test Execution Checklist</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow this checklist to ensure thorough testing before deployment:
                </p>
                
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Run all test scenarios starting with database tests</li>
                  <li>Ensure all critical test cases pass without errors</li>
                  <li>Verify authentication flow works with both regular and test authentication</li>
                  <li>Test subscription purchase and management with test credentials</li>
                  <li>Check daily prediction game flow from start to finish</li>
                  <li>Verify proper error handling for edge cases</li>
                  <li>Test admin functionality for managing users and games</li>
                  <li>Deploy to staging environment for final verification</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          {/* Subscription Testing Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 mb-4">
              <p className="text-sm font-medium">Test Subscription Flow</p>
              <p className="text-sm mt-1">
                Test the complete subscription flow without charging real credit cards.
                This will create test customers and subscriptions in Stripe's test environment.
              </p>
            </div>
            
            <div className="grid gap-4">
              {/* User ID Input */}
              <div className="grid gap-2">
                <Label htmlFor="subUserId">User ID</Label>
                <Input
                  id="subUserId"
                  placeholder="Enter user ID to test subscription"
                  value={testUserId} // Reuse the test user ID from auth tab
                  onChange={(e) => setTestUserId(e.target.value)}
                />
              </div>
              
              {/* Tier Selection */}
              <div className="grid gap-2">
                <Label htmlFor="subTier">Subscription Tier</Label>
                <Select
                  value={testTier} // Reuse the test tier from auth tab
                  onValueChange={setTestTier}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Frequency Selection */}
              <div className="grid gap-2">
                <Label htmlFor="subFrequency">Billing Frequency</Label>
                <RadioGroup defaultValue="monthly" className="flex">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="font-normal">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="annual" id="annual" />
                    <Label htmlFor="annual" className="font-normal">Annual</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Simulate Checkout Button */}
              <Button 
                onClick={() => {
                  if (!testUserId) {
                    toast.error('User ID required', { description: 'Please enter a user ID to test the subscription.' });
                    return;
                  }
                  
                  setLoading(true);
                  fetch(`${API_URL}/test-stripe/simulate-checkout`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      user_id: testUserId,
                      tier: testTier,
                      frequency: 'monthly' // TODO: Get from radio group
                    })
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      toast.success('Subscription simulation complete', {
                        description: `Successfully simulated ${testTier} subscription for user ${testUserId}`
                      });
                      setResults(data);
                    })
                    .catch(error => {
                      toast.error('Subscription simulation failed', {
                        description: String(error)
                      });
                    })
                    .finally(() => setLoading(false));
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Simulating Subscription...
                  </>
                ) : (
                  'Simulate Subscription Purchase'
                )}
              </Button>
              
              {/* Simulate Cancellation Button */}
              <Button 
                variant="outline"
                onClick={() => {
                  if (!testUserId) {
                    toast.error('User ID required', { description: 'Please enter a user ID to test cancellation.' });
                    return;
                  }
                  
                  setLoading(true);
                  fetch(`${API_URL}/test-stripe/simulate-subscription-event`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      event_type: 'subscription.canceled',
                      user_id: testUserId
                    })
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      toast.success('Subscription cancellation simulated', {
                        description: `Subscription for user ${testUserId} has been cancelled.`
                      });
                      setResults(data);
                    })
                    .catch(error => {
                      toast.error('Subscription cancellation failed', {
                        description: String(error)
                      });
                    })
                    .finally(() => setLoading(false));
                }}
                disabled={loading}
              >
                Simulate Subscription Cancellation
              </Button>
              
              {/* Results Display */}
              {results && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Subscription Test Results:</h4>
                  <pre className="text-xs overflow-auto max-h-48">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Notification Test Tab */}
          <TabsContent value="notification" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID (or run signup test first)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="browser">Browser</Label>
                <Select value={browser} onValueChange={setBrowser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select browser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chrome">Chrome</SelectItem>
                    <SelectItem value="firefox">Firefox</SelectItem>
                    <SelectItem value="safari">Safari</SelectItem>
                    <SelectItem value="edge">Edge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Notification Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="game_results">Game Results</SelectItem>
                    <SelectItem value="leaderboard">Leaderboard</SelectItem>
                    <SelectItem value="system_updates">System Updates</SelectItem>
                    <SelectItem value="predictions">Predictions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleNotificationTest} disabled={loading || !userId}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Notification...
                  </>
                ) : 'Test Notification Delivery'}
              </Button>
            </div>
          </TabsContent>
          
          {/* Multi-Device Test Tab */}
          <TabsContent value="multi-device" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID (or run signup test first)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deviceCount">Number of Devices</Label>
                <Input
                  id="deviceCount"
                  type="number"
                  min="1"
                  max="10"
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(parseInt(e.target.value) || 3)}
                />
              </div>
              
              <Button onClick={handleMultiDeviceTest} disabled={loading || !userId}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Multi-Device...
                  </>
                ) : 'Test Multi-Device Support'}
              </Button>
            </div>
          </TabsContent>
          
          {/* Edge Cases Test Tab */}
          <TabsContent value="edge-cases" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID (or run signup test first)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              
              <Button onClick={handleEdgeCaseTest} disabled={loading || !userId}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Edge Cases...
                  </>
                ) : 'Test Edge Cases'}
              </Button>
            </div>
          </TabsContent>
          
          {/* Game Flow Testing Tab */}
          <TabsContent value="game" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Select value={exchangeCode} onValueChange={setExchangeCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NYSE">NYSE</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                    <SelectItem value="LSE">LSE</SelectItem>
                    <SelectItem value="ASX">ASX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Game Test Flow - Phase-based UI */}
              {testPhase === "" && (
                <div className="grid gap-2">
                  <p className="text-muted-foreground">Start by generating a mock game</p>
                  <Button onClick={handleGenerateMockGame} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Game...
                      </>
                    ) : 'Generate Mock Game'}
                  </Button>
                </div>
              )}
              
              {testPhase === "setup" && gameData && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold mb-2">Test Game Generated:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <p><span className="font-medium">Date:</span> {gameData.game_date}</p>
                      <p><span className="font-medium">Sector:</span> {gameData.sector}</p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="p-3 bg-primary/10 rounded-md">
                          <h4 className="font-medium">{gameData.company_a_name}</h4>
                          <p className="text-sm">Ticker: {gameData.company_a_ticker}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-md">
                          <h4 className="font-medium">{gameData.company_b_name}</h4>
                          <p className="text-sm">Ticker: {gameData.company_b_ticker}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Submit Your Prediction:</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Which company do you think will perform better?
                    </p>
                    
                    <RadioGroup 
                      value={predictionChoice} 
                      onValueChange={setPredictionChoice}
                      className="flex flex-col space-y-3 mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={gameData.company_a_ticker} 
                          id="company-a" 
                        />
                        <Label htmlFor="company-a">{gameData.company_a_name} ({gameData.company_a_ticker})</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={gameData.company_b_ticker} 
                          id="company-b" 
                        />
                        <Label htmlFor="company-b">{gameData.company_b_name} ({gameData.company_b_ticker})</Label>
                      </div>
                    </RadioGroup>
                    
                    <Button 
                      onClick={handleSubmitPrediction} 
                      disabled={loading || !predictionChoice}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Prediction...
                        </>
                      ) : 'Submit Prediction'}
                    </Button>
                  </div>
                </div>
              )}
              
              {testPhase === "prediction" && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Prediction Submitted</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p>You predicted: <span className="font-medium">{predictionChoice}</span></p>
                  <p className="text-sm text-muted-foreground">
                    In a real scenario, you would wait for market close to see the results.
                  </p>
                  <div className="pt-2">
                    <Button onClick={handleProcessResults} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : 'Process Results (Admin)'}
                    </Button>
                  </div>
                </div>
              )}
              
              {testPhase === "results" && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
                  <h3 className="font-semibold">Game Results</h3>
                  <div className="space-y-2">
                    {testResults
                      .filter(r => r.step === "Process Results" && r.success)
                      .map((result, index) => (
                        <div key={index} className="space-y-1">
                          <p className="font-medium">Winner: {result.details?.winner}</p>
                          <p>Your prediction: {result.details?.your_prediction}</p>
                          <p>
                            Result: 
                            <span className={result.details?.is_correct ? "text-green-500 ml-1 font-medium" : "text-red-500 ml-1 font-medium"}>
                              {result.details?.is_correct ? "Correct" : "Incorrect"}
                            </span>
                          </p>
                          <p>Points earned: {result.details?.points_earned}</p>
                        </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => {
                      setTestPhase("");
                      setGameData(null);
                      setPredictionChoice("");
                      setTestResults([]);
                    }}>
                      Start New Test
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleGenerateCompanyPair} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : 'Generate Company Pair'}
                </Button>
                
                <Button onClick={handleTestAiReasoning} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : 'Test AI Reasoning'}
                </Button>
                
                <Button onClick={handleTestFullCycle} disabled={loading} className="col-span-2">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : 'Test Full Scheduler Cycle'}
                </Button>
              </div>
              
              {companyPair && testPhase === "" && (
                <div className="mt-4 border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Generated Company Pair:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-md">
                      <h4 className="font-medium">{companyPair.company_a?.name}</h4>
                      <p className="text-sm">Ticker: {companyPair.company_a?.ticker}</p>
                      <p className="text-sm">Sector: {companyPair.company_a?.sector}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <h4 className="font-medium">{companyPair.company_b?.name}</h4>
                      <p className="text-sm">Ticker: {companyPair.company_b?.ticker}</p>
                      <p className="text-sm">Sector: {companyPair.company_b?.sector}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Test History Log */}
              {testResults.length > 0 && (
                <div className="mt-4 border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Test Execution Log:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div 
                        key={index} 
                        className={`p-2 border-l-4 ${result.success ? 'border-green-500' : 'border-red-500'} bg-muted/30 rounded`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{result.step}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{result.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Report Generation Tab */}
          <TabsContent value="report" className="space-y-4">
            <div className="grid gap-4">
              <p className="text-muted-foreground">
                Generate a comprehensive test report covering all aspects of the signup and notification flow testing.
              </p>
              
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : 'Generate Test Report'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Results Display */}
        {results && (
          <div className="mt-8 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-shrink-0">
                {results.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{results.success ? 'Success' : 'Error'}</h3>
                <p className="text-sm text-muted-foreground">{results.message}</p>
              </div>
            </div>
            
            {results.details && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Details:</h4>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-80 text-xs">
                  {JSON.stringify(results.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Testing panel for signup, notification, and game flows
        </div>
      </CardFooter>
    </Card>
  );
};

export default TestingPanel;