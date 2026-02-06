import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RedeemConfirmDialogProps {
  open: boolean;
  rewardName: string;
  pointsCost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RedeemConfirmDialog({
  open,
  rewardName,
  pointsCost,
  onConfirm,
  onCancel,
}: RedeemConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar resgate</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja resgatar <span className="font-semibold text-foreground">{rewardName}</span> por{" "}
            <span className="font-semibold text-foreground">{pointsCost.toLocaleString("pt-BR")} pontos</span>?
            <br />
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar resgate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
