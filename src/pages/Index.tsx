import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Download, Share2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import ScriptDisplay from "@/components/ScriptDisplay";
import StoryboardDisplay from "@/components/StoryboardDisplay";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState<any>(null);
  const [storyboardImages, setStoryboardImages] = useState<any[]>([]);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
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
  }, [navigate]);

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
      const { error } = await supabase.from('video_projects').insert({
        user_id: user.id,
        title: title || script.title,
        topic,
        script,
        storyboard_images: storyboardImages
      });

      if (error) throw error;

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
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={saveProject}>
                <Download className="h-4 w-4 mr-2" />
                Save Project
              </Button>
            </div>

            <ScriptDisplay title={script.title} scenes={script.scenes} />
            
            <StoryboardDisplay 
              images={storyboardImages} 
              scenes={script.scenes}
              isGenerating={isGeneratingImages}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;