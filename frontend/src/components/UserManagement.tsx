  // Helper function to format subscription tier
  const formatSubscriptionTier = (tier: string | undefined | null): string => {
    if (!tier) return "Free";
    // Capitalize first letter
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  };import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Search, User, Mail, CalendarClock } from "lucide-react";
import brain from "brain";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  created_at: string;
  is_admin: boolean;
  is_active: boolean;
  subscription_tier?: string;
  last_login_at?: string;
}

interface UserManagementProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function UserManagement({ setError, setIsLoading }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAdmin, setFilterAdmin] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Helper functions for formatting data
  const formatSubscriptionTier = (tier: string | undefined | null): string => {
    if (!tier) return "Free";
    // Capitalize first letter
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Never";
    try {
      // Try to create a valid date and check if it's valid
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Never";
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e, dateString);
      return "Never";
    }
  };

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [filterAdmin, filterActive]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      let queryParams: Record<string, any> = {};
      if (filterAdmin !== "all") queryParams.is_admin = filterAdmin === "true";
      if (filterActive !== "all") queryParams.is_active = filterActive === "true";

      console.log("Fetching users with params:", queryParams);
      const response = await brain.list_users(queryParams);
      const data = await response.json();
      console.log("User data received:", data);
      
      // Enhanced debugging
      if (data.users && data.users.length > 0) {
        console.log("Sample user data:", JSON.stringify(data.users[0], null, 2));
        console.log("Email property exists:", Object.prototype.hasOwnProperty.call(data.users[0], 'email'));
        console.log("Email value:", data.users[0].email);
        console.log("Last login property exists:", Object.prototype.hasOwnProperty.call(data.users[0], 'last_login_at'));
        console.log("Last login value:", data.users[0].last_login_at);
        console.log("Subscription tier property exists:", Object.prototype.hasOwnProperty.call(data.users[0], 'subscription_tier'));
        console.log("Subscription tier value:", data.users[0].subscription_tier);
        
        // Log all properties of the user object
        console.log("All user properties:", Object.keys(data.users[0]));
      } else {
        console.log("No users found in response");
      }
      
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      await brain.update_user_status(
        { user_id: userId },
        { is_admin: !currentStatus }
      );
      
      // Update user in the list
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        )
      );
      
      toast.success(`User ${!currentStatus ? "promoted to admin" : "removed from admin role"}`);
    } catch (error) {
      console.error("Error updating user admin status:", error);
      toast.error("Failed to update user admin status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      await brain.update_user_status(
        { user_id: userId },
        { is_active: !currentStatus }
      );
      
      // Update user in the list
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        )
      );
      
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating user active status:", error);
      toast.error("Failed to update user active status");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(
    (user) =>
      !searchTerm ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admin-filter">Admin Status</Label>
              <Select 
                value={filterAdmin} 
                onValueChange={setFilterAdmin}
              >
                <SelectTrigger id="admin-filter">
                  <SelectValue placeholder="Filter by admin status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Admins Only</SelectItem>
                  <SelectItem value="false">Non-Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="active-filter">Active Status</Label>
              <Select 
                value={filterActive} 
                onValueChange={setFilterActive}
              >
                <SelectTrigger id="active-filter">
                  <SelectValue placeholder="Filter by active status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Active Users</SelectItem>
                  <SelectItem value="false">Inactive Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No users found matching your filters.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Subscription Tier</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{user.username || "Unknown"}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email ? user.email : "No email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarClock className="mr-1 h-3 w-3 text-muted-foreground" />
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(user.last_login_at)}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(user.subscription_tier)}`}>
                      {formatSubscriptionTier(user.subscription_tier)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={user.is_admin} 
                      onCheckedChange={() => handleToggleAdmin(user.id, user.is_admin)}
                      aria-label="Toggle admin status"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={user.is_active} 
                      onCheckedChange={() => handleToggleActive(user.id, user.is_active)}
                      aria-label="Toggle active status"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Helper function to get badge color based on subscription tier
function getSubscriptionBadgeColor(tier?: string): string {
  switch (tier?.toLowerCase()) {
    case "premium":
      return "bg-purple-100 text-purple-800";
    case "pro":
      return "bg-blue-100 text-blue-800";
    case "elite":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
