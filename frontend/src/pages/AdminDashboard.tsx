import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Admin components (will create these next)
import { GameManagement } from "components/GameManagement";
import { UserSubmissions } from "components/UserSubmissions";
import { UserManagement } from "components/UserManagement";
import { CsvUpload } from "components/CsvUpload";
import { SubscriptionManager } from "components/SubscriptionManager";
import { AdminRoleManager } from "components/AdminRoleManager";
import { AnalyticsDashboard } from "components/AnalyticsDashboard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Game
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid grid-cols-7 w-full mb-6">
          <TabsTrigger value="games">Game Management</TabsTrigger>
          <TabsTrigger value="submissions">User Submissions</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Fixes</TabsTrigger>
          <TabsTrigger value="roles">Admin Roles</TabsTrigger>
          <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="analytics">Device Analytics</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>
              Manage games, user submissions, player accounts, and data imports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="games" className="mt-0">
              <GameManagement setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>

            <TabsContent value="submissions" className="mt-0">
              <UserSubmissions setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <UserManagement setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-0">
              <SubscriptionManager setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>
            
            <TabsContent value="roles" className="mt-0">
              <AdminRoleManager setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <CsvUpload setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard setError={setError} setIsLoading={setIsLoading} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}