import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

// Define the device interface
export interface Device {
  id: string;
  user_id: string;
  name: string; // e.g. "Chrome on Windows", "Safari on iPhone"
  device_id: string; // Unique identifier for this device
  fcm_token?: string | null; // FCM token for push notifications
  last_seen: string; // ISO timestamp
  is_active: boolean;
  created_at: string; // ISO timestamp
  // New fields for enhanced device management
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  notification_preferences?: {
    enabled: boolean;
    categories: string[];
  };
}

// Device type information
export interface DeviceTypeInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

interface DeviceState {
  devices: Device[];
  currentDeviceId: string | null;
  isLoading: boolean;
  error: Error | null;
  
  // Initialize device tracking
  initializeDeviceTracking: () => Promise<void>;
  
  // Fetch devices for current user
  fetchDevices: () => Promise<Device[]>;
  
  // Register current device
  registerDevice: (fcmToken?: string) => Promise<Device | null>;
  
  // Update device name
  updateDeviceName: (deviceId: string, name: string) => Promise<Device | null>;
  
  // Sign out device (remote or current)
  signOutDevice: (deviceId: string) => Promise<boolean>;
  
  // Get a device name based on user agent
  generateDeviceName: () => string;
  
  // Get detailed device type info
  getDeviceTypeInfo: () => DeviceTypeInfo;
  
  // Update device notification preferences
  updateDeviceNotificationPreferences: (
    deviceId: string, 
    enabled: boolean, 
    categories?: string[]
  ) => Promise<Device | null>;
}

