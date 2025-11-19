import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScoreCard } from "@/components/ScoreCard";
import { RulesCard } from "@/components/RulesCard";
import { TeamSetup } from "@/components/TeamSetup";
import { Button } from "@/components/ui/button";
import { Flag, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsAdmin(session.user.user_metadata?.role === 'admin');
        loadTeam(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAdmin(session.user.user_metadata?.role === 'admin');
          loadTeam(session.user.id);
        } else {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadTeam = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTeamId(data.id);
        setTeamName(data.name);
      }
    } catch (error) {
      console.error("Error loading team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // Admin view - only leaderboard and rules
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Decorative Elements */}
        <div className="fixed top-8 right-8 text-destructive opacity-30 pointer-events-none hidden md:block">
          <Flag className="w-32 h-32" strokeWidth={2} />
        </div>
        
        <div className="fixed bottom-8 left-8 text-accent opacity-20 pointer-events-none hidden md:block">
          <svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="50" cy="85" rx="40" ry="10" fill="currentColor" opacity="0.3" />
            <path
              d="M50 20 L50 80"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="50" cy="15" r="8" fill="currentColor" />
          </svg>
        </div>

        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Dommerpanel</h1>
            <Button variant="outline" onClick={handleLogout} size="sm">
              Log ud
            </Button>
          </div>

          <div className="grid gap-4 md:gap-8">
            <div className="space-y-4">
              <Button
                variant="default"
                onClick={() => navigate("/leaderboard")}
                className="w-full gap-2 h-24 md:h-32 text-lg md:text-xl"
                size="lg"
              >
                <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                Se Resultattavle
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/admin/penalties")}
                className="w-full gap-2 h-24 md:h-32 text-lg md:text-xl"
                size="lg"
              >
                Tildel point
              </Button>
            </div>

            <div>
              <RulesCard />
            </div>
          </div>
        </div>

        {/* Bottom Wave Decoration */}
        <div className="fixed bottom-0 left-0 w-full pointer-events-none opacity-10">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Regular user view
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative Elements */}
      <div className="fixed top-8 right-8 text-destructive opacity-30 pointer-events-none hidden md:block">
        <Flag className="w-32 h-32" strokeWidth={2} />
      </div>
      
      <div className="fixed bottom-8 left-8 text-accent opacity-20 pointer-events-none hidden md:block">
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="85" rx="40" ry="10" fill="currentColor" opacity="0.3" />
          <path
            d="M50 20 L50 80"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="50" cy="15" r="8" fill="currentColor" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {!teamId ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <TeamSetup onTeamCreated={() => loadTeam(user!.id)} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Scorecard - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <ScoreCard 
                teamId={teamId} 
                teamName={teamName}
                onLogout={handleLogout}
              />
            </div>

            {/* Rules Card - Takes up 1 column */}
            <div className="lg:sticky lg:top-8">
              <RulesCard />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Wave Decoration */}
      <div className="fixed bottom-0 left-0 w-full pointer-events-none opacity-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>
    </div>
  );
};

export default Index;
