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
import { ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      
      const { error } = await supabase
        .from("penalties")
        .insert({
          team_id: selectedTeam,
          points: parseInt(points),
          reason: reason.trim(),
          created_by: user!.id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Strafpoint tilføjet",
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
          Tilbage til Admin Panel
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Penalty Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tilføj Strafpoint</CardTitle>
              <CardDescription>
                Giv point til hold der bryder reglerne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="points">Strafpoint</Label>
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
                    placeholder="Hvad gjorde de forkert?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  <Plus className="w-4 h-4 mr-2" />
                  {submitting ? "Tilføjer..." : "Tilføj Strafpoint"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Penalties List */}
          <Card>
            <CardHeader>
              <CardTitle>Historik</CardTitle>
              <CardDescription>
                Alle tildelte strafpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {penalties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Ingen strafpoint givet endnu
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {penalties.map((penalty) => (
                    <div
                      key={penalty.id}
                      className="p-3 border rounded-lg bg-card"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold">{penalty.teams.name}</h4>
                        <span className="text-lg font-bold text-destructive">
                          +{penalty.points}
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
