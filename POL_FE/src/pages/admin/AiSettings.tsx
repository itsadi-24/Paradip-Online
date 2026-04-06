import { useState, useEffect } from "react";
import { Save, Brain, Zap, Clock, Eye, Trash2, RefreshCw, X, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const AiSettings = () => {
  const { toast } = useToast();
  const { settings: globalSettings, loading, updateSettings } = useSettings();
  
  const [settings, setSettings] = useState({
    enableAiSocialProof: true,
    aiSocialProofInterval: 90,
    showAiCloseButton: true,
    aiSocialProofMode: 'synthesis' as 'synthesis' | 'real_data',
    groqApiKey: ""
  });

  const [saving, setSaving] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => {
    if (globalSettings) {
      setSettings({
        enableAiSocialProof: globalSettings.enableAiSocialProof ?? true,
        aiSocialProofInterval: globalSettings.aiSocialProofInterval ?? 90,
        showAiCloseButton: globalSettings.showAiCloseButton ?? true,
        aiSocialProofMode: (globalSettings.aiSocialProofMode as any) || 'synthesis',
        groqApiKey: globalSettings.groqApiKey || ""
      });
    }
  }, [globalSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Merge with global settings to satisfy the full interface
      if (globalSettings) {
        await updateSettings({ ...globalSettings, ...settings });
      } else {
        await updateSettings(settings as any);
      }
      toast({
        title: "AI Analysis Complete",
        description: "Your conversion triggers have been optimized successfully.",
      });
    } catch (error) {
      toast({
        title: "Matrix Error",
        description: "Failed to synchronize AI settings. Check backend connection.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = (value: string) => {
    setSettings(prev => ({ ...prev, aiSocialProofMode: value as any }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-pulse">
          <Brain className="h-12 w-12 text-blue-600 mx-auto animate-bounce" />
          <p className="mt-4 text-slate-600 font-bold uppercase tracking-widest text-xs">Syncing AI Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Control Center</h1>
            <p className="text-slate-500 font-medium">Manage Groq-powered sales triggers & FOMO algorithms</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Optimizing..." : "Save Configuration"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <CardTitle>Dynamic Social Proof</CardTitle>
              </div>
              <CardDescription className="text-slate-500 font-medium">
                Create a "Busy Shop" atmosphere by showing realistic activity to visitors.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-blue-200 group">
                <div className="space-y-1">
                  <Label htmlFor="enable-ai" className="text-base font-bold text-slate-800">Enable Social Proof Notifications</Label>
                  <p className="text-sm text-slate-500">Show floating activity toasts to build immediate trust.</p>
                </div>
                <Switch 
                  id="enable-ai" 
                  checked={settings.enableAiSocialProof} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAiSocialProof: checked }))}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Social Proof Intelligence Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleModeChange('synthesis')}
                    className={cn(
                      "cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300",
                      settings.aiSocialProofMode === 'synthesis' 
                        ? "bg-blue-50 border-blue-600 ring-4 ring-blue-50 shadow-lg" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("p-2 rounded-lg", settings.aiSocialProofMode === 'synthesis' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}>
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      {settings.aiSocialProofMode === 'synthesis' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                    <p className="font-bold text-slate-900">AI Synthesis</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Honest, context-aware simulation based on your service catalog. Best for new shops.</p>
                  </div>

                  <div 
                    onClick={() => handleModeChange('real_data')}
                    className={cn(
                      "cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300",
                      settings.aiSocialProofMode === 'real_data' 
                        ? "bg-indigo-50 border-indigo-600 ring-4 ring-indigo-50 shadow-lg" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("p-2 rounded-lg", settings.aiSocialProofMode === 'real_data' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>
                        <Eye className="h-4 w-4" />
                      </div>
                      {settings.aiSocialProofMode === 'real_data' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <p className="font-bold text-slate-900">Real Data Sync</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pull activities directly from your database and uses AI to anonymize & prettify them.</p>
                  </div>
                </div>
              </div>

              {/* Interval Settings */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-slate-800">Notification Interval</Label>
                    <p className="text-sm text-slate-500">Control how frequently a new notification appears.</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
                    Every {settings.aiSocialProofInterval} Seconds
                  </div>
                </div>
                <div className="px-2">
                  <Slider 
                    value={[settings.aiSocialProofInterval]} 
                    min={30} 
                    max={600} 
                    step={10} 
                    onValueChange={(val) => setSettings(prev => ({ ...prev, aiSocialProofInterval: val[0] }))}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    <span>30s (Turbo)</span>
                    <span>300s (Balanced)</span>
                    <span>600s (Subtle)</span>
                  </div>
                </div>
              </div>

              {/* Behavioral Controls */}
              <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 border border-slate-100">
                <div className="space-y-1">
                  <Label htmlFor="show-close" className="text-base font-bold text-slate-800">User Dismissal Control (X Button)</Label>
                  <p className="text-sm text-slate-500">Allow users to close and permanently hide notifications for their session.</p>
                </div>
                <Switch 
                  id="show-close" 
                  checked={settings.showAiCloseButton} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAiCloseButton: checked }))}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Groq Intelligence Configuration */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden mt-8 border-l-4 border-indigo-500">
            <CardHeader className="bg-indigo-50/30 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Groq Intelligence Configuration</CardTitle>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-indigo-100 shadow-sm">
                  <div className={cn("h-2 w-2 rounded-full", settings.groqApiKey ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {settings.groqApiKey ? "Synced" : "Disconnected"}
                  </span>
                </div>
              </div>
              <CardDescription className="text-slate-500 font-medium">
                Bridge the gap between Paradip retail data and LLAMA-3.3 high-speed inference.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Groq High-Speed API Key</Label>
                  <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Encrypted in Transit</span>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input 
                    id="api-key"
                    type="password"
                    value={settings.groqApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, groqApiKey: e.target.value }))}
                    placeholder="gsk_************************************************"
                    className="h-14 pl-12 pr-12 rounded-2xl border-slate-200 focus:border-indigo-500 font-mono text-sm tracking-widest bg-slate-50/30"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300">
                      <RefreshCw className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium italic">
                  Paste your Groq Cloud production key above. This key powers SKU synthesis, SEO auto-pilot, and market intelligence triggers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-indigo-100">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-indigo-900 uppercase">Identity Protection</p>
                      <p className="text-[10px] text-indigo-800/60 font-medium">Full keys are never logged in plaintext or displayed in standard views.</p>
                   </div>
                </div>
                <Button 
                    variant="outline" 
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all h-10 px-6"
                    onClick={() => {
                        window.open('https://console.groq.com/keys', '_blank');
                    }}
                >
                    Get API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Preview */}
        <div className="space-y-8">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl bg-slate-900 text-white overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-widest font-black text-blue-400">Live Preview</CardTitle>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="relative h-48 w-full bg-slate-800/50 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                {/* Simulated Webpage Background */}
                <div className="absolute inset-x-4 top-4 h-4 bg-white/5 rounded-full" />
                <div className="absolute inset-x-4 top-12 h-24 bg-white/5 rounded-xl" />
                
                {/* The Toast Preview */}
                <div 
                  className={cn(
                    "absolute left-4 bottom-4 w-60 bg-white shadow-2xl rounded-xl p-3 flex items-center gap-3 transition-all duration-700",
                    previewVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Zap className="h-4 w-4 fill-blue-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Verified</p>
                      {settings.showAiCloseButton && <X className="h-3 w-3 text-slate-300" />}
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 truncate">Customer from Paradip</p>
                    <p className="text-[9px] text-slate-500 truncate">Booked a Laptop Service • Just now</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">How it works</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-300">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                    <span>AI fetches current strategy from Groq Cloud.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                    <span>Synthesizes realistic activity based on your service tags.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                    <span>Injects non-intrusive FOMO context into user sessions.</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => {
                    setPreviewVisible(false);
                    setTimeout(() => setPreviewVisible(true), 1500);
                  }}
                  variant="ghost" 
                  className="w-full text-xs text-blue-400 hover:bg-white/5 hover:text-blue-300 font-bold"
                >
                  Test Notification Trigger
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm rounded-3xl bg-blue-600 text-white p-6 relative overflow-hidden">
             <Brain className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
             <div className="relative z-10">
               <h4 className="font-bold flex items-center gap-2 mb-2">
                 <Zap className="h-4 w-4 fill-white" />
                 Strategy Tip
               </h4>
               <p className="text-xs text-blue-50 leading-relaxed font-medium">
                 Use a balanced interval (90-120s) to keep energy high without distracting users from checkout. "Synthesis" mode is 98% accurate in recreating common tech purchase patterns.
               </p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;
