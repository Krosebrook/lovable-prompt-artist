import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus } from "lucide-react";

const Teams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadTeams();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('teams') as any)
        .select('*, team_members(count)')
        .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teams</h1>
            <p className="text-muted-foreground">
              Collaborate with your team on video projects
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-4">Create your first team to start collaborating</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>members</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