// Generate a unique device ID that persists across sessions
const getDeviceId = (): string => {
  // Check if we already have a device ID in localStorage
  let deviceId = localStorage.getItem('munymo_device_id');
  
  if (!deviceId) {
    // Generate a new device ID using a timestamp and random number
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('munymo_device_id', deviceId);
  }
  
  return deviceId;
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  currentDeviceId: null,
  isLoading: false,
  error: null,
  
  initializeDeviceTracking: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    const deviceId = getDeviceId();
    
    if (!userId) {
      console.log('[DeviceStore] No user logged in, skipping device tracking');
      return;
    }
    
    set({ currentDeviceId: deviceId });
    
    // Register this device and fetch all devices
    try {
      await get().registerDevice();
      await get().fetchDevices();
    } catch (error) {
      console.error('[DeviceStore] Error initializing device tracking:', error);
    }
  },
  
  fetchDevices: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = useAuthStore.getState().session?.user.id;
      if (!userId) {
        throw new Error('No user logged in');
      }
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });
      
      if (error) throw error;
      
      const devices = data as Device[];
      set({ devices, isLoading: false });
      return devices;
    } catch (error: any) {
      console.error('[DeviceStore] Error fetching devices:', error.message);
      set({ error: error as Error, isLoading: false });
      return [];
    }
  },
  
  registerDevice: async (fcmToken?: string) => {
    try {
      const userId = useAuthStore.getState().session?.user.id;
      if (!userId) {
        throw new Error('No user logged in');
      }
      
      const deviceId = getDeviceId();
      const deviceInfo = get().getDeviceTypeInfo();
      const deviceName = get().generateDeviceName();
      
      // First check if this device is already registered
      const { data: existingDevice, error: checkError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // Not found is ok
        throw checkError;
      }
      
      // If device exists, just update the last_seen timestamp and fcm_token if provided
      if (existingDevice) {
        const updateData: any = { 
          last_seen: new Date().toISOString(),
          is_active: true,
          // Update device info in case it changed
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          os: deviceInfo.os,
          os_version: deviceInfo.osVersion,
          device_type: deviceInfo.deviceType
        };
        
        // Only update FCM token if provided
        if (fcmToken) {
          updateData.fcm_token = fcmToken;
        }
        
        const { data, error } = await supabase
          .from('devices')
          .update(updateData)
          .eq('id', existingDevice.id)
          .select()
          .single();
        
        if (error) throw error;
        set({ currentDeviceId: deviceId });
        return data as Device;
      }
      
      // Otherwise, insert a new device
      const { data, error } = await supabase
        .from('devices')
        .insert({
          user_id: userId,
          device_id: deviceId,
          name: deviceName,
          fcm_token: fcmToken || null,
          last_seen: new Date().toISOString(),
          is_active: true,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          os: deviceInfo.os,
          os_version: deviceInfo.osVersion,
          device_type: deviceInfo.deviceType,
          notification_preferences: {
            enabled: true,
            categories: ['game_results', 'leaderboard', 'system_updates']
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[DeviceStore] Registered new device:', data);
      set({ currentDeviceId: deviceId });
      return data as Device;
    } catch (error: any) {
      console.error('[DeviceStore] Error registering device:', error.message);
      return null;
    }
  },
  
  updateDeviceName: async (deviceId: string, name: string) => {
    try {
      const userId = useAuthStore.getState().session?.user.id;
      if (!userId) {
        throw new Error('No user logged in');
      }
      
      const { data, error } = await supabase
        .from('devices')
        .update({ name })
        .eq('id', deviceId)
        .eq('user_id', userId) // Security check
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the devices list with the new name
      const updatedDevices = get().devices.map(device => 
        device.id === deviceId ? { ...device, name } : device
      );
      
      set({ devices: updatedDevices });
      toast.success('Device name updated');
      return data as Device;
    } catch (error: any) {
      console.error('[DeviceStore] Error updating device name:', error.message);
      toast.error(`Failed to update device name: ${error.message}`);
      return null;
    }
  },
  
  signOutDevice: async (deviceId: string) => {
    try {
      const userId = useAuthStore.getState().session?.user.id;
      if (!userId) {
        throw new Error('No user logged in');
      }
      
      // Mark device as inactive
      const { error } = await supabase
        .from('devices')
        .update({ is_active: false })
        .eq('id', deviceId)
        .eq('user_id', userId); // Security check
      
      if (error) throw error;
      
      // If this is the current device, sign out
      if (deviceId === get().currentDeviceId) {
        await supabase.auth.signOut();
        return true;
      }
      
      // Update local state
      const updatedDevices = get().devices.map(device => 
        device.id === deviceId ? { ...device, is_active: false } : device
      );
      
      set({ devices: updatedDevices });
      toast.success('Device signed out successfully');
      return true;
    } catch (error: any) {
      console.error('[DeviceStore] Error signing out device:', error.message);
      toast.error(`Failed to sign out device: ${error.message}`);
      return false;
    }
  },
  
  generateDeviceName: () => {
    // Get browser and OS information from user agent
    const ua = navigator.userAgent;
    const deviceInfo = get().getDeviceTypeInfo();
    
    // Create a user-friendly device name
    return `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.deviceType})`;
  },
  
  getDeviceTypeInfo: () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let browserVersion = '';
    let os = 'Unknown OS';
    let osVersion = '';
    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
    
    // Browser detection (more comprehensive)
    if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    } 
    else if (ua.includes('Edge') || ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edge\/(\d+\.\d+)/) || ua.match(/Edg\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    } 
    else if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    } 
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    } 
    else if (ua.includes('OPR') || ua.includes('Opera')) {
      browser = 'Opera';
      const match = ua.match(/OPR\/(\d+\.\d+)/) || ua.match(/Opera\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    } 
    else if (ua.includes('MSIE') || ua.includes('Trident/')) {
      browser = 'Internet Explorer';
      const match = ua.match(/MSIE (\d+\.\d+)/) || ua.match(/rv:(\d+\.\d+)/);
      browserVersion = match ? match[1] : '';
    }
    
    // OS detection (more comprehensive)
    if (ua.includes('Windows')) {
      os = 'Windows';
      if (ua.includes('Windows NT 10.0')) osVersion = '10';
      else if (ua.includes('Windows NT 6.3')) osVersion = '8.1';
      else if (ua.includes('Windows NT 6.2')) osVersion = '8';
      else if (ua.includes('Windows NT 6.1')) osVersion = '7';
      else if (ua.includes('Windows NT 6.0')) osVersion = 'Vista';
      else osVersion = '';
    } 
    else if (ua.includes('Mac OS')) {
      os = 'macOS';
      const match = ua.match(/Mac OS X (\d+[\_|\.]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    } 
    else if (ua.includes('Android')) {
      os = 'Android';
      const match = ua.match(/Android (\d+\.\d+)/);
      osVersion = match ? match[1] : '';
    } 
    else if (ua.includes('iOS')) {
      os = 'iOS';
      const match = ua.match(/OS (\d+\_\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    } 
    else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
      os = 'iOS';
      const match = ua.match(/OS (\d+\_\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    } 
    else if (ua.includes('Linux')) {
      os = 'Linux';
    }
    
    // Device type detection
    if (/Mobi|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = 'mobile';
    } 
    else if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobi)/i.test(ua)) {
      deviceType = 'tablet';
    } 
    else {
      deviceType = 'desktop';
    }
    
    return {
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType
    };
  },
  
  updateDeviceNotificationPreferences: async (deviceId: string, enabled: boolean, categories?: string[]) => {
    try {
      const userId = useAuthStore.getState().session?.user.id;
      if (!userId) {
        throw new Error('No user logged in');
      }
      
      // Ensure we have valid notification categories
      let categoriesToSave = categories || [];
      
      // If enabled is true but no categories, add default ones
      if (enabled && categoriesToSave.length === 0) {
        categoriesToSave = ['game_results', 'leaderboard', 'system_updates'];
      }
      
      const notificationPreferences = {
        enabled,
        categories: categoriesToSave
      };
      
      // Update the device preferences
      const { data, error } = await supabase
        .from('devices')
        .update({ notification_preferences: notificationPreferences })
        .eq('id', deviceId)
        .eq('user_id', userId) // Security check
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the devices list with the new preferences
      const updatedDevices = get().devices.map(device => 
        device.id === deviceId ? { ...device, notification_preferences: notificationPreferences } : device
      );
      
      set({ devices: updatedDevices });
      toast.success('Device notification preferences updated');
      return data as Device;
    } catch (error: any) {
      console.error('[DeviceStore] Error updating device notification preferences:', error.message);
      toast.error(`Failed to update device notification preferences: ${error.message}`);
      return null;
    }
  }
}));