import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'other';
  activity_description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

const UserActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, activityTypeFilter]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const { data: logsData, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user profiles separately
      if (logsData && logsData.length > 0) {
        const userIds = [...new Set(logsData.map(log => log.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        // Merge profiles with logs
        const logsWithProfiles = logsData.map(log => ({
          ...log,
          profiles: profilesData?.find(p => p.id === log.user_id) || null
        }));

        setLogs(logsWithProfiles);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by activity type
    if (activityTypeFilter !== "all") {
      filtered = filtered.filter(log => log.activity_type === activityTypeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.activity_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const getActivityBadge = (type: string) => {
    const variants: Record<string, any> = {
      login: "default",
      logout: "secondary",
      create: "default",
      update: "outline",
      delete: "destructive",
      view: "secondary",
      export: "outline",
      other: "secondary"
    };

    const colors: Record<string, string> = {
      login: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      logout: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      create: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      view: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      export: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };

    return (
      <Badge variant={variants[type] || "secondary"} className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            User Activity Log
          </h1>
          <p className="text-muted-foreground">Track user actions and login history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} activities
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activity logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.profiles?.full_name || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActivityBadge(log.activity_type)}</TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="text-sm">{log.activity_description}</div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.metadata, null, 2).substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.entity_type && (
                          <div className="text-sm">
                            <Badge variant="outline">{log.entity_type}</Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityLog;