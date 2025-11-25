import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Eye, Edit } from "lucide-react";

interface Player {
  id: string;
  name: string;
  player_order: number;
}

interface ScoreCardProps {
  teamId: string;
  teamName: string;
  onLogout: () => void;
}

export const ScoreCard = ({ teamId, teamName, onLogout }: ScoreCardProps) => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<{ [playerId: string]: { [hole: number]: number } }>({});
  const [loading, setLoading] = useState(true);

  const holes = [
    { number: 1, pub: "Die Kleine Bierstube", drink: "Fadøl", par: 3, special: null, waterHazard: false },
    { number: 2, pub: "Kurts mor", drink: "Vodka Juice", par: 2, special: "strips", waterHazard: true },
    { number: 3, pub: "Bodegaen", drink: "Gulvtæppe", par: 2, special: "gt", waterHazard: false },
    { number: 4, pub: "Thorkilds", drink: "Long Island", par: 3, special: null, waterHazard: true },
    { number: 5, pub: "Snevringen", drink: "dåse øl", par: 2, special: "øl-staffet", waterHazard: false },
    { number: 6, pub: "Tanken", drink: "Pickle shot", par: 1, special: "ikke-snakke", waterHazard: true },
    { number: 7, pub: "Tokio bar", drink: "Valgri genstand (ikke shots)", par: 2, special: "quiz", waterHazard: false },
    { number: 8, pub: "Vinstuen", drink: "Æselspark + 1 øl", par: 1, special: "no-hands", waterHazard: true },
    { number: 9, pub: "Sherlock Holmnes", drink: "Guiness", par: 3, special: "split-the-g", waterHazard: false },
  ];

  const getSpecialIcon = (special: string | null) => {
    switch (special) {
      case "ikke-snakke":
        return "";
      case "quiz":
        return "";
      case "strips":
        return "";
      case "gt":
        return "";
      case "øl-staffet":
        return "";
      case "no-hands":
        return "";
      case "split-the-g":
        return "";
      default:
        return null;
    }
  };

  const getSpecialText = (special: string | null) => {
    switch (special) {
      case "ikke-snakke":
        return "Stum";
      case "quiz":
        return "Quiz";
      case "strips":
        return "Strips";
      case "gt":
        return "Gulvtæppe";
      case "øl-staffet":
        return "Øl-staffet";
      case "no-hands":
        return "No Hands";
      case "split-the-g":
        return "Split the G";
      default:
        return null;
    }
  };

  useEffect(() => {
    loadPlayersAndScores();
  }, [teamId]);

  const loadPlayersAndScores = async () => {
    try {
      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId)
        .order("player_order");

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Load scores
      const { data: scoresData, error: scoresError } = await supabase
        .from("scores")
        .select("*")
        .in("player_id", (playersData || []).map(p => p.id));

      if (scoresError) throw scoresError;

      // Organize scores by player and hole
      const scoresMap: { [playerId: string]: { [hole: number]: number } } = {};
      (scoresData || []).forEach(score => {
        if (!scoresMap[score.player_id]) {
          scoresMap[score.player_id] = {};
        }
        scoresMap[score.player_id][score.hole_number] = score.score;
      });
      setScores(scoresMap);
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

  const updateScore = async (playerId: string, holeNumber: number, value: string) => {
    const numValue = parseInt(value) || 0;
    
    // Update local state
    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [holeNumber]: numValue,
      },
    }));

    // Save to database
    try {
      const { error } = await supabase
        .from("scores")
        .upsert({
          player_id: playerId,
          hole_number: holeNumber,
          score: numValue,
        }, {
          onConflict: "player_id,hole_number",
        });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculatePlayerTotal = (playerId: string) => {
    const playerScores = scores[playerId] || {};
    return Object.values(playerScores).reduce((sum, score) => sum + score, 0);
  };

  const calculateTotalPar = () => {
    return holes.reduce((sum, hole) => sum + hole.par, 0);
  };

  const calculateTeamScoreForHole = (holeNumber: number) => {
    return players.reduce((sum, player) => {
      return sum + (scores[player.id]?.[holeNumber] || 0);
    }, 0);
  };

  const calculateTeamTotal = () => {
    return players.reduce((sum, player) => {
      return sum + calculatePlayerTotal(player.id);
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mmmmmmmmhhhhhh...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary">{teamName}</CardTitle>
            <CardDescription className="text-base md:text-lg">Par {calculateTotalPar()}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="input" className="gap-2">
              <Edit className="w-4 h-4" />
              Indtast Score
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="w-4 h-4" />
              Oversigt
            </TabsTrigger>
          </TabsList>

          {/* INPUT TAB */}
          <TabsContent value="input" className="mt-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {holes.map((hole, index) => (
                <>
                  {hole.number === 5 && (
                    <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                      <CardContent className="py-4 text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">PAUSE</p>
                        <p className="text-sm text-muted-foreground mt-1">Få noget mad og tag et holdbillede</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card key={hole.number} className={`border-2 ${hole.special || hole.waterHazard ? 'border-amber-500' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                            Hul {hole.number}
                            <span className="text-sm font-normal text-muted-foreground">
                              Par {hole.par}
                            </span>
                            {hole.waterHazard && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                <span></span>
                                <span>Water Hazard</span>
                              </span>
                            )}
                            {hole.special && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                <span>{getSpecialIcon(hole.special)}</span>
                                <span>{getSpecialText(hole.special)}</span>
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-base font-semibold text-foreground mt-1">
                            {hole.pub}
                          </CardDescription>
                          <p className="text-sm text-muted-foreground">{hole.drink}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {players.map(player => (
                        <div key={player.id} className="flex items-center justify-between">
                          <Label htmlFor={`${player.id}-${hole.number}`} className="text-base">
                            {player.name}
                          </Label>
                          <Input
                            id={`${player.id}-${hole.number}`}
                            type="number"
                            min="0"
                            className="w-20 text-center text-lg font-semibold"
                            value={scores[player.id]?.[hole.number] || ""}
                            onChange={(e) => updateScore(player.id, hole.number, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ))}
              
              {/* Total Score Card */}
              <Card className="border-2 border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-xl">Total Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {players.map(player => (
                    <div key={player.id} className="flex items-center justify-between text-lg font-bold">
                      <span>{player.name}</span>
                      <span className="text-2xl text-primary">{calculatePlayerTotal(player.id)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary">
                    <th className="p-2 text-left font-semibold text-foreground">Hul</th>
                    <th className="p-2 text-left font-semibold text-foreground">Pub</th>
                    <th className="p-2 text-left font-semibold text-foreground">Drink</th>
                    <th className="p-2 text-center font-semibold text-foreground">Par</th>
                    {players.map(player => (
                      <th key={player.id} className="p-2 text-center font-semibold text-foreground min-w-[80px]">
                        {player.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holes.map((hole) => (
                    <React.Fragment key={hole.number}>
                      {hole.number === 5 && (
                        <tr>
                          <td colSpan={4 + players.length} className="p-0">
                            <div className="bg-blue-50 dark:bg-blue-950 border-y-2 border-blue-500 p-3 text-center">
                              <span className="text-2xl mr-2"></span>
                              <span className="font-bold text-blue-700 dark:text-blue-300">PAUSE</span>
                              <span className="text-2xl ml-2"></span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 font-medium text-foreground">{hole.number}</td>
                        <td className="p-2 text-foreground">{hole.pub}</td>
                        <td className="p-2 text-muted-foreground">{hole.drink}</td>
                        <td className="p-2 text-center text-foreground">{hole.par}</td>
                        {players.map(player => (
                          <td key={player.id} className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="w-16 text-center mx-auto"
                              value={scores[player.id]?.[hole.number] || ""}
                              onChange={(e) => updateScore(player.id, hole.number, e.target.value)}
                              placeholder="0"
                            />
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="bg-primary/10 font-bold border-t-2 border-primary">
                    <td colSpan={3} className="p-3 text-right text-foreground">Total:</td>
                    <td className="p-3 text-center text-foreground">{calculateTotalPar()}</td>
                    {players.map(player => (
                      <td key={player.id} className="p-3 text-center text-xl text-primary">
                        {calculatePlayerTotal(player.id)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {holes.map((hole) => {
                const teamScore = calculateTeamScoreForHole(hole.number);
                return (
                  <React.Fragment key={hole.number}>
                    {hole.number === 5 && (
                      <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
                        <CardHeader className="pb-3 pt-3">
                          <CardTitle className="text-center text-blue-700 dark:text-blue-300">
                            <span className="text-2xl mr-2"></span>
                            PAUSE
                            <span className="text-2xl ml-2"></span>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    )}
                    <Card className={`border-2 ${hole.special || hole.waterHazard ? 'border-amber-500' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                              Hul {hole.number}
                              <span className="text-sm font-normal text-muted-foreground">
                                Par {hole.par}
                              </span>
                              {hole.waterHazard && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                  <span></span>
                                  <span>Water Hazard</span>
                                </span>
                              )}
                              {hole.special && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                  <span>{getSpecialIcon(hole.special)}</span>
                                  <span>{getSpecialText(hole.special)}</span>
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-base font-semibold text-foreground mt-1">
                              {hole.pub}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground">{hole.drink}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Hold Score</div>
                            <div className="text-3xl font-bold text-primary">{teamScore}</div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </React.Fragment>
                );
              })}
              
              {/* Total Score Card */}
              <Card className="border-2 border-primary bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Hold Total</CardTitle>
                    <div className="text-4xl font-bold text-primary">{calculateTeamTotal()}</div>
                  </div>
                  <CardDescription className="mt-2">
                    Par for banen: {calculateTotalPar()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary">
                    <th className="p-2 text-left font-semibold text-foreground">Hul</th>
                    <th className="p-2 text-left font-semibold text-foreground">Pub</th>
                    <th className="p-2 text-left font-semibold text-foreground">Drink</th>
                    <th className="p-2 text-center font-semibold text-foreground">Par</th>
                    <th className="p-2 text-center font-semibold text-foreground">Hold Score</th>
                  </tr>
                </thead>
                <tbody>
                  {holes.map((hole) => {
                    const teamScore = calculateTeamScoreForHole(hole.number);
                    return (
                      <tr key={hole.number} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 font-medium text-foreground">{hole.number}</td>
                        <td className="p-2 text-foreground">{hole.pub}</td>
                        <td className="p-2 text-muted-foreground">{hole.drink}</td>
                        <td className="p-2 text-center text-foreground">{hole.par}</td>
                        <td className="p-2 text-center text-xl font-bold text-primary">{teamScore}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-primary/10 font-bold border-t-2 border-primary">
                    <td colSpan={3} className="p-3 text-right text-foreground">Total:</td>
                    <td className="p-3 text-center text-foreground">{calculateTotalPar()}</td>
                    <td className="p-3 text-center text-2xl text-primary">{calculateTeamTotal()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
