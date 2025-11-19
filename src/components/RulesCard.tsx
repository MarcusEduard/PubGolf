import { Beer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const RulesCard = () => {
  const rules = [
    { infraction: "Drik med højre hånd", penalty: "+1" },
    { infraction: "Overtrædelse af special huller", penalty: "+2" },
    { infraction: "Spilt drink", penalty: "+1" },
    { infraction: "Ikke færdiggjort drink", penalty: "+3" },
    { infraction: "Falde", penalty: "+2" },
    { infraction: "Drikke det samme 2 hul i streg", penalty: "2 shots" },
    { infraction: "Kaste op", penalty: "+3" },
    { infraction: "Ødelægge glas", penalty: "+2" },
    { infraction: "Drikke det forkerte på scorekortet", penalty: "+3" }
  ];

  const bonusPoints = [
    { action: "Klare en challenge fra tasken", bonus: "-2" },
    { action: "Split the G", bonus: "-2" },
    { action: "3 hole in ones i streg (alle fra holdet)", bonus: "-1" },
    { action: "Bedste holdnavn", bonus: "-2" }
  ];

  const specialRules = [
    { 
      icon: "💧", 
      name: "Water Hazard", 
      description: "Der må kun tisses på disse huller!" 
    },
    {
      icon: "➰",
      name: "Strips",
      description: "Holdet bliver stripset sammen, og skal forblive stripset sammen til og med hul 4. Derefter er det muligt at blive frigjort, dette kræver dog, at man finder en saks, kniv eller lignende. Man må IKKE \"bare\" tage dem af hvis de sidder løst."
    },
    { 
      icon: "🟫", 
      name: "Gulvtæppe", 
      description: "1 kande gulvtæppe pr. hold. Alle skal mindst tage én tår." 
    },
    {
      icon: "🤐",
      name: "Stum",
      description: "Der må ikke snakkes med bartenderen overhovedet eller få andre til at bestille for sig. Denne regel må heller ikke vises oppe i baren."
    },
    { 
      icon: "❓", 
      name: "Quiz", 
      description: "På dette hul kommer der en quiz." 
    },
    {
      icon: "𝐆",
      name: "Split the G",
      description: "På dette hul kan man vælge at splitte the G."
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-b from-primary to-secondary text-primary-foreground border-4 border-primary shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Beer className="w-8 h-8" />
          <CardTitle className="text-3xl md:text-4xl font-black uppercase tracking-wider">
            Regler
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-3">Strafpoint</h3>
          {rules.map((rule, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-primary-foreground/20 last:border-b-0"
            >
              <span className="text-sm md:text-base font-medium uppercase tracking-wide">
                {rule.infraction}
              </span>
              <span className="text-sm md:text-base font-bold">{rule.penalty}</span>
            </div>
          ))}
        </div>

        <Separator className="bg-primary-foreground/30" />

        <div className="space-y-2">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-3">Bonuspoint</h3>
          {bonusPoints.map((bonus, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-primary-foreground/20 last:border-b-0"
            >
              <span className="text-sm md:text-base font-medium uppercase tracking-wide">
                {bonus.action}
              </span>
              <span className="text-sm md:text-base font-bold text-green-300">{bonus.bonus}</span>
            </div>
          ))}
        </div>

        <Separator className="bg-primary-foreground/30" />

        <div className="space-y-3">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-3">Specielle Huller</h3>
          {specialRules.map((special, index) => (
            <div
              key={index}
              className="bg-primary-foreground/10 rounded-lg p-3 border border-primary-foreground/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{special.icon}</span>
                <span className="font-bold text-base">{special.name}</span>
              </div>
              <p className="text-xs md:text-sm opacity-90 leading-relaxed">
                {special.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
