import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface TeamSetupProps {
  onTeamCreated: () => void;
}

export const TeamSetup = ({ onTeamCreated }: TeamSetupProps) => {
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addPlayer = () => {
    setPlayerNames([...playerNames, ""]);
  };

  const removePlayer = (index: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPlayerNames = playerNames.filter(name => name.trim() !== "");
    
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Indtast et holdnavn",
        variant: "destructive",
      });
      return;
    }
    
    if (validPlayerNames.length === 0) {
      toast({
        title: "Error",
        description: "Tilføj mindst én spiller",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName, user_id: user.id })
        .select()
        .single();

      if (teamError) throw teamError;

      // Create players
      const playersData = validPlayerNames.map((name, index) => ({
        team_id: team.id,
        name: name.trim(),
        player_order: index + 1,
      }));

      const { error: playersError } = await supabase
        .from("players")
        .insert(playersData);

      if (playersError) throw playersError;

      toast({
        title: "Success!",
        description: "Hold og spillere oprettet",
      });

      onTeamCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Opret Dit Hold</CardTitle>
        <CardDescription className="text-sm md:text-base">Indtast dit holdnavn og tilføj spillere</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="teamName" className="text-sm md:text-base">Holdnavn</Label>
            <Input
              id="teamName"
              placeholder="Donne er for lækker"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="text-sm md:text-base"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm md:text-base">Spillere</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPlayer}
                className="text-xs md:text-sm"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Tilføj Spiller
              </Button>
            </div>

            {playerNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Spiller ${index + 1}`}
                  value={name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  className="text-sm md:text-base"
                />
                {playerNames.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full text-sm md:text-base" disabled={loading}>
            {loading ? "Opretter..." : "Start Spil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
