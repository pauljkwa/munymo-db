import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BrowserInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  innerWidth: number;
  innerHeight: number;
  isMobile: boolean;
  browser: string;
  os: string;
}

/**
 * A component that detects browser information and logs it for debugging
 * Helps troubleshoot mobile browser issues
 */
export const BrowserDetector: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    // Detect the browser details
    const detectBrowser = () => {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      let os = 'Unknown';
      
      // Browser detection
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
      else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';
      
      // OS detection
      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac OS')) os = 'macOS';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
      else if (ua.includes('Linux')) os = 'Linux';
      
      // Mobile detection
      const isMobile = /Mobi|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      
      const info: BrowserInfo = {
        userAgent: ua,
        platform: navigator.platform,
        vendor: navigator.vendor,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        isMobile,
        browser,
        os
      };
      
      setBrowserInfo(info);
      console.log('[BrowserDetector] Browser information:', info);
      
      // Check if service workers are supported
      const serviceWorkerSupport = 'serviceWorker' in navigator;
      console.log('[BrowserDetector] Service Worker support:', serviceWorkerSupport);
      
      // Show toast with key info for debugging mobile access
      toast.info(
        `Browser detected: ${browser} on ${os}`, 
        {
          description: `Mobile: ${isMobile ? 'Yes' : 'No'} | SW Support: ${serviceWorkerSupport ? 'Yes' : 'No'} | Width: ${window.innerWidth}px`,
          duration: 5000
        }
      );
    };
    
    // Run detection on mount
    detectBrowser();
  }, []);

  // This component doesn't render anything visible
  return null;
};
