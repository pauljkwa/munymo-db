import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestingPanel from "components/TestingPanel";

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Testing Dashboard</CardTitle>
          <CardDescription>
            Comprehensive testing for signup and notification flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="execution">
            <TabsList className="mb-6">
              <TabsTrigger value="execution">Test Execution</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="execution">
              <TestingPanel title="Signup & Notification Test Suite" />
            </TabsContent>
            
            <TabsContent value="documentation">
              <div className="prose dark:prose-invert max-w-none">
                <h2>Test Documentation</h2>
                
                <div className="mb-8">
                  <h3>1. Signup Flow Testing</h3>
                  <p>
                    Tests the complete signup process without phone verification, including:
                  </p>
                  <ul>
                    <li>Email/password registration</li>
                    <li>Email verification (simulated)</li>
                    <li>Plan selection preservation</li>
                    <li>Redirection to appropriate pages</li>
                  </ul>
                  <p>
                    <strong>Usage:</strong> Fill in the form or leave fields empty for random values, then click "Test Signup Flow" to execute the test.
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3>2. Notification Delivery Testing</h3>
                  <p>
                    Tests the notification delivery system across different browsers:
                  </p>
                  <ul>
                    <li>Permission request simulation</li>
                    <li>Token generation and storage</li>
                    <li>Notification display (simulated)</li>
                    <li>Category-based filtering</li>
                  </ul>
                  <p>
                    <strong>Usage:</strong> Enter a user ID (or run signup test first) and select browser and category options, then click "Test Notification Delivery".
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3>3. Multi-Device Support Testing</h3>
                  <p>
                    Tests support for multiple devices per user:
                  </p>
                  <ul>
                    <li>Device registration across platforms</li>
                    <li>Unique device identification</li>
                    <li>Simultaneous notification delivery</li>
                  </ul>
                  <p>
                    <strong>Usage:</strong> Enter a user ID and specify the number of test devices to create, then click "Test Multi-Device Support".
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3>4. Edge Case Testing</h3>
                  <p>
                    Tests handling of various edge cases:
                  </p>
                  <ul>
                    <li>Permission denied scenarios</li>
                    <li>Offline device handling</li>
                    <li>Token refresh scenarios</li>
                    <li>Notification preference filtering</li>
                  </ul>
                  <p>
                    <strong>Usage:</strong> Enter a user ID and click "Test Edge Cases" to simulate and verify these scenarios.
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3>5. Test Report Generation</h3>
                  <p>
                    Generates a comprehensive test report covering all aspects of testing:
                  </p>
                  <ul>
                    <li>Signup flow verification</li>
                    <li>Browser compatibility</li>
                    <li>Multi-device support status</li>
                    <li>Edge case handling</li>
                  </ul>
                  <p>
                    <strong>Usage:</strong> Click "Generate Test Report" to create a complete report of all tested functionality.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;