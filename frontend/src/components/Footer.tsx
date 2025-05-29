import React from "react";
import { LogoMain } from 'components/LogoMain'; // Import LogoMain
import { APP_BASE_PATH } from "app"; // Keep this if used elsewhere, or remove if only for the old links
import { Link } from "react-router-dom"; // Import Link
import { Shield } from "lucide-react";
import { useProfileStore } from "utils/profileStore";

export function Footer() {
  const { profile } = useProfileStore();
  const isAdmin = profile?.is_admin === true;
  
  return (
    <footer className="py-8 border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        © {new Date().getFullYear()} 
        <LogoMain height={64} className="inline-block align-middle mx-1" /> {/* Use LogoMain component */}
        . All rights reserved. | 
        <Link to="/privacy-policy-page" className="hover:text-foreground"> Privacy Policy</Link> | 
        <Link to="/terms-of-service-page" className="hover:text-foreground"> Terms of Service</Link>
        {isAdmin && (
          <> | <Link to="/admin-dashboard" className="hover:text-foreground flex items-center gap-1 inline-flex">
            <Shield className="h-4 w-4" />
            Admin
          </Link></>
        )}
      </div>
    </footer>
  );
}
