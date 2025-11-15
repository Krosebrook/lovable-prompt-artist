import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Download, Share2, FileDown } from "lucide-react";
import Navigation from "@/components/Navigation";
import ScriptDisplay from "@/components/ScriptDisplay";
import StoryboardDisplay from "@/components/StoryboardDisplay";
import DurationSummary from "@/components/DurationSummary";
import ShareDialog from "@/components/ShareDialog";
import { exportProjectToPDF } from "@/lib/pdfExport";
import { calculateTotalDuration } from "@/lib/durationCalculator";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState<any>(null);
  const [storyboardImages, setStoryboardImages] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareViewCount, setShareViewCount] = useState(0);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Load project if project ID is in URL params
        const projectId = searchParams.get("project");
        if (projectId) {
          loadProject(projectId);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const loadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("video_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      setCurrentProjectId(data.id);
      setTitle(data.title);
      setTopic(data.topic);
      setScript(data.script);
      setStoryboardImages(Array.isArray(data.storyboard_images) ? data.storyboard_images : []);

      toast({
        title: "Project loaded",
        description: "Your project has been loaded successfully",
      });
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
    }
  };

  const generateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video topic",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setScript(null);
    setStoryboardImages([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video-script', {
        body: { topic }
      });

      if (error) throw error;

      setScript(data.script);
      setTitle(data.script.title);

      toast({
        title: "Script generated!",
        description: "Now generating storyboard images...",
      });

      // Generate storyboard images
      generateStoryboard(data.script.scenes);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateStoryboard = async (scenes: any[]) => {
    setIsGeneratingImages(true);
    const newImages: any[] = [];

    try {
      for (const scene of scenes) {
        const { data, error } = await supabase.functions.invoke('generate-storyboard', {
          body: { scene }
        });

        if (error) {
          console.error('Failed to generate image for scene', scene.sceneNumber, error);
          continue;
        }

        newImages.push(data);
        setStoryboardImages([...newImages]);
      }

      toast({
        title: "Storyboard complete!",
        description: "All images have been generated.",
      });
    } catch (error: any) {
      toast({
        title: "Warning",
        description: "Some storyboard images could not be generated",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const saveProject = async () => {
    if (!script || !user) return;

    try {
      const totalDuration = calculateTotalDuration(script.scenes);

      const { data, error } = await supabase.from('video_projects').insert({
        user_id: user.id,
        title: title || script.title,
        topic,
        script,
        storyboard_images: storyboardImages,
        total_duration: totalDuration,
      }).select().single();

      if (error) throw error;

      setCurrentProjectId(data.id);

      toast({
        title: "Project saved!",
        description: "Your video script has been saved to your projects.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (!script || !user) return;

    try {
      toast({
        title: "Generating PDF...",
        description: "This may take a moment",
      });

      const project = {
        id: currentProjectId || "temp",
        title: title || script.title,
        topic,
        script,
        storyboard_images: storyboardImages,
        total_duration: calculateTotalDuration(script.scenes),
        created_at: new Date().toISOString(),
      };

      await exportProjectToPDF(project);

      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!currentProjectId) {
      toast({
        title: "Save Required",
        description: "Please save your project before sharing",
        variant: "destructive",
      });
      return;
    }

    setShareUrl(null);
    setShareViewCount(0);

    // Check if share link already exists
    try {
      const { data, error } = await supabase
        .from("public_shares")
        .select("*")
        .eq("project_id", currentProjectId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/share/${data.share_token}`);
        setShareViewCount(data.view_count || 0);
      }
    } catch (error) {
      console.error("Error checking share:", error);
    }

    setShareDialogOpen(true);
  };

  const generateShareLink = async (expiresInDays: number | null) => {
    if (!currentProjectId) return;

    try {
      setIsGeneratingShare(true);
      const { data, error } = await supabase.functions.invoke("generate-share-link", {
        body: { project_id: currentProjectId, expires_in_days: expiresInDays },
      });

      if (error) throw error;

      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/share/${data.share_token}`);
      setShareViewCount(0);

      toast({
        title: "Success",
        description: "Share link generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating share link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate share link",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const deactivateShare = async () => {
    if (!currentProjectId || !shareUrl) return;

    try {
      const token = shareUrl.split("/share/")[1];
      const { error } = await supabase
        .from("public_shares")
        .update({ is_active: false })
        .eq("share_token", token);

      if (error) throw error;

      setShareUrl(null);
      setShareDialogOpen(false);

      toast({
        title: "Success",
        description: "Share link deactivated",
      });
    } catch (error: any) {
      console.error("Error deactivating share:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate share link",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Create Professional Video Scripts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into structured video scripts with AI-generated storyboards
          </p>
        </div>

        <Card className="mb-8 shadow-card animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Video Script
            </CardTitle>
            <CardDescription>
              Describe your video idea and let AI create a professional script with storyboard visuals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={generateScript} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Video Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., How to make the perfect espresso at home"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Script & Storyboard
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {script && (
          <div className="space-y-8">
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" size="sm" onClick={saveProject}>
                <Download className="h-4 w-4 mr-2" />
                Save Project
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ScriptDisplay title={script.title} scenes={script.scenes} />
                
                <StoryboardDisplay 
                  images={storyboardImages} 
                  scenes={script.scenes}
                  isGenerating={isGeneratingImages}
                />
              </div>

              <div>
                <DurationSummary scenes={script.scenes} />
              </div>
            </div>
          </div>
        )}

        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={shareUrl}
          isGenerating={isGeneratingShare}
          viewCount={shareViewCount}
          onGenerate={generateShareLink}
          onDeactivate={shareUrl ? deactivateShare : undefined}
        />
      </main>
    </div>
  );
};

export default Index;