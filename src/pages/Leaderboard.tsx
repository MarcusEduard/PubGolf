import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trophy, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamScore {
  teamId: string;
  teamName: string;
  totalScore: number;
  playerCount: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLeaderboard();
      
      // Set up real-time subscription for score updates
      const scoresSubscription = supabase
        .channel('leaderboard-scores')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'scores' },
          () => {
            loadLeaderboard();
          }
        )
        .subscribe();

      return () => {
        scoresSubscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  const loadLeaderboard = async () => {
    try {
      setRefreshing(true);
      
      // Get all teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name");

      if (teamsError) throw teamsError;

      // Get all players with their scores
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          id,
          team_id,
          scores (
            score
          )
        `);

      if (playersError) throw playersError;

      // Get all penalties
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select("team_id, points");

      if (penaltiesError) throw penaltiesError;

      // Calculate total scores per team
      const teamScores: TeamScore[] = teamsData.map(team => {
        const teamPlayers = playersData.filter(p => p.team_id === team.id);
        const scoreTotal = teamPlayers.reduce((sum, player) => {
          const playerScore = player.scores?.reduce((pSum: number, s: any) => pSum + s.score, 0) || 0;
          return sum + playerScore;
        }, 0);

        // Add penalties
        const penaltyTotal = penaltiesData
          .filter(p => p.team_id === team.id)
          .reduce((sum, p) => sum + p.points, 0);

        return {
          teamId: team.id,
          teamName: team.name,
          totalScore: scoreTotal + penaltyTotal,
          playerCount: teamPlayers.length
        };
      });

      // Sort by total score (ascending - lower is better in golf)
      teamScores.sort((a, b) => a.totalScore - b.totalScore);

      setTeams(teamScores);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    return () => {
      const scoresSubscription = supabase.channel('leaderboard-scores');
      if (scoresSubscription) {
        scoresSubscription.unsubscribe();
      }
    };
  }, []);

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Indlæser...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbage
          </Button>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Du har ikke adgang til resultattavlen. Kun administratorer kan se denne side.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-1 md:gap-2 text-sm md:text-base"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbage
          </Button>
          
          <Button
            variant="outline"
            onClick={() => loadLeaderboard()}
            disabled={refreshing}
            className="gap-1 md:gap-2 text-sm md:text-base"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Opdater</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center pb-4 md:pb-6">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              <CardTitle className="text-2xl md:text-3xl">Resultattavle</CardTitle>
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            </div>
            <CardDescription className="text-sm md:text-base">
              Live oversigt over alle hold - laveste score vinder!
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {teams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm md:text-base">
                Ingen hold har startet endnu
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {teams.map((team, index) => (
                  <div
                    key={team.teamId}
                    className={`flex items-center justify-between p-3 md:p-4 rounded-lg border transition-all ${
                      index === 0
                        ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700"
                        : index === 1
                        ? "bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700"
                        : index === 2
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="text-xl md:text-2xl font-bold w-8 md:w-12 text-center flex-shrink-0">
                        {index < 3 ? getMedalEmoji(index) : `${index + 1}.`}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base md:text-lg">{team.teamName}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {team.playerCount} spiller{team.playerCount !== 1 ? 'e' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-bold">
                        {team.totalScore}
                      </div>
                      <p className="text-xs text-muted-foreground">point</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-muted-foreground">
          <p>Opdateres automatisk når hold indtaster scores 🔄</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
