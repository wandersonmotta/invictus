 import * as React from "react";
 import { X, File, Image as ImageIcon } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 export interface AttachmentFile {
   file: File;
   previewUrl?: string;
 }
 
 interface AttachmentPreviewProps {
   attachments: AttachmentFile[];
   audioBlob?: Blob | null;
   onRemoveAttachment: (index: number) => void;
   onRemoveAudio: () => void;
 }
 
 export function AttachmentPreview({
   attachments,
   audioBlob,
   onRemoveAttachment,
   onRemoveAudio,
 }: AttachmentPreviewProps) {
   const audioUrl = React.useMemo(() => {
     if (!audioBlob) return null;
     return URL.createObjectURL(audioBlob);
   }, [audioBlob]);
 
   React.useEffect(() => {
     return () => {
       if (audioUrl) {
         URL.revokeObjectURL(audioUrl);
       }
     };
   }, [audioUrl]);
 
   if (attachments.length === 0 && !audioBlob) {
     return null;
   }
 
   const formatSize = (bytes: number) => {
     if (bytes < 1024) return `${bytes} B`;
     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
   };
 
   return (
     <div className="flex flex-wrap gap-2 p-2 border-b border-border/60">
       {attachments.map((att, idx) => (
         <div
           key={idx}
           className="relative flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 pr-8"
         >
           {att.file.type.startsWith("image/") ? (
             att.previewUrl ? (
               <img
                 src={att.previewUrl}
                 alt={att.file.name}
                 className="h-10 w-10 object-cover rounded"
               />
             ) : (
               <ImageIcon className="h-5 w-5 text-muted-foreground" />
             )
           ) : (
             <File className="h-5 w-5 text-muted-foreground" />
           )}
           <div className="min-w-0">
             <div className="text-sm truncate max-w-[120px]">{att.file.name}</div>
             <div className="text-xs text-muted-foreground">
               {formatSize(att.file.size)}
             </div>
           </div>
           <Button
             type="button"
             variant="ghost"
             size="icon"
             className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
             onClick={() => onRemoveAttachment(idx)}
           >
             <X className="h-3 w-3" />
             <span className="sr-only">Remover</span>
           </Button>
         </div>
       ))}
 
       {audioBlob && audioUrl && (
         <div className="relative flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 pr-8">
           <audio src={audioUrl} className="hidden" />
           <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
               <span className="text-xs">🎤</span>
             </div>
             <div className="text-sm">Áudio gravado</div>
           </div>
           <Button
             type="button"
             variant="ghost"
             size="icon"
             className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
             onClick={onRemoveAudio}
           >
             <X className="h-3 w-3" />
             <span className="sr-only">Remover áudio</span>
           </Button>
         </div>
       )}
     </div>
   );
 }