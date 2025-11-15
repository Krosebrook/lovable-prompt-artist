import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScriptDisplay from "@/components/ScriptDisplay";
import StoryboardDisplay from "@/components/StoryboardDisplay";
import DurationSummary from "@/components/DurationSummary";
import { Loader2, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  topic: string;
  script: any;
  storyboard_images: any;
  total_duration: string | null;
}

const SharedProject = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedProject(token);
    }
  }, [token]);

  const loadSharedProject = async (shareToken: string) => {
    try {
      setLoading(true);

      // Get share record and increment view count
      const { data: shareData, error: shareError } = await supabase
        .from("public_shares")
        .select("*")
        .eq("share_token", shareToken)
        .eq("is_active", true)
        .maybeSingle();

      if (shareError) throw shareError;

      if (!shareData) {
        setError("This share link is invalid or has expired.");
        setLoading(false);
        return;
      }

      // Check expiration
      if (shareData.expires_at) {
        const expiresAt = new Date(shareData.expires_at);
        if (expiresAt < new Date()) {
          setError("This share link has expired.");
          setLoading(false);
          return;
        }
      }

      // Increment view count
      await supabase
        .from("public_shares")
        .update({ view_count: (shareData.view_count || 0) + 1 })
        .eq("id", shareData.id);

      // Get project data
      const { data: projectData, error: projectError } = await supabase
        .from("video_projects")
        .select("*")
        .eq("id", shareData.project_id)
        .single();

      if (projectError) throw projectError;

      setProject(projectData);
    } catch (error: any) {
      console.error("Error loading shared project:", error);
      setError("Failed to load shared project.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Project not found."}</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {project.script.title || project.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Shared via Video Script AI
              </p>
            </div>
            <Button onClick={() => navigate("/")} variant="outline">
              Create Your Own
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ScriptDisplay
              title={project.script.title}
              scenes={project.script.scenes}
            />
            {project.storyboard_images && project.storyboard_images.length > 0 && (
              <StoryboardDisplay
                images={project.storyboard_images}
                scenes={project.script.scenes}
                isGenerating={false}
              />
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Topic</p>
                  <p className="text-sm text-muted-foreground">{project.topic}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Scenes</p>
                  <p className="text-sm text-muted-foreground">
                    {project.script.scenes.length} scenes
                  </p>
                </div>
              </CardContent>
            </Card>

            {project.script.scenes.length > 0 && (
              <DurationSummary scenes={project.script.scenes} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedProject;
