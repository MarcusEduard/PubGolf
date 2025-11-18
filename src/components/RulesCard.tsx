import { Beer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const RulesCard = () => {
  const rules = [
    { infraction: "Spilt drink", penalty: "+1" },
    { infraction: "Ikke færdiggjort drink", penalty: "+3" },
    { infraction: "Falde", penalty: "+2" },
    { infraction: "Drikke det samme 2 hul i streg", penalty: "2 shots" },
    { infraction: "Kaste op", penalty: "+3" },
    { infraction: "Ødelægge glas", penalty: "+2" },
    { infraction: "Drikke det forkerte (ikke på scorekortet)", penalty: "+3" }
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
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
};
