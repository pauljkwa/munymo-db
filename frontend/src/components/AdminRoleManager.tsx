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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Search, User, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import brain from "brain";

interface AdminRole {
  userId: string;
  username?: string;
  email?: string;
  role: string;
}

interface AdminRoleManagerProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function AdminRoleManager({ setError, setIsLoading }: AdminRoleManagerProps) {
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newRoleUserId, setNewRoleUserId] = useState<string>("");
  const [newRoleValue, setNewRoleValue] = useState<string>("admin");
  
  // Format role for display
  const formatRole = (role: string): string => {
    // Convert snake_case to Title Case
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get icon for role
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'super_admin':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'moderator':
        return <ShieldQuestion className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fetch admin roles on component mount
  useEffect(() => {
    fetchAdminRoles();
  }, []);
  
  // Fetch admin roles from API
  const fetchAdminRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await brain.list_admin_roles();
      const data = await response.json();
      
      if (data && data.roles) {
        // Map API response format to our component format
        const rolesData = data.roles.map((role: any) => ({
          userId: role.user_id,
          username: role.username,
          email: role.email,
          role: role.role
        }));
        
        setAdminRoles(rolesData);
        toast.success("Admin roles loaded");
      } else {
        console.error("Unexpected API response format:", data);
        setAdminRoles([]);
        toast.error("No admin roles found or unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching admin roles:", error);
      setError("Failed to load admin roles. Make sure you have super_admin permissions.");
      toast.error("Failed to load admin roles");
      setAdminRoles([]); // Clear roles on error
    } finally {
      setLoading(false);
    }
  };
  
  // Assign role via API
  const assignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleUserId) {
      toast.error("Please enter a user ID");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await brain.assign_admin_role(
        { user_id: newRoleUserId },
        { role: newRoleValue }
      );
      
      const data = await response.json();
      
      if (data && data.success) {
        // Update local state with the new role
        const existingRoleIndex = adminRoles.findIndex(r => r.userId === newRoleUserId);
        
        if (existingRoleIndex >= 0) {
          // Update existing role
          const updatedRoles = [...adminRoles];
          updatedRoles[existingRoleIndex].role = newRoleValue;
          setAdminRoles(updatedRoles);
        } else {
          // Add new role
          setAdminRoles([
            ...adminRoles,
            { userId: newRoleUserId, role: newRoleValue }
          ]);
        }
        
        // Reset form
        setNewRoleUserId("");
        setNewRoleValue("admin");
        
        toast.success(`User assigned role: ${formatRole(newRoleValue)}`);
      } else {
        toast.error(data.message || "Failed to assign role");
        setError(data.message || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
      setError("An error occurred while assigning the role.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove role via API
  const removeRole = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin role?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await brain.remove_admin_role({ user_id: userId });
      const data = await response.json();
      
      if (data && data.success) {
        // Update local state by removing the role
        setAdminRoles(adminRoles.filter(role => role.userId !== userId));
        toast.success("Admin role removed");
      } else {
        toast.error(data.message || "Failed to remove role");
        setError(data.message || "Failed to remove role");
      }
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
      setError("An error occurred while removing the role.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter roles by search term
  const filteredRoles = adminRoles.filter(
    (role) =>
      !searchTerm ||
      (role.username && role.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (role.email && role.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      role.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Permissions System</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p>Manage administrator permission levels:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Super Admin:</strong> Owner with complete control (can manage other admins)</li>
              <li><strong>Admin:</strong> Standard administrator with access to all game management</li>
              <li><strong>Moderator:</strong> Limited permissions for content moderation only</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Assign New Role</CardTitle>
            <CardDescription>
              Grant administrative permissions to a user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={assignRole} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    placeholder="Enter Supabase user ID"
                    value={newRoleUserId}
                    onChange={(e) => setNewRoleUserId(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role-select">Role</Label>
                  <Select
                    value={newRoleValue}
                    onValueChange={setNewRoleValue}
                  >
                    <SelectTrigger id="role-select" className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full">Assign Role</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center gap-2 w-full mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search admin users..."
          className="w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No admin roles found{searchTerm ? " matching your search" : ""}.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.userId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{role.username || role.userId}</div>
                        {role.email && (
                          <div className="text-sm text-muted-foreground">{role.email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role.role)}
                      <span>{formatRole(role.role)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeRole(role.userId)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <div className="mt-6">
        <Alert>
          <AlertTitle>Permission Details</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Super Admin</h4>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>Manage all admins and roles</li>
                  <li>Full access to all game data</li>
                  <li>System configuration</li>
                  <li>User management</li>
                  <li>All other admin capabilities</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Admin</h4>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>Manage games and submissions</li>
                  <li>User data & subscription management</li>
                  <li>Import/export data</li>
                  <li>Cannot manage other admins</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Moderator</h4>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>Review & approve submissions</li>
                  <li>View user data (read-only)</li>
                  <li>View game data (read-only)</li>
                  <li>No management capabilities</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
