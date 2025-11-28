import { Card, CardContent } from "@/components/ui/card";
import { Settings, Sparkles } from "lucide-react";

export function MaintenancePage() {
  return (
    <main className="container mx-auto px-6 py-12">
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
              <Settings className="h-12 w-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
              <Sparkles className="h-6 w-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Maintenance en cours
              </h1>
              <p className="text-xl text-muted-foreground">
                Nous améliorons votre expérience
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4 pt-4">
              <p className="text-muted-foreground leading-relaxed">
                Vault Navigator est actuellement en cours d&apos;amélioration pour vous offrir
                une meilleure expérience et de nouvelles fonctionnalités.
              </p>
              <p className="text-sm text-muted-foreground">
                Nous serons de retour très prochainement. Merci de votre patience.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-6">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
