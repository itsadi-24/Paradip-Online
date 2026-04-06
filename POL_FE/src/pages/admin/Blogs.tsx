import { useState, useEffect, useRef, useMemo } from "react";
import { Upload, FileText, Loader2, Trash2, Star, MoreHorizontal, Eye, ExternalLink, Filter, Plus, Calendar, User, Clock as ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getBlogs, createBlog, deleteBlog, updateBlog, BlogPost } from "@/api/blogsApi";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Blogs = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // AI states
  const [isAIGenOpen, setIsAIGenOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tech Review");
  const [generating, setGenerating] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<BlogContent | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      featured: posts.filter(p => p.featured).length,
      categories: Array.from(new Set(posts.map(p => p.category))).length
    };
  }, [posts]);

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

  const handleToggleFeatured = async (post: BlogPost) => {
    const updatedPost = { ...post, featured: !post.featured };
    const { error } = await updateBlog(post.id, updatedPost);
    
    if (error) {
      toast({
        title: "Update Failed",
        description: error,
        variant: "destructive"
      });
    } else {
      setPosts(posts.map(p => p.id === post.id ? updatedPost : p));
      toast({
        title: "Status Updated",
        description: `"${post.title}" is now ${updatedPost.featured ? 'featured' : 'standard'} content.`
      });
    }
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
    <div className="space-y-8 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter">Editorial Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium italic flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            Centralized Intelligence & SEO Strategy Center.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-12 bg-slate-900 hover:bg-black shadow-xl rounded-xl px-8 font-black uppercase tracking-widest text-[10px] gap-2 transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                Dispatch New Content
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-2xl">
              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Source Selection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsAIGenOpen(true)} className="rounded-xl py-3 cursor-pointer group">
                <Sparkles className="h-4 w-4 mr-3 text-blue-500 group-hover:animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-tight">AI Auto-Pilot</span>
                  <span className="text-[10px] text-slate-400 italic">Synthesize from data</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-3 cursor-pointer group">
                <Upload className="h-4 w-4 mr-3 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-tight">Manual Dispatch</span>
                  <span className="text-[10px] text-slate-400 italic">Upload .md assets</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={fileInputRef} className="hidden" type="file" accept=".md" onChange={handleChange} />
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Insights</CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
              <FileText className="h-4 w-4 text-blue-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.total}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Active blog records committed</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Narrative</CardTitle>
            <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-500 transition-colors">
              <Star className="h-4 w-4 text-amber-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.featured}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">High-priority strategic posts</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Sectors</CardTitle>
            <div className="p-2 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-colors">
              <Filter className="h-4 w-4 text-purple-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.categories}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Distinct content categorizations</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 transition-all hover:bg-slate-50 hover:border-slate-300">
           <div className="flex items-center gap-2 mb-1">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Engine</span>
           </div>
           <p className="text-[10px] font-bold text-slate-600">SEO Auto-Indexing Active</p>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search publications by title or core narrative..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100">
              <SelectItem value="all" className="text-[10px] font-bold uppercase">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name} className="text-[10px] font-bold uppercase">{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => {setSearchQuery(""); setCategoryFilter("all");}}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Management Area */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="w-[100px] text-[9px] font-black uppercase tracking-widest text-slate-400 pl-8">Preview</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Publication Details</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sector</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Authority</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Featured</TableHead>
              <TableHead className="text-right text-[9px] font-black uppercase tracking-widest text-slate-400 pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileText className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No editorials found in current selection</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="pl-8">
                    <div className="h-12 w-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                      <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-md">
                      <span className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{post.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium line-clamp-1 italic mt-0.5">"{post.excerpt}"</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border-blue-100">
                      {post.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                         <User className="h-3 w-3 text-slate-400" /> {post.author}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                         <Calendar className="h-3 w-3" /> {post.date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleFeatured(post)}
                      className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        post.featured ? "text-amber-500 bg-amber-50" : "text-slate-200 hover:text-slate-400"
                      )}
                    >
                      <Star className={cn("h-4 w-4", post.featured && "fill-current")} />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-slate-100 shadow-xl">
                        <DropdownMenuItem className="rounded-lg py-2 group cursor-pointer">
                          <Eye className="h-4 w-4 mr-3 text-slate-400 group-hover:text-slate-900" />
                          <span className="text-[10px] font-bold uppercase">View Publication</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 group cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteClick(post)}>
                          <Trash2 className="h-4 w-4 mr-3" />
                          <span className="text-[10px] font-bold uppercase">Purge Record</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
