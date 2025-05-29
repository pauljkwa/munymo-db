import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDeviceStore } from "../utils/deviceStore";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone, Laptop, Monitor, Clock, PenLine, XCircle, ExternalLink } from "lucide-react";
import DeviceDetailsDialog from "./DeviceDetailsDialog";

interface Props {}

export const DeviceList: React.FC<Props> = () => {
  const { 
    devices, 
    isLoading: devicesLoading, 
    fetchDevices, 
    currentDeviceId,
    updateDeviceName,
    signOutDevice,
    updateDeviceNotificationPreferences
  } = useDeviceStore();
  
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);
  
  const handleRenameDevice = async (deviceId: string) => {
    if (!newDeviceName.trim()) {
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
  
  const handleUpdateNotificationPreferences = async (
    deviceId: string,
    enabled: boolean,
    categories: string[]
  ) => {
    await updateDeviceNotificationPreferences(deviceId, enabled, categories);
  };
  
  // Helper function to get a device icon based on name
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
  
  // Helper function to format the last seen date
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
  
  const openDeviceDetails = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };
  
  const getSelectedDevice = () => {
    if (!selectedDevice) return null;
    return devices.find(d => d.id === selectedDevice) || null;
  };

  return (
    <>
      {devicesLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : devices.length > 0 ? (
        <ul className="space-y-3 mb-4">
          {devices.map((device) => (
            <li key={device.id} className={`p-3 rounded-md border ${device.is_active ? 'bg-muted/40' : 'bg-muted/20 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.name)}
                  {editingDeviceId === device.id ? (
                    <div className="flex gap-2">
                      <Input 
                        value={newDeviceName} 
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        placeholder="Device name"
                        className="h-8 w-48"
                      />
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleRenameDevice(device.id)}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditingDeviceId(null);
                          setNewDeviceName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium flex items-center gap-2">
                      {device.name}
                      {device.id === currentDeviceId && (
                        <Badge variant="outline" className="ml-2">Current</Badge>
                      )}
                      {!device.is_active && (
                        <Badge variant="secondary" className="ml-2">Inactive</Badge>
                      )}
                    </span>
                  )}
                </div>
                {editingDeviceId !== device.id && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeviceDetails(device.id)}
                      title="View device details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingDeviceId(device.id);
                        setNewDeviceName(device.name);
                      }}
                      title="Rename device"
                    >
                      <PenLine className="h-4 w-4" />
                    </Button>
                    {device.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSignOutDevice(device.id)}
                        title="Sign out device"
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last active {formatLastSeen(device.last_seen)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mb-4">No devices found. This is unusual - try refreshing the page.</p>
      )}
      
      {/* Device Details Dialog */}
      {selectedDevice && getSelectedDevice() && (
        <DeviceDetailsDialog
          device={getSelectedDevice()!}
          open={!!selectedDevice}
          onOpenChange={(open) => {
            if (!open) setSelectedDevice(null);
          }}
          onRename={async (deviceId, name) => {
            await updateDeviceName(deviceId, name);
          }}
          onSignOut={async (deviceId) => {
            await handleSignOutDevice(deviceId);
            setSelectedDevice(null);
          }}
          onUpdateNotificationPreferences={handleUpdateNotificationPreferences}
          currentDeviceId={currentDeviceId}
        />
      )}
    </>
  );
};

export default DeviceList;
