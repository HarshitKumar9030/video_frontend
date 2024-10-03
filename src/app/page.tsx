"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Search, Upload, Play } from "lucide-react";

interface Video {
  _id: string;
  title: string;
  description: string;
  uploadDate: string;
  views: number;
}

function VideoCard({
  video,
  onPlay,
}: {
  video: Video;
  onPlay: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold line-clamp-1">{video.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {video.description}
        </p>
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>
            Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
          </span>
          <span>Views: {video.views}</span>
        </div>
      </CardContent>
      <CardFooter className="bg-zinc-900 p-2">
        <Button onClick={() => onPlay(video._id)} className="w-full" size="sm">
          <Play className="mr-2 h-4 w-4" /> Play
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 8;
  const { toast } = useToast();
  const apiToken = "23434";

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const filtered = videos.filter(
      (video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVideos(filtered);
    setCurrentPage(1);
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/video/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      setVideos(data);
      setFilteredVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error",
        description: "Failed to load videos. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (videoId: string) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/generate-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, apiToken }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to generate token");
      }
      const data = await response.json();
      localStorage.setItem("accessToken", data.token);
      window.location.href = `http://localhost:3000/video-player?videoId=${encodeURIComponent(
        videoId
      )}&token=${encodeURIComponent(data.token)}`;
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Error",
        description: "Failed to generate token. Please try again.",
        variant: "destructive",
      });
    }
  };

  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(
    indexOfFirstVideo,
    indexOfLastVideo
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">Video Library</h1>
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Link href="/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Video
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentVideos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onPlay={generateToken}
                />
              ))}
            </div>
            {filteredVideos.length > videosPerPage && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from(
                  { length: Math.ceil(filteredVideos.length / videosPerPage) },
                  (_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
