import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import ProjectCard from "@/components/ProjectCard";
import ShareDialog from "@/components/ShareDialog";
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
import { Loader2, FolderOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportProjectToPDF } from "@/lib/pdfExport";

interface Project {
  id: string;
  title: string;
  topic: string;
  script: any;
  storyboard_images: any;
  total_duration: string | null;
  created_at: string;
  updated_at: string;
}

const ProjectHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharingProject, setSharingProject] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareViewCount, setShareViewCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        loadProjects(user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProjects = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("video_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (projectId: string) => {
    navigate(`/?project=${projectId}`);
  };

  const handleDelete = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from("video_projects")
        .delete()
        .eq("id", projectToDelete);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== projectToDelete));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleExport = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      toast({
        title: "Generating PDF...",
        description: "This may take a moment",
      });
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

  const handleShare = async (projectId: string) => {
    setSharingProject(projectId);
    setShareUrl(null);
    setShareViewCount(0);

    // Check if share link already exists
    try {
      const { data, error } = await supabase
        .from("public_shares")
        .select("*")
        .eq("project_id", projectId)
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
    if (!sharingProject) return;

    try {
      setIsGeneratingShare(true);
      const { data, error } = await supabase.functions.invoke("generate-share-link", {
        body: { project_id: sharingProject, expires_in_days: expiresInDays },
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
    if (!sharingProject || !shareUrl) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            View and manage your video script projects
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No projects yet
            </h2>
            <p className="text-muted-foreground mb-4">
              Create your first video script to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.script.title || project.title}
                topic={project.topic}
                created_at={project.created_at}
                total_duration={project.total_duration || undefined}
                storyboard_images={project.storyboard_images || undefined}
                onView={handleView}
                onDelete={handleDelete}
                onExport={handleExport}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        isGenerating={isGeneratingShare}
        viewCount={shareViewCount}
        onGenerate={generateShareLink}
        onDeactivate={shareUrl ? deactivateShare : undefined}
      />
    </div>
  );
};

export default ProjectHistory;
