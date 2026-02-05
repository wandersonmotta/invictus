 import { FinanceiroLayout } from "@/components/financeiro/FinanceiroLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { FileText, Clock } from "lucide-react";
 
 export default function FinanceiroHistorico() {
   return (
     <div className="space-y-6">
       <h1 className="text-xl font-bold">Histórico de Auditorias</h1>
       
       <Card className="border-dashed">
         <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
             <FileText className="h-6 w-6 text-muted-foreground" />
           </div>
           <CardTitle className="text-lg">Em breve</CardTitle>
         </CardHeader>
         <CardContent className="text-center">
           <p className="text-sm text-muted-foreground">
             O histórico completo de auditorias aprovadas e rejeitadas estará
             disponível em breve.
           </p>
           <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
             <Clock className="h-3 w-3" />
             <span>Funcionalidade em desenvolvimento</span>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }