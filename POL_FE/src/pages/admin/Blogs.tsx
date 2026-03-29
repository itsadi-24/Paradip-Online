import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { getBlogs, createBlog, deleteBlog, BlogPost } from "@/api/blogsApi";
import { getCategories, Category } from "@/api/categoryApi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generateBlog, BlogContent } from "@/api/aiApi";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, PenTool, Globe, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Blogs = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // AI states
  const [isAIGenOpen, setIsAIGenOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tech Review");
  const [generating, setGenerating] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<BlogContent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load blogs
    const { data: blogData, error: blogError } = await getBlogs();
    if (blogError) {
      toast({ title: "Error", description: blogError, variant: "destructive" });
    } else if (blogData) {
      setPosts(blogData);
    }

    // Load blog categories
    const { data: catData } = await getCategories("Blog", true);
    if (catData) {
      setCategories(catData);
    }

    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".md")) {
      toast({ title: "Invalid file type", description: "Please upload a Markdown (.md) file.", variant: "destructive" });
      return;
    }

    const text = await file.text();
    const title = file.name.replace(".md", "").replace(/-/g, " ");
    const preview = text.slice(0, 150) + "...";

    const newPost: Omit<BlogPost, "id"> = {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      excerpt: preview,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: `${Math.max(1, Math.ceil(text.split(" ").length / 200))} min read`,
      image: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=800&q=80",
      category: categories.length > 0 ? categories[0].name : "Tech",
      slug: file.name.replace(".md", ""),
      author: "Admin",
      contentPath: `/blogs/${file.name}`,
    };

    const { error } = await createBlog(newPost);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Blog post uploaded", description: `"${file.name}" has been added.` });
      // Reload everything
      loadData();
    }
  };

  const handleDeleteClick = (post: BlogPost) => {
    setDeletingPost(post);
    setIsDeleteDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    if (!topic) {
        toast({ title: "Topic Required", description: "Please enter a refined topic for analysis.", variant: "destructive" });
        return;
    }
    setGenerating(true);
    const { data, error } = await generateBlog(topic, selectedCategory);
    if (error) {
        toast({ title: "Intelligence Failure", description: error, variant: "destructive" });
    } else if (data) {
        setGeneratedBlog(data);
        toast({ title: "Success", description: "SEO Content synthesized successfully." });
    }
    setGenerating(false);
  };

  const handleCommitBlog = async () => {
    if (!generatedBlog) return;
    setGenerating(true);
    
    const newPost: Omit<BlogPost, "id"> = {
      title: generatedBlog.title,
      excerpt: generatedBlog.excerpt,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      category: selectedCategory,
      slug: generatedBlog.title.toLowerCase().replace(/ /g, "-"),
      author: "Antigravity AI",
      contentPath: `/blogs/${generatedBlog.title.toLowerCase().replace(/ /g, "-")}.md`,
    };

    const { data, error } = await createBlog(newPost);
    if (error) {
        toast({ title: "Commit Failed", description: error, variant: "destructive" });
    } else {
        toast({ title: "Record Committed", description: `"${generatedBlog.title}" is now active in the ecosystem.` });
        setIsAIGenOpen(false);
        setGeneratedBlog(null);
        setTopic("");
        loadData();
    }
    setGenerating(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPost) return;
    const { error } = await deleteBlog(deletingPost.id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Post deleted", description: "The blog post has been removed.", variant: "destructive" });
      loadData();
    }
    setIsDeleteDialogOpen(false);
    setDeletingPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent uppercase tracking-tight">Editorial Hub</h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Command Center for Paradip's Digital Narrative & SEO Dominance.
          </p>
        </div>
        <Button 
            onClick={() => setIsAIGenOpen(true)}
            className="h-12 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-xl px-8 font-black uppercase tracking-widest text-[10px] gap-2 border-t border-white/20 transition-all hover:scale-105"
        >
            <Sparkles className="h-4 w-4" />
            AI Auto-Pilot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card
            className={cn(
              "border-2 border-dashed transition-all duration-300 h-[320px] flex flex-col items-center justify-center text-center p-8 cursor-pointer rounded-[2.5rem] bg-white shadow-sm hover:shadow-md",
              dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} className="hidden" type="file" accept=".md" onChange={handleChange} />
            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-2">Manual Dispatch</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-4 px-4 leading-relaxed line-clamp-2">Drop optimized .md files for direct distribution</p>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold uppercase text-[9px] tracking-widest px-6">Select Assets</Button>
          </Card>
          
          <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-slate-200 border border-slate-800">
             <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Global Reach Metrics</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase">Active Index</p>
                   <p className="text-lg font-black">{posts.length}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase">Avg Depth</p>
                   <p className="text-lg font-black">1.2k words</p>
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Published Intelligence</h3>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live RSS Feed Active</span>
            </div>
          </div>
          
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No editorials found in current index</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group rounded-[2rem] bg-white">
                  <CardContent className="p-0 flex flex-col sm:flex-row h-full">
                    <div className="sm:w-64 h-56 sm:h-auto overflow-hidden">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-600 border-blue-100">{post.category}</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{post.date}</span>
                      </div>
                      <h4 className="font-black text-lg text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{post.title}</h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6 flex-1 leading-relaxed italic">"{post.excerpt}"</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                              <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />{post.readTime}
                            </span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                              <PenTool className="h-3.5 w-3.5 mr-1.5 text-blue-500" />{post.author}
                            </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          onClick={() => handleDeleteClick(post)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Purge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Auto-Pilot Dialog */}
      <Dialog open={isAIGenOpen} onOpenChange={setIsAIGenOpen}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-[2.5rem] p-0 border-0 shadow-2xl flex flex-col bg-slate-50">
          <DialogHeader className="bg-blue-600 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">SEO Auto-Pilot</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium text-xs mt-1">
                  Synthesize premium technical reviews and market analyses for the Paradip ecosystem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            {!generatedBlog ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Analysis Focus / Topic</Label>
                        <div className="relative">
                            <Input 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Top 5 Best Value Laptops for Port Workers in Paradip..."
                                className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-blue-500 font-bold text-slate-700 shadow-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {["Tech Review", "Buyer's Guide", "Market Update", "Local News"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                                    selectedCategory === cat 
                                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-lg shadow-blue-100" 
                                        : "border-white bg-white text-slate-400 hover:border-slate-200"
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                                {selectedCategory === cat && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                            </button>
                        ))}
                    </div>

                    <Button 
                        onClick={handleAIGenerate} 
                        disabled={generating || !topic}
                        className="w-full h-14 bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl transition-all active:scale-95"
                    >
                        {generating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2" />}
                        Initiate AI Synthesis
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-xl space-y-4">
                         <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3">Synthesis Complete</Badge>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{selectedCategory}</span>
                         </div>
                         <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{generatedBlog.title}</h3>
                         <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{generatedBlog.excerpt}"</p>
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setGeneratedBlog(null)}
                            className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-slate-200"
                        >
                            Reset Focus
                        </Button>
                        <Button 
                            onClick={handleCommitBlog}
                            disabled={generating}
                            className="flex-3 w-2/3 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100"
                        >
                            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PenTool className="h-4 w-4 mr-2" />}
                            Commit to Editorial Calendar
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Purge Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently delete <span className="text-slate-900 font-black">"{deletingPost?.title}"</span>. This strategic narrative cannot be recovered once purged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] border-slate-200 h-11 px-6">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-8">
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Blogs;
