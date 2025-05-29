import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminPanel() {
  // Import the components only when they're needed
  const { UserManagement } = require("components/UserManagement");
  const { GameManagement } = require("components/GameManagement");
  const { NotificationCenter } = require("components/NotificationCenter");
  const { UserSubmissions } = require("components/UserSubmissions");
  const { CsvUpload } = require("components/CsvUpload");
  const { SchedulerManagement } = require("components/SchedulerManagement");

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="games" className="space-y-4">
        <TabsList className="grid grid-cols-6 gap-4">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="games">
          <GameManagement />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="submissions">
          <UserSubmissions />
        </TabsContent>
        
        <TabsContent value="uploads">
          <CsvUpload />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>
        
        <TabsContent value="scheduler">
          <SchedulerManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}