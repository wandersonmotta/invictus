 import * as React from "react";
 import { Mic, Square, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import { cn } from "@/lib/utils";
 
 interface AudioRecorderProps {
   onRecordingComplete: (blob: Blob) => void;
   onCancel: () => void;
   maxDurationSeconds?: number;
 }
 
 export function AudioRecorder({
   onRecordingComplete,
   onCancel,
   maxDurationSeconds = 60,
 }: AudioRecorderProps) {
   const [isRecording, setIsRecording] = React.useState(false);
   const [duration, setDuration] = React.useState(0);
   const [error, setError] = React.useState<string | null>(null);
 
   const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
   const chunksRef = React.useRef<Blob[]>([]);
   const timerRef = React.useRef<number | null>(null);
   const streamRef = React.useRef<MediaStream | null>(null);
 
   const startRecording = async () => {
     try {
       setError(null);
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       streamRef.current = stream;
 
       const mediaRecorder = new MediaRecorder(stream, {
         mimeType: MediaRecorder.isTypeSupported("audio/webm")
           ? "audio/webm"
           : "audio/mp4",
       });
       mediaRecorderRef.current = mediaRecorder;
       chunksRef.current = [];
 
       mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) {
           chunksRef.current.push(e.data);
         }
       };
 
       mediaRecorder.onstop = () => {
         const blob = new Blob(chunksRef.current, {
           type: mediaRecorder.mimeType,
         });
         onRecordingComplete(blob);
       };
 
       mediaRecorder.start(100);
       setIsRecording(true);
       setDuration(0);
 
       timerRef.current = window.setInterval(() => {
         setDuration((prev) => {
           if (prev >= maxDurationSeconds - 1) {
             stopRecording();
             return maxDurationSeconds;
           }
           return prev + 1;
         });
       }, 1000);
     } catch (err) {
       console.error("Error accessing microphone:", err);
       setError("Não foi possível acessar o microfone");
     }
   };
 
   const stopRecording = () => {
     if (timerRef.current) {
       clearInterval(timerRef.current);
       timerRef.current = null;
     }
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
       mediaRecorderRef.current.stop();
     }
     if (streamRef.current) {
       streamRef.current.getTracks().forEach((track) => track.stop());
       streamRef.current = null;
     }
     setIsRecording(false);
   };
 
   const handleCancel = () => {
     if (timerRef.current) {
       clearInterval(timerRef.current);
       timerRef.current = null;
     }
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
       mediaRecorderRef.current.stop();
       chunksRef.current = [];
     }
     if (streamRef.current) {
       streamRef.current.getTracks().forEach((track) => track.stop());
       streamRef.current = null;
     }
     setIsRecording(false);
     onCancel();
   };
 
   React.useEffect(() => {
     return () => {
       if (timerRef.current) {
         clearInterval(timerRef.current);
       }
       if (streamRef.current) {
         streamRef.current.getTracks().forEach((track) => track.stop());
       }
     };
   }, []);
 
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs.toString().padStart(2, "0")}`;
   };
 
   const progress = (duration / maxDurationSeconds) * 100;
 
   if (error) {
     return (
       <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
         <span>{error}</span>
         <Button variant="ghost" size="sm" onClick={onCancel}>
           Fechar
         </Button>
       </div>
     );
   }
 
   if (!isRecording) {
     return (
       <div className="flex items-center gap-2">
         <Button
           type="button"
           variant="ghost"
           size="icon"
           onClick={startRecording}
           className="h-10 w-10 text-primary hover:text-primary/80"
         >
           <Mic className="h-5 w-5" />
           <span className="sr-only">Gravar áudio</span>
         </Button>
       </div>
     );
   }
 
   return (
     <div className="flex items-center gap-3 flex-1 bg-muted/30 rounded-lg px-3 py-2">
       <div className="relative">
         <Mic className="h-5 w-5 text-destructive animate-pulse" />
       </div>
 
       <div className="flex-1 space-y-1">
         <Progress
           value={progress}
           className="h-1.5"
           style={{ "--progress-color": "hsl(var(--destructive))" } as React.CSSProperties}
         />
         <div className="text-xs text-muted-foreground text-center">
           {formatTime(duration)} / {formatTime(maxDurationSeconds)}
         </div>
       </div>
 
       <Button
         type="button"
         variant="ghost"
         size="icon"
         onClick={stopRecording}
         className="h-8 w-8 text-primary"
       >
         <Square className="h-4 w-4 fill-current" />
         <span className="sr-only">Parar gravação</span>
       </Button>
 
       <Button
         type="button"
         variant="ghost"
         size="icon"
         onClick={handleCancel}
         className="h-8 w-8 text-muted-foreground"
       >
         <X className="h-4 w-4" />
         <span className="sr-only">Cancelar</span>
       </Button>
     </div>
   );
 }