 import * as React from "react";
 import { Paperclip } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useToast } from "@/hooks/use-toast";
 
 const ALLOWED_TYPES = [
   "image/jpeg",
   "image/png",
   "image/webp",
   "image/gif",
   "application/pdf",
 ];
 
 const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
 
 interface AttachmentPickerProps {
   onFilesSelected: (files: File[]) => void;
   disabled?: boolean;
 }
 
 export function AttachmentPicker({ onFilesSelected, disabled }: AttachmentPickerProps) {
   const { toast } = useToast();
   const inputRef = React.useRef<HTMLInputElement>(null);
 
   const handleClick = () => {
     inputRef.current?.click();
   };
 
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = Array.from(e.target.files ?? []);
     if (files.length === 0) return;
 
     const validFiles: File[] = [];
     const errors: string[] = [];
 
     for (const file of files) {
       if (!ALLOWED_TYPES.includes(file.type)) {
         errors.push(`${file.name}: tipo não permitido`);
         continue;
       }
       if (file.size > MAX_FILE_SIZE) {
         errors.push(`${file.name}: arquivo muito grande (máx. 20MB)`);
         continue;
       }
       validFiles.push(file);
     }
 
     if (errors.length > 0) {
       toast({
         title: "Alguns arquivos foram ignorados",
         description: errors.join(", "),
         variant: "destructive",
       });
     }
 
     if (validFiles.length > 0) {
       onFilesSelected(validFiles);
     }
 
     // Reset input
     if (inputRef.current) {
       inputRef.current.value = "";
     }
   };
 
   return (
     <>
       <input
         ref={inputRef}
         type="file"
         accept={ALLOWED_TYPES.join(",")}
         multiple
         onChange={handleChange}
         className="hidden"
       />
       <Button
         type="button"
         variant="ghost"
         size="icon"
         onClick={handleClick}
         disabled={disabled}
         className="h-10 w-10"
       >
         <Paperclip className="h-5 w-5" />
         <span className="sr-only">Anexar arquivo</span>
       </Button>
     </>
   );
 }