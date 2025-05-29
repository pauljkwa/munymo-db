import React, { ReactNode, useEffect, useRef } from "react"; // Added useRef

import { useProfileStore } from "utils/profileStore";
import { useDeviceStore } from "utils/deviceStore";
import { useAuthStore } from "utils/authStore";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { Header } from "components/Header"; // MYA-18: Import Header
import { Footer } from "components/Footer"; // MYA-18: Import Footer
import brain from "brain"; // Import brain for sending token
import { FcmTokenRequest } from "types"; // Import types
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseConfig } from "utils/firebaseConfig"; // Centralized config
import { toast } from "sonner"; // Import sonner toast
import { BrowserDetector } from "components/BrowserDetector"; // Import BrowserDetector for debugging

interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 */
export const AppProvider = ({ children }: Props) => {
  const authListenerInitialized = useRef(false); // Ref to track auth listener init
  const fcmInitializationAttempted = useRef(false); // Ref to prevent multiple FCM inits

  useEffect(() => {
    // Ensure listener is initialized only once
    if (authListenerInitialized.current) {
        console.log("[Auth] Listener already initialized, skipping.");
        return;
    }
    authListenerInitialized.current = true;

    console.log("[Auth] Initializing Supabase auth listener...");
    const unsubscribe = useAuthStore.getState().initializeAuthListener();

    // Cleanup listener on component unmount
    return () => {
      console.log("[Auth] Cleaning up Supabase auth listener.");
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount


  // --- Device Tracking Effect ---
  useEffect(() => {
    console.log("[Device] Setting up device tracking...");
    
    // Check initial state: If user is already logged in on load, initialize device tracking
    const checkInitialAuth = () => {
      const initialSession = useAuthStore.getState().session;
      if (initialSession?.user?.id) {
        console.log("[Device] User already logged in on load, initializing device tracking...");
        useDeviceStore.getState().initializeDeviceTracking();
        
        // Also make sure profile is loaded
        useProfileStore.getState().fetchProfile(initialSession.user.id);
      }
    };
    
    // Run the check shortly after mount, allows auth store to potentially populate
    const timeoutId = setTimeout(checkInitialAuth, 150);
    
    // Subscribe to auth state changes for device tracking
    const unsubscribeAuth = useAuthStore.subscribe(
      (state) => state.session,
      (session) => {
        if (session?.user?.id) {
          // User logged in, initialize device tracking
          console.log("[Device] User logged in, initializing device tracking...");
          useDeviceStore.getState().initializeDeviceTracking();
          
          // Also make sure profile is loaded
          useProfileStore.getState().fetchProfile(session.user.id);
        }
      }
    );
    
    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
    };
  }, []);
  
  // --- FCM Initialization Effect ---
  useEffect(() => {
    console.log("[DEBUG] FCM useEffect hook running.");

    const initializeFcm = async () => {
      // Prevent multiple initializations
      if (fcmInitializationAttempted.current) {
          console.log("[FCM] Initialization already attempted, skipping.");
          return;
      }
      fcmInitializationAttempted.current = true;

      console.log("[FCM] Initializing Firebase app and Messaging...");
      try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        console.log("[FCM] Firebase Messaging initialized.");

        // --- Register Service Worker ---
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
          try {
            // Don't attempt to register a service worker in development or on mobile
            // This prevents the "No access for you" error on mobile devices
            const ua = navigator.userAgent;
            const isMobile = /Mobi|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            
            console.log(`[FCM] Service worker check - Mobile: ${isMobile ? 'Yes' : 'No'}, Browser: ${ua}`);
            console.log('[FCM] Skipping service worker registration - Not needed in dev environment');
            
            // We'll continue without service worker registration
          } catch (error) {
            console.error('[FCM] Service worker registration failed:', error);
            // Don't block the entire FCM initialization if service worker fails
            console.warn('[FCM] Continuing without service worker support');
          }
        } else {
          console.warn("[FCM] Service workers are not supported in this browser.");
          const noSwSupportMsg = "Push notifications require Service Worker support.";
          console.warn(`[FCM Toast Warning] ${noSwSupportMsg}`);
          toast.warning(noSwSupportMsg);
          // Continue without service worker support
        }

        // --- Request Permission & Get Token ---
        console.log("[FCM] Requesting notification permission...");
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("[FCM] Notification permission granted.");
            // Get token
            const currentToken = await getToken(messaging, {
              // Ensure VAPID key matches the one in firebaseConfig and service worker
              vapidKey: firebaseConfig.vapidKey,
            });

            if (currentToken) {
              console.log("[FCM] Got FCM token:", currentToken);
              // Send token to backend
              try {
                const requestBody: FcmTokenRequest = { token: currentToken };
                await brain.register_device_fcm_token(requestBody);
                console.log("[FCM] Token sent to backend and stored in devices table successfully.");
              } catch (error) {
                console.error("[FCM] Error sending token to backend:", error);
                 const sendTokenErrorMsg = "Failed to register for push notifications.";
                 console.error(`[FCM Toast Error] ${sendTokenErrorMsg}`, String(error)); // Log toast message
                 toast.error(sendTokenErrorMsg, { description: String(error) });
              }
            } else {
              // Show permission request UI
              console.log("[FCM] No registration token available. Request permission to generate one.");
              // This state usually means permission was denied previously or cookies/site data were cleared.
              const requestPermMsg = "Please grant notification permission to receive updates.";
              console.info(`[FCM Toast Info] ${requestPermMsg}`); // Log toast message
              toast.info(requestPermMsg);
            }
          } else {
            console.log("[FCM] Unable to get permission to notify.");
             const permDeniedMsg = "Notification permission denied. You won't receive push updates.";
             console.warn(`[FCM Toast Warning] ${permDeniedMsg}`); // Log toast message
             toast.warning(permDeniedMsg);
          }
        } catch (err) {
          console.error("[FCM] An error occurred while requesting permission or getting token:", err);
           const permTokenErrorMsg = "Error setting up notifications.";
           console.error(`[FCM Toast Error] ${permTokenErrorMsg}`, String(err)); // Log toast message
           toast.error(permTokenErrorMsg, { description: String(err) });
        }

        // --- Handle Foreground Messages ---
        onMessage(messaging, (payload) => {
          console.log("[FCM] Message received in foreground: ", payload);
          
          // Track notification delivery
          const notificationId = payload.data?.notification_id;
          const category = payload.data?.category;
          
          if (notificationId) {
            // Track that the notification was delivered
            try {
              brain.track_notification_event({
                event_type: "delivered",
                notification_id: notificationId,
                category: category || ""
              }).then(() => {
                console.log("[FCM] Tracked notification delivery");
              }).catch(err => {
                console.error("[FCM] Failed to track notification delivery:", err);
              });
            } catch (error) {
              console.error("[FCM] Error tracking notification delivery:", error);
            }
          }
          
          // Use sonner for a nicer UI than a native notification when app is open
          toast(payload.notification?.title || "New Message", {
            description: payload.notification?.body,
            // Add action buttons or links based on payload.data if needed
            action: payload.data?.click_action ? {
                label: "View",
                onClick: () => {
                  // Track notification click
                  if (notificationId) {
                    try {
                      brain.track_notification_event({
                        event_type: "clicked",
                        notification_id: notificationId,
                        category: category || ""
                      }).catch(err => {
                        console.error("[FCM] Failed to track notification click:", err);
                      });
                    } catch (error) {
                      console.error("[FCM] Error tracking notification click:", error);
                    }
                  }
                  
                  window.location.href = payload.data.click_action; // Simple redirect
                }
            } : undefined,
            onDismiss: () => {
              // Track notification dismissed
              if (notificationId) {
                try {
                  brain.track_notification_event({
                    event_type: "dismissed",
                    notification_id: notificationId,
                    category: category || ""
                  }).catch(err => {
                    console.error("[FCM] Failed to track notification dismissal:", err);
                  });
                } catch (error) {
                  console.error("[FCM] Error tracking notification dismissal:", error);
                }
              }
            }
          });
        });

      } catch (error) {
        console.error("[FCM] Error initializing Firebase Messaging:", error);
         const initErrorMsg = "Failed to initialize push notifications.";
         console.error(`[FCM Toast Error] ${initErrorMsg}`, String(error)); // Log toast message
         toast.error(initErrorMsg, { description: String(error) });
      }
    };

    // Subscribe to auth state changes
    console.log("[FCM] Setting up auth subscription for FCM trigger...");
    const unsubscribeAuth = useAuthStore.subscribe(
      (state) => state.session,
      (session /*, previousSession */) => { // Simplified condition
        console.log("[FCM] Auth state changed in subscription. Session:", session ? 'exists' : 'null');
        // Run FCM init if user is logged in and init hasn't been attempted
        if (session && !fcmInitializationAttempted.current) {
          console.log("[FCM] User logged in (detected via subscription), initializing FCM...");
          initializeFcm();
        }
      }
    );
    
    // Check initial state: If user is already logged in on load, run init
    // Need a slight delay to ensure authStore had a chance to initialize
    console.log("[FCM] Checking initial auth state for FCM trigger...");
    const checkInitialAuth = () => {
        const initialSession = useAuthStore.getState().session;
        console.log("[FCM] Initial auth state check result:", initialSession ? 'exists' : 'null');
        if (initialSession && !fcmInitializationAttempted.current) {
            console.log("[FCM] User already logged in on load, initializing FCM...");
            initializeFcm();
        }
    }
    // Run the check shortly after mount, allows auth store to potentially populate
    const timeoutId = setTimeout(checkInitialAuth, 100); 

    // Cleanup subscription and timeout on component unmount

    return () => {
        console.log("[FCM] Cleaning up auth subscription and timeout for FCM.");
        clearTimeout(timeoutId); // Clear timeout on cleanup
        unsubscribeAuth();
    };

  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="min-h-screen flex flex-col bg-background text-foreground"> {/* MYA-18: Added wrapper div */}
          <Header /> {/* MYA-18: Added Header */}
          <main className="flex-grow container mx-auto px-4 py-8 pt-24"> {/* MYA-18: Added pt-24 to account for fixed header */}
            {children}
          </main>
          <Footer /> {/* MYA-18: Added Footer */}
          <Toaster />
          <BrowserDetector /> {/* Added browser detector for debugging mobile access */}
        </div>
      </ThemeProvider>
    </React.StrictMode>
  );
};