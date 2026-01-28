import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Mensagens() {
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Mensagens</h1>
        <p className="text-sm text-muted-foreground">Modelo Instagram: Inbox + Solicitações (placeholder).</p>
      </header>

      <Tabs defaultValue="inbox">
        <TabsList className="invictus-surface invictus-frame bg-muted/20">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <Card className="invictus-surface invictus-frame border-border/70">
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Conversas aceitas aparecem aqui.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="invictus-surface invictus-frame border-border/70">
            <CardHeader>
              <CardTitle>Solicitações</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Novas mensagens de quem ainda não se segue caem aqui.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
