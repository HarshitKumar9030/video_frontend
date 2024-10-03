"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Pause } from "lucide-react";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_FILE_TYPES = ["video/mp4", "video/webm", "video/ogg"];

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const apiToken = "23434";
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size exceeds the maximum limit of 100MB.",
        variant: "destructive",
      });
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description:
          "Invalid file type. Please upload MP4, WebM, or OGG video files.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a video file to upload.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    setProgress(0);

    const formData = new FormData(event.currentTarget);
    formData.append("apiToken", apiToken);
    formData.set("video", selectedFile);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast({
          title: "Upload Cancelled",
          description: "Video upload was cancelled.",
        });
      } else {
        console.error("Error uploading video:", error);
        toast({
          title: "Error",
          description: "Failed to upload video. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">
          Upload Video
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-card p-8 rounded-lg shadow-lg"
        >
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2 text-card-foreground"
            >
              Video Title
            </label>
            <Input
              type="text"
              id="title"
              name="title"
              placeholder="Enter video title"
              required
              className="bg-input text-input-foreground"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2 text-card-foreground"
            >
              Video Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter video description"
              required
              className="bg-input text-input-foreground"
            />
          </div>
          <div
            className="mb-6 border-2 border-dashed border-primary rounded-lg p-4 text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="video-file"
              name="video"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="video-file" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a video file here, or click to select a file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: 100MB. Supported formats: MP4, WebM, OGG
              </p>
            </label>
          </div>
          {previewUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-card-foreground">
                Video Preview
              </h2>
              <div className="relative">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full rounded-lg"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 left-2"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          {uploading && (
            <div className="mb-6">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Uploading: {progress}%
              </p>
            </div>
          )}
          <div className="flex justify-between">
            <Button className="bg-zinc-900" type="submit" disabled={uploading || !selectedFile}>
              {uploading ? "Uploading..." : "Upload Video"}
            </Button>
            {uploading && (
              <Button
                type="button"
                variant="destructive"
                onClick={cancelUpload}
              >
                Cancel Upload
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
