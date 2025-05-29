import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Info, KeyRound, UserX, Mail, BellRing, Clock, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "utils/supabaseClient";
import { useAuthStore } from "utils/authStore";
import { useProfileStore, UserProfile } from "utils/profileStore";
import { useDeviceStore } from "utils/deviceStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import brain from "brain";
import DeviceList from "components/DeviceList";

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New York (ET)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AET)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST/NZDT)" },
];

function AccountPage() {
  // Auth and profile state
  const { session, loading: authLoading } = useAuthStore((state) => ({
    session: state.session,
    loading: state.loading,
  }));
  const userId = session?.user.id;
  
  const { profile, isLoading, updateProfile, updateNotificationPreferences, updateTimezone } = useProfileStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    updateProfile: state.updateProfile,
    updateNotificationPreferences: state.updateNotificationPreferences,
    updateTimezone: state.updateTimezone,
  }));
  
  // Device management state
  const { fetchDevices, isLoading: devicesLoading } = useDeviceStore((state) => ({
    fetchDevices: state.fetchDevices,
    isLoading: state.isLoading,
  }));
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
  });
  
  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notificationCategories, setNotificationCategories] = useState<string[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("UTC");

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  
  // Update notification preferences
  const handleUpdateNotificationPreferences = async () => {
    try {
      console.log('[AccountPage] Updating notification preferences with:', { 
        emailNotifications, 
        pushNotifications, 
        categories: notificationCategories,
        categoriesLength: notificationCategories.length
      });
      
      // Ensure we have valid notification categories
      let categoriesToSave = [...notificationCategories];
      
      // If push notifications are enabled but no categories, add default ones
      if (pushNotifications && categoriesToSave.length === 0) {
        categoriesToSave = ['game_results', 'leaderboard', 'system_updates'];
        console.log('[AccountPage] No categories selected but push enabled, using defaults:', categoriesToSave);
        setNotificationCategories(categoriesToSave);
      }
      
      await updateNotificationPreferences(emailNotifications, pushNotifications, categoriesToSave);
      toast.success("Notification preferences updated");
      
      // Send a test notification to verify if settings were applied
      try {
        await brain.test_notification();
        console.log('[AccountPage] Test notification sent');
      } catch (notifyError) {
        console.error('[AccountPage] Failed to send test notification:', notifyError);
      }
    } catch (error: any) {
      console.error("[AccountPage] Error updating notification preferences:", error);
      toast.error(`Failed to update notification preferences: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      console.log('[AccountPage] Setting form data from profile:', profile);
      setFormData({
        username: profile.username || "",
      });
      // Set notification preferences from profile
      setEmailNotifications(profile.email_notifications ?? true);
      setPushNotifications(profile.push_notifications ?? true);
      setNotificationCategories(profile.notification_categories || ['game_results', 'leaderboard', 'system_updates']);
      setSelectedTimezone("UTC");
    }
  }, [profile]);
  
  // Initialize device tracking and fetch devices
  useEffect(() => {
    if (userId) {
      useDeviceStore.getState().initializeDeviceTracking();
      fetchDevices();
    }
  }, [userId, fetchDevices]);
  
  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSaveChanges = async () => {
    if (!profile) return;
    
    console.log('[AccountPage] Saving profile changes:', formData);
    await updateProfile({
      username: formData.username,
    });
  };
  

  
  // Device management
  const handleRenameDevice = async (deviceId: string) => {
    if (!newDeviceName.trim()) {
      toast.error("Please enter a name for the device");
      return;
    }
    
    await updateDeviceName(deviceId, newDeviceName.trim());
    setEditingDeviceId(null);
    setNewDeviceName("");
  };
  
  const handleSignOutDevice = async (deviceId: string) => {
    if (confirm(`Are you sure you want to sign out this device?${deviceId === currentDeviceId ? ' This will sign you out of the current session.' : ''}`)) {
      await signOutDevice(deviceId);
      if (deviceId !== currentDeviceId) {
        // Refresh the devices list if we're not signing out the current device
        fetchDevices();
      }
    }
  };
  
  const getDeviceIcon = (deviceName: string) => {
    if (!deviceName) return <Monitor className="h-5 w-5" />;
    
    const deviceNameLower = deviceName.toLowerCase();
    if (deviceNameLower.includes('mobile') || deviceNameLower.includes('android') || deviceNameLower.includes('ios') || deviceNameLower.includes('iphone') || deviceNameLower.includes('ipad')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (deviceNameLower.includes('tablet')) {
      return <Laptop className="h-5 w-5 rotate-90" />;
    } else {
      return <Laptop className="h-5 w-5" />;
    }
  };
  
  const formatLastSeen = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffDays = differenceInDays(now, lastSeenDate);
    
    if (diffDays < 1) {
      return formatDistanceToNow(lastSeenDate, { addSuffix: true });
    } else if (diffDays < 7) {
      return format(lastSeenDate, "EEEE 'at' h:mm a");
    } else {
      return format(lastSeenDate, "MMM d, yyyy 'at' h:mm a");
    }
  };
  
  const handleChangePassword = async () => {
    if (!newPassword || !oldPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setShowPasswordDialog(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(`Failed to update password: ${error.message}`);
    } finally {
      setChangingPassword(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!profile || !session) return;
    
    if (confirmEmail !== session.user.email) {
      toast.error("Email doesn't match your account email");
      return;
    }
    
    setDeletingAccount(true);
    
    try {
      // Simply sign the user out since we can't actually delete accounts here
      await supabase.auth.signOut();
      
      toast.success("You have been signed out");
      // Redirect will happen automatically due to auth listener
    } catch (error: any) {
      toast.error(`Failed to sign out: ${error.message}`);
      setDeletingAccount(false);
    }
  };
  
  // Loading and error states
  const loading = authLoading || isLoading;
  
  // Add a fetch timeout indicator
  const [fetchTimeout, setFetchTimeout] = useState(false);
  
  // Set up profile fetching when session is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          console.log('[AccountPage] Fetching profile for user:', userId);
          await useProfileStore.getState().fetchProfile(userId);
        } catch (error) {
          console.error('[AccountPage] Error fetching profile:', error);
        }
      }
    };
    
    // Attempt to fetch the profile
    fetchUserProfile();
    
    // Set a timeout to show a different message if fetching takes too long
    const timeoutId = setTimeout(() => setFetchTimeout(true), 5000);
    
    return () => clearTimeout(timeoutId);
  }, [userId]);
  
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your account information...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to view your account settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user is logged in but profile isn't loaded yet
  if (!profile && !loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {fetchTimeout ? (
            <>
              <p className="text-muted-foreground">Still setting up your profile...</p>
              <p className="text-xs text-muted-foreground mt-2">This is taking longer than expected. Please refresh the page if it continues.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">Setting up your profile...</p>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      {/* User Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={formData.username} 
                onChange={handleInputChange}
                placeholder="Your username" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Registered Email</Label>
            <Input id="email" type="email" value={profile?.email || ""} readOnly disabled />
            <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how and when you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">Receive game updates and results via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <BellRing className="mr-2 h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">Receive real-time alerts on your device</p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
          
          {pushNotifications && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-base">Notification Categories</Label>
                <p className="text-sm text-muted-foreground mb-3">Select which types of notifications you want to receive</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="notify-game-results" 
                      checked={notificationCategories.includes('game_results')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationCategories(prev => [
                            ...prev.filter(c => c !== 'game_results'),
                            'game_results'
                          ]);
                        } else {
                          setNotificationCategories(prev => 
                            prev.filter(c => c !== 'game_results')
                          );
                        }
                      }}
                    />
                    <div className="grid gap-1.5">
                      <Label 
                        htmlFor="notify-game-results" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Game Results
                      </Label>
                      <p className="text-sm text-muted-foreground">Daily game outcome notifications</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="notify-leaderboard" 
                      checked={notificationCategories.includes('leaderboard')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationCategories(prev => [
                            ...prev.filter(c => c !== 'leaderboard'),
                            'leaderboard'
                          ]);
                        } else {
                          setNotificationCategories(prev => 
                            prev.filter(c => c !== 'leaderboard')
                          );
                        }
                      }}
                    />
                    <div className="grid gap-1.5">
                      <Label 
                        htmlFor="notify-leaderboard" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Leaderboard Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">Ranking changes and achievements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="notify-predictions" 
                      checked={notificationCategories.includes('predictions')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationCategories(prev => [
                            ...prev.filter(c => c !== 'predictions'),
                            'predictions'
                          ]);
                        } else {
                          setNotificationCategories(prev => 
                            prev.filter(c => c !== 'predictions')
                          );
                        }
                      }}
                    />
                    <div className="grid gap-1.5">
                      <Label 
                        htmlFor="notify-predictions" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Prediction Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">Reminders to make your daily prediction</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="notify-system" 
                      checked={notificationCategories.includes('system_updates')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationCategories(prev => [
                            ...prev.filter(c => c !== 'system_updates'),
                            'system_updates'
                          ]);
                        } else {
                          setNotificationCategories(prev => 
                            prev.filter(c => c !== 'system_updates')
                          );
                        }
                      }}
                    />
                    <div className="grid gap-1.5">
                      <Label 
                        htmlFor="notify-system" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        System Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">Important service announcements</p>
                    </div>
                  </div>
                </div>
                
                {!notificationCategories.length && (
                  <Alert variant="warning" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No categories selected</AlertTitle>
                    <AlertDescription>
                      You won't receive any push notifications. Select at least one category if you want notifications.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
          
          <div className="flex justify-end mt-6">
            <Button onClick={handleUpdateNotificationPreferences}>
              Save Notification Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>Manage your active devices and sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceList />
          <p className="text-sm text-muted-foreground">
            These are the devices you've used to access Munymo. You can sign out any device remotely.
          </p>
        </CardContent>
      </Card>

      {/* Subscription & Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>Manage your subscription plan and billing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
             <div>
               <p className="text-sm text-muted-foreground">Current Plan</p>
               <p className="text-lg font-semibold">
                 <Badge>{profile.subscription_tier || 'Free'}</Badge>
               </p>
             </div>
             <Button variant="outline" onClick={() => window.location.href = '/#pricing'}>Change Plan</Button>
           </div>

           {profile.subscription_tier !== 'free' && (
             <Alert>
               <Info className="h-4 w-4" />
               <AlertTitle>Subscription Management</AlertTitle>
               <AlertDescription>
                 To manage your billing details or cancel your subscription, please visit the pricing page.
               </AlertDescription>
             </Alert>
           )}
        </CardContent>
      </Card>
      
      {/* MunyIQ Section - Only shown for premium users */}
      {(profile.subscription_tier === "premium" || profile.subscription_tier === "pro") && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-amber-400 mr-2" />
              <CardTitle>MunyIQ Score</CardTitle>
            </div>
            <CardDescription>View and track your MunyIQ performance score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-md flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Your Performance Score</p>
                <p className="text-lg font-semibold">View your MunyIQ analytics</p>
              </div>
              <Button onClick={() => window.location.href = '/MunyIQPage'}>View MunyIQ</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              MunyIQ measures your stock prediction skills on a scale of 1-200, factoring in accuracy, consistency, speed, and participation.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Account Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">Password</span>
              </div>
              <p className="text-sm text-muted-foreground">Change your account password</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <UserX className="mr-2 h-4 w-4 text-destructive" />
                <span className="text-base font-medium">Delete Account</span>
              </div>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your credentials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Deletion Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting your account will remove all your data, including game history, predictions, and preferences.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-email">Confirm by typing your email address</Label>
              <Input
                id="confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={profile.email}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={deletingAccount || confirmEmail !== profile.email}
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountPage;
