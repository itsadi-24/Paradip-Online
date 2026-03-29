import { useState, useEffect } from "react";
import { 
  Save, 
  ExternalLink, 
  BarChart3, 
  MousePointer2, 
  Activity, 
  Users, 
  Clock, 
  Monitor, 
  Globe, 
  TrendingUp,
  RefreshCcw,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { getRealtimeData, getAnalyticsOverview, type RealtimeData, type AnalyticsOverview } from "@/api/analyticsApi";

const Analytics = () => {
  const { toast } = useToast();
  const { settings: globalSettings, loading, updateSettings } = useSettings();
  
  // Settings State
  const [gaId, setGaId] = useState("");
  const [clarityId, setClarityId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);

  // Data State
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (globalSettings) {
      setGaId(globalSettings.gaMeasurementId || "");
      setClarityId(globalSettings.clarityProjectId || "");
      setPropertyId(globalSettings.gaPropertyId || "");
    }
  }, [globalSettings]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchRealtime, 30000); // 30s refresh for realtime
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const [rt, ov] = await Promise.all([
        getRealtimeData(),
        getAnalyticsOverview()
      ]);
      if (rt.data) setRealtime(rt.data);
      if (ov.data) setOverview(ov.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchRealtime = async () => {
    const { data } = await getRealtimeData();
    if (data) setRealtime(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...globalSettings!,
        gaMeasurementId: gaId,
        clarityProjectId: clarityId,
        gaPropertyId: propertyId,
      });
      toast({
        title: "Configuration Saved",
        description: "Your analytics IDs and property settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Syncing dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = overview?.history || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time behavioral insights and traffic performance for paradiponline.com
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={dataLoading} className="gap-2">
                <RefreshCcw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh Data
            </Button>
            <Button onClick={handleSave} className="gap-2 shadow-lg" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Config"}
            </Button>
        </div>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Users className="h-20 w-20" />
            </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70 uppercase text-[10px] font-bold tracking-widest">
                Active Now
            </CardDescription>
            <CardTitle className="text-4xl font-black">{realtime?.activeUsers || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs font-medium text-primary-foreground/80">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live Visitors
            </div>
          </CardContent>
        </Card>

        {[
            { title: "Total Sessions", val: overview?.totalSessions.toLocaleString() || "0", icon: TrendingUp, label: "Last 7 Days" },
            { title: "Avg. Duration", val: overview?.avgSessionDuration || "0s", icon: Clock, label: "Engagement Time" },
            { title: "New Users", val: overview?.totalUsers.toLocaleString() || "0", icon: Users, label: "Unique Visitors" }
        ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[10px] font-bold tracking-widest">
                        {stat.title}
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold">{stat.val}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <stat.icon className="h-3 w-3 mr-1" />
                        {stat.label}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-sm">Traffic Overview</TabsTrigger>
          <TabsTrigger value="behavior" className="rounded-lg data-[state=active]:shadow-sm">Device & Geography</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg data-[state=active]:shadow-sm">Top Content</TabsTrigger>
          <TabsTrigger value="setup" className="rounded-lg data-[state=active]:shadow-sm">Service Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Visitor Trends</CardTitle>
                <CardDescription>Daily users and sessions over the last week</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Users
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-sky-300" /> Sessions
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: 'white' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--sky-300))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Device Distribution</CardTitle>
                        <CardDescription>Most popular user platforms</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Mobile', val: 65 },
                                { name: 'Desktop', val: 32 },
                                { name: 'Tablet', val: 3 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={40}>
                                    {[0, 1, 2].map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">Geographic Origin</CardTitle>
                        <CardDescription>Where your audience lives</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { country: 'Odisha, India', users: '1,240', p: 85 },
                            { country: 'Other, India', users: '180', p: 12 },
                            { country: 'International', users: '45', p: 3 },
                        ].map((loc, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{loc.country}</span>
                                    <span className="text-muted-foreground">{loc.users}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${loc.p}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Top Performing Pages</CardTitle>
                <CardDescription>Content with the highest user engagement</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left p-4 font-semibold">Page Path</th>
                                <th className="text-right p-4 font-semibold">Views</th>
                                <th className="text-right p-4 font-semibold">Time on Page</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[
                                { path: '/', name: 'Home', views: '1,420', time: '1m 24s' },
                                { path: '/services', name: 'Services', views: '980', time: '2m 10s' },
                                { path: '/support', name: 'Get Support', views: '654', time: '4m 05s' },
                                { path: '/sales', name: 'Shop', views: '430', time: '1m 15s' },
                                { path: '/blog/computer-maintenance', name: 'Blog: PC Care', views: '320', time: '3m 45s' },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{row.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{row.path}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-primary">{row.views}</td>
                                    <td className="p-4 text-right text-muted-foreground">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Google Analytics Configuration */}
                <Card className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
                    <div className="h-1 bg-blue-500 w-full" />
                    <CardHeader>
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Google Analytics 4</CardTitle>
                            <CardDescription>Track traffic and dashboard data.</CardDescription>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ga-id">Measurement ID (Frontend)</Label>
                                <Input
                                    id="ga-id"
                                    placeholder="G-XXXXXXXXXX"
                                    value={gaId}
                                    onChange={(e) => setGaId(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prop-id">Property ID (Dashboard API)</Label>
                                <Input
                                    id="prop-id"
                                    placeholder="123456789"
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Required to pull "Real Results" into this dashboard.
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3 text-blue-600 flex items-center gap-2">
                             <ArrowUpRight className="h-3 w-3" />
                             External Reports
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href="https://analytics.google.com/" target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                GA4 Admin
                            </a>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href={`https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}/realtime`} target="_blank" rel="noreferrer">
                                <Activity className="h-3.5 w-3.5" />
                                Live View
                            </a>
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Microsoft Clarity Configuration */}
                <Card className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
                    <div className="h-1 bg-indigo-500 w-full" />
                    <CardHeader>
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <MousePointer2 className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle>Microsoft Clarity</CardTitle>
                            <CardDescription>Visual heatmaps and recordings.</CardDescription>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="clarity-id">Project ID</Label>
                        <Input
                            id="clarity-id"
                            placeholder="xxxxxxxxxx"
                            value={clarityId}
                            onChange={(e) => setClarityId(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            Found in Clarity Settings &gt; Setup.
                        </p>
                        </div>

                        <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3 text-indigo-600 flex items-center gap-2">
                            <ArrowUpRight className="h-3 w-3" />
                            External Recordings
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href="https://clarity.microsoft.com/projects" target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Clarity Home
                            </a>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`} target="_blank" rel="noreferrer">
                                <BarChart3 className="h-3.5 w-3.5" />
                                Recordings
                            </a>
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
             {/* API Instructions */}
            <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-800/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-400" />
                        Connecting "Real Results" (API Setup)
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-400 text-sm py-6 space-y-4">
                    <p>To enable the real-time charts above, you must follow these 3 steps:</p>
                    <ol className="list-decimal list-inside space-y-3 pl-4">
                        <li>Go to <a href="https://console.cloud.google.com/" className="text-primary hover:underline">Google Cloud Console</a> and enable the <strong>"Google Analytics Data API"</strong>.</li>
                        <li>Create a <strong>Service Account</strong>, download the <strong>JSON Key file</strong>, and upload it to your server as <code>service-account.json</code>.</li>
                        <li>Copy your <strong>GA4 Property ID</strong> (a 9-digit number) into the field above and save.</li>
                    </ol>
                    <div className="p-3 bg-slate-800 rounded-lg text-xs leading-relaxed border-l-4 border-primary">
                        <strong>Note:</strong> Until you connect your API key, the charts above will display "Demo Data" to show you the layout.
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
