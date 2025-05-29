import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useProfileStore } from "utils/profileStore";
import { useAuthStore } from "utils/authStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon, User, Shield, BarChart, Trophy } from "lucide-react"; // Import Trophy icon
import { useTheme } from "@/hooks/use-theme"; // Import useTheme hook
import { LogoMain } from 'components/LogoMain'; // Import LogoMain

// Removed Props interface as onGetStartedClick is no longer needed

export const Header = () => { // Removed prop
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { session, signOut, loading } = useAuthStore((state) => ({
    session: state.session,
    signOut: state.signOut,
    loading: state.loading,
  }));
  const { profile } = useProfileStore();
  const isAdmin = profile?.is_admin === true;
  const { theme, setTheme } = useTheme(); // Get theme state and setter

  const handleGetStartedClick = () => {
    // Check if we're already on the home page
    if (location.pathname === "/") {
      // If on home page, just scroll to pricing section
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    } else {
      // If on another page, navigate to home with #pricing
      navigate("/#pricing");
    }
  };

  const handleLoginClick = () => {
    navigate("/LoginPage");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/LoginPage"); // Redirect to login after logout
    } catch (error) { 
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.")
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center cursor-pointer">
          {/* Replace placeholder and text with the actual logo */}
          <LogoMain height={64} className="mr-2" /> {/* Use LogoMain component */}
        </Link>
        <nav className="hidden md:flex items-center gap-6">

          <Link to="/HowItWorksPage" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link to="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          {/* <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Leaderboard
          </Link> */}
          {/* Show Game link only if logged in */}
          {session && (
            <>
              <Link to="/PredictionGamePage" className="text-muted-foreground hover:text-foreground transition-colors">
                Game
              </Link>
              {/* MunyIQ link moved to AccountPage */}
              {/* Admin link moved to Footer */}
            </>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {loading ? (
            <Button variant="outline" disabled>
              Loading...
            </Button>
          ) : session ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/AccountPage" aria-label="Account Settings">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="hidden md:flex" onClick={handleLoginClick}>Log In</Button>
              <Button onClick={handleGetStartedClick}>Get Started</Button>
            </>
          )}
          {/* Theme Toggle */}
          <div className="flex items-center space-x-2 ml-4">
            <Sun className={`h-5 w-5 transition-all ${theme === 'light' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Toggle theme between light and dark mode"
            />
            <Moon className={`h-5 w-5 transition-all ${theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </div>
    </header>
  );
};
