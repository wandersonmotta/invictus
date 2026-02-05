 import * as React from "react";
 import { Play, Pause } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface AudioPlayerProps {
   src: string;
   className?: string;
 }
 
 export function AudioPlayer({ src, className }: AudioPlayerProps) {
   const audioRef = React.useRef<HTMLAudioElement>(null);
   const [isPlaying, setIsPlaying] = React.useState(false);
   const [currentTime, setCurrentTime] = React.useState(0);
   const [duration, setDuration] = React.useState(0);
   const [isLoaded, setIsLoaded] = React.useState(false);
 
   React.useEffect(() => {
     const audio = audioRef.current;
     if (!audio) return;
 
     const handleLoadedMetadata = () => {
       setDuration(audio.duration);
       setIsLoaded(true);
     };
 
     const handleTimeUpdate = () => {
       setCurrentTime(audio.currentTime);
     };
 
     const handleEnded = () => {
       setIsPlaying(false);
       setCurrentTime(0);
     };
 
     audio.addEventListener("loadedmetadata", handleLoadedMetadata);
     audio.addEventListener("timeupdate", handleTimeUpdate);
     audio.addEventListener("ended", handleEnded);
 
     return () => {
       audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
       audio.removeEventListener("timeupdate", handleTimeUpdate);
       audio.removeEventListener("ended", handleEnded);
     };
   }, []);
 
   const togglePlayPause = () => {
     const audio = audioRef.current;
     if (!audio) return;
 
     if (isPlaying) {
       audio.pause();
     } else {
       audio.play();
     }
     setIsPlaying(!isPlaying);
   };
 
   const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
     const audio = audioRef.current;
     if (!audio || !duration) return;
 
     const rect = e.currentTarget.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const percentage = x / rect.width;
     const newTime = percentage * duration;
     audio.currentTime = newTime;
     setCurrentTime(newTime);
   };
 
   const formatTime = (seconds: number) => {
     if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
     const mins = Math.floor(seconds / 60);
     const secs = Math.floor(seconds % 60);
     return `${mins}:${secs.toString().padStart(2, "0")}`;
   };
 
   const progress = duration ? (currentTime / duration) * 100 : 0;
 
   return (
     <div className={cn("flex items-center gap-2 min-w-[180px]", className)}>
       <audio ref={audioRef} src={src} preload="metadata" />
 
       <Button
         type="button"
         variant="ghost"
         size="icon"
         onClick={togglePlayPause}
         className="h-8 w-8 shrink-0"
         disabled={!isLoaded}
       >
         {isPlaying ? (
           <Pause className="h-4 w-4" />
         ) : (
           <Play className="h-4 w-4" />
         )}
         <span className="sr-only">{isPlaying ? "Pausar" : "Reproduzir"}</span>
       </Button>
 
       <div
         className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative"
         onClick={handleSeek}
       >
         <div
           className="absolute h-full bg-primary rounded-full transition-all"
           style={{ width: `${progress}%` }}
         />
         <div
           className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full shadow-sm transition-all"
           style={{ left: `calc(${progress}% - 6px)` }}
         />
       </div>
 
       <span className="text-xs text-muted-foreground tabular-nums shrink-0">
         {formatTime(currentTime)} / {formatTime(duration)}
       </span>
     </div>
   );
 }