import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface CommentThreadProps {
  projectId: string;
  sceneNumber?: number;
}

export const CommentThread = ({ projectId, sceneNumber }: CommentThreadProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_comments',
        filter: sceneNumber 
          ? `project_id=eq.${projectId},scene_number=eq.${sceneNumber}`
          : `project_id=eq.${projectId}`
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, sceneNumber]);

  const loadComments = async () => {
    try {
      let query = (supabase
        .from('project_comments') as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (sceneNumber !== undefined) {
        query = query.eq('scene_number', sceneNumber);
      } else {
        query = query.is('scene_number', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase.from('project_comments') as any).insert({
        project_id: projectId,
        user_id: user.id,
        scene_number: sceneNumber,
        content: newComment.trim()
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {sceneNumber ? `Scene ${sceneNumber} Comments` : 'Project Comments'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-primary/20 pl-3 py-2">
                <p className="text-sm">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddComment} disabled={isLoading || !newComment.trim()}>
            {isLoading ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
