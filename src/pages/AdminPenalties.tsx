import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Team {
  id: string;
  name: string;
}

interface Penalty {
  id: string;
  team_id: string;
  points: number;
  reason: string;
  created_at: string;
  teams: {
    name: string;
  };
}

export default function AdminPenalties() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [points, setPoints] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [pointType, setPointType] = useState<"penalty" | "bonus">("penalty");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
        await Promise.all([loadTeams(), loadPenalties()]);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Fejl",
        description: "Kunne ikke hente hold",
        variant: "destructive",
      });
      return;
    }

    setTeams(data || []);
  };

  const loadPenalties = async () => {
    const { data, error } = await supabase
      .from("penalties")
      .select(`
        id,
        team_id,
        points,
        reason,
        created_at,
        teams (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading penalties:", error);
      return;
    }

    setPenalties(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeam || !points || !reason.trim()) {
      toast({
        title: "Fejl",
        description: "Udfyld alle felter",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If bonus, make points negative
      const pointsValue = pointType === "bonus" ? -Math.abs(parseInt(points)) : Math.abs(parseInt(points));
      
      const { error } = await supabase
        .from("penalties")
        .insert({
          team_id: selectedTeam,
          points: pointsValue,
          reason: reason.trim(),
          created_by: user!.id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: pointType === "bonus" ? "Bonuspoint tilføjet" : "Strafpoint tilføjet",
      });

      // Reset form
      setSelectedTeam("");
      setPoints("");
      setReason("");

      // Reload penalties
      loadPenalties();
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
              Du har ikke adgang til denne side. Kun administratorer kan give strafpoint.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til dommerpanelet
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Penalty/Bonus Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tilføj Point</CardTitle>
              <CardDescription>
                Giv straf- eller bonuspoint til hold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs value={pointType} onValueChange={(v) => setPointType(v as "penalty" | "bonus")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="penalty" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Strafpoint
                    </TabsTrigger>
                    <TabsTrigger value="bonus" className="gap-2">
                      <Minus className="w-4 h-4" />
                      Bonuspoint
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="team">Vælg Hold</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg et hold" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">
                    {pointType === "penalty" ? "Strafpoint" : "Bonuspoint"}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    placeholder="Antal point"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Begrundelse</Label>
                  <Textarea
                    id="reason"
                    placeholder={pointType === "penalty" ? "Hvad gjorde de forkert?" : "Hvad gjorde de godt?"}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                  variant={pointType === "penalty" ? "destructive" : "default"}
                >
                  {pointType === "penalty" ? (
                    <Plus className="w-4 h-4 mr-2" />
                  ) : (
                    <Minus className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? "Tilføjer..." : pointType === "penalty" ? "Tilføj Strafpoint" : "Tilføj Bonuspoint"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Penalties/Bonus List */}
          <Card>
            <CardHeader>
              <CardTitle>Historik</CardTitle>
              <CardDescription>
                Alle tildelte straf- og bonuspoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {penalties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Ingen point givet endnu
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {penalties.map((penalty) => (
                    <div
                      key={penalty.id}
                      className={`p-3 border rounded-lg ${
                        penalty.points < 0 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold">{penalty.teams.name}</h4>
                        <span className={`text-lg font-bold ${
                          penalty.points < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {penalty.points > 0 ? '+' : ''}{penalty.points}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {penalty.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(penalty.created_at).toLocaleString('da-DK')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
