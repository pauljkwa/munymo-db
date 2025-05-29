import React, { useState } from "react";
import { Device } from "../utils/deviceStore";
import { format, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Laptop,
  Smartphone,
  Monitor,
  Clock,
  Tag,
  Phone,
  Bell,
  BellOff,
  Info,
  Globe,
  Calendar,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (deviceId: string, name: string) => Promise<void>;
  onSignOut: (deviceId: string) => Promise<void>;
  onUpdateNotificationPreferences: (
    deviceId: string,
    enabled: boolean,
    categories: string[]
  ) => Promise<void>;
  currentDeviceId: string | null;
}

// Helper function to format the last seen date
const formatLastSeen = (lastSeen: string) => {
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - lastSeenDate.getTime()) / 36e5;

  if (diffInHours < 24) {
    return formatDistanceToNow(lastSeenDate, { addSuffix: true });
  } else {
    return format(lastSeenDate, "PPP 'at' p");
  }
};

// Helper function to get a device icon based on device type
const getDeviceIcon = (device: Device) => {
  const deviceType = device.device_type || "unknown";
  
  switch (deviceType) {
    case "mobile":
      return <Smartphone className="h-5 w-5" />;
    case "tablet":
      return <Phone className="h-5 w-5" />;
    case "desktop":
      return <Laptop className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
};

export const DeviceDetailsDialog: React.FC<Props> = ({
  device,
  open,
  onOpenChange,
  onRename,
  onSignOut,
  onUpdateNotificationPreferences,
  currentDeviceId,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(device.name);
  
  // State for notification preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    device.notification_preferences?.enabled ?? true
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    device.notification_preferences?.categories ?? ["game_results", "leaderboard", "system_updates"]
  );

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error("Device name cannot be empty");
      return;
    }
    
    await onRename(device.id, newName.trim());
    setEditingName(false);
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    await onUpdateNotificationPreferences(
      device.id,
      notificationsEnabled,
      notificationsEnabled ? selectedCategories : []
    );
  };

  const isCurrentDevice = device.id === currentDeviceId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getDeviceIcon(device)}
            <DialogTitle>{device.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {isCurrentDevice && (
              <Badge variant="outline">Current Device</Badge>
            )}
            {!device.is_active && (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          <DialogDescription>
            Manage device settings and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Information Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Device Information</h3>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-md border bg-muted/20">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Browser</span>
              </div>
              <div className="text-sm">
                {device.browser || "Unknown"} {device.browser_version && `(${device.browser_version})`}
              </div>
              
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Operating System</span>
              </div>
              <div className="text-sm">
                {device.os || "Unknown"} {device.os_version && `(${device.os_version})`}
              </div>
              
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Device Type</span>
              </div>
              <div className="text-sm capitalize">
                {device.device_type || "Unknown"}
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Registered On</span>
              </div>
              <div className="text-sm">
                {format(new Date(device.created_at), "PPP")}
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Active</span>
              </div>
              <div className="text-sm">
                {formatLastSeen(device.last_seen)}
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Device Name Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Device Name</h3>
            {editingName ? (
              <div className="flex gap-2">
                <Input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter device name"
                  className="flex-1"
                />
                <Button onClick={handleSaveName}>Save</Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setNewName(device.name);
                    setEditingName(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{device.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingName(true)}>
                  Rename
                </Button>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Notification Preferences Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            
            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
              <div className="flex items-center gap-2">
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationsEnabled(checked === true);
                  }}
                />
                <Label htmlFor="notifications-enabled">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>
            
            {notificationsEnabled && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select categories of notifications you want to receive on this device:</p>
                
                <div className="space-y-2 p-3 rounded-md border bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-game-results" 
                      checked={selectedCategories.includes("game_results")}
                      onCheckedChange={() => handleCategoryToggle("game_results")}
                    />
                    <div className="grid gap-1.5">
                      <Label htmlFor="notify-game-results" className="text-sm font-medium">Game Results</Label>
                      <p className="text-xs text-muted-foreground">Daily prediction results and performance updates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-leaderboard" 
                      checked={selectedCategories.includes("leaderboard")}
                      onCheckedChange={() => handleCategoryToggle("leaderboard")}
                    />
                    <div className="grid gap-1.5">
                      <Label htmlFor="notify-leaderboard" className="text-sm font-medium">Leaderboard Updates</Label>
                      <p className="text-xs text-muted-foreground">Ranking changes and achievements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-predictions" 
                      checked={selectedCategories.includes("predictions")}
                      onCheckedChange={() => handleCategoryToggle("predictions")}
                    />
                    <div className="grid gap-1.5">
                      <Label htmlFor="notify-predictions" className="text-sm font-medium">Prediction Reminders</Label>
                      <p className="text-xs text-muted-foreground">Reminders to make your daily prediction</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-system" 
                      checked={selectedCategories.includes("system_updates")}
                      onCheckedChange={() => handleCategoryToggle("system_updates")}
                    />
                    <div className="grid gap-1.5">
                      <Label htmlFor="notify-system" className="text-sm font-medium">System Updates</Label>
                      <p className="text-xs text-muted-foreground">Important service announcements</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleSaveNotificationPreferences}
                >
                  Save Notification Preferences
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          {device.is_active && (
            <Button 
              variant="destructive" 
              onClick={() => onSignOut(device.id)}
              className="mr-auto"
            >
              Sign Out Device
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;
