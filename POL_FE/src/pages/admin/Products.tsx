import { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Edit2, Trash2, MoreHorizontal, Loader2, Filter, 
  ArrowUpDown, Upload, X, GripVertical, RefreshCw, Package, 
  IndianRupee, Image, Info, Tags, ArrowRight, Eye, Globe, 
  ShoppingCart, Cpu, CheckCircle2, AlertTriangle, ExternalLink, 
  Calendar, Laptop, Star, TrendingUp, BarChart3, ShieldCheck, 
  Zap, Sparkles, AlertCircle, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "@/api/productsApi";
import { Product } from "@/data/products";
import { getCategories, Category } from "@/api/categoryApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { synthesizeSKU, syncMarketDiscovery } from "@/api/aiApi";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFormData {
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  images: string[];
  badge?: string;
  inStock: boolean;
  specs: string[];
  description: string;
}

const emptyFormData: ProductFormData = {
  name: "",
  category: "",
  price: 0,
  originalPrice: undefined,
  images: [],
  badge: "",
  inStock: true,
  specs: [],
  description: "",
};

const Products = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"category" | "price-low" | "price-high" | "status">("category");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [specsInput, setSpecsInput] = useState("");
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [syncCategory, setSyncCategory] = useState("all");
  const [syncSearchTerm, setSyncSearchTerm] = useState("");
  const [apiResetTime, setApiResetTime] = useState<Date | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  // AI Sync States
  const [syncMarketplace, setSyncMarketplace] = useState("Amazon");
  const [syncBrand, setSyncBrand] = useState("all");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [syncMinPrice, setSyncMinPrice] = useState<number | "">("");
  const [syncMaxPrice, setSyncMaxPrice] = useState<number | "">("");
  
  const [selectedSyncItems, setSelectedSyncItems] = useState<Set<string>>(new Set());

  const getBrandsByCategory = (category: string) => {
    const cat = category.toLowerCase();
    
    // Core Computing
    if (cat.includes("laptop")) return ["Apple", "HP", "Dell", "Lenovo", "ASUS", "Acer", "Samsung", "MSI", "Razer", "Gigabyte"];
    if (cat.includes("desktop") || cat.includes("pc")) return ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Alienware"];
    
    // Mobile & Personal Tech
    if (cat.includes("mobile") || cat.includes("phone") || cat.includes("smartphone")) return ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Realme", "Vivo", "Oppo", "Nothing", "Motorola"];
    if (cat.includes("audio") || cat.includes("headphone") || cat.includes("speaker") || cat.includes("earbud")) return ["Sony", "Bose", "Sennheiser", "JBL", "Boat", "pTron", "Marshall", "Audio-Technica", "Apple", "Samsung"];
    
    // Imaging & Printing
    if (cat.includes("printer") || cat.includes("scanner") || cat.includes("copier")) return ["HP", "Epson", "Canon", "Brother", "Samsung", "Xerox", "Pantum", "Kyocera", "Lexmark", "Ricoh"];
    
    // Displays
    if (cat.includes("monitor") || cat.includes("display") || cat.includes("tv")) return ["Samsung", "LG", "Dell", "HP", "ASUS", "Acer", "BenQ", "MSI", "ViewSonic", "Gigabyte", "Sony"];
    
    // Internal Components
    if (cat.includes("component") || cat.includes("processor") || cat.includes("gpu") || cat.includes("ram") || cat.includes("storage") || cat.includes("motherboard")) return ["Intel", "AMD", "NVIDIA", "ASUS", "MSI", "Gigabyte", "Corsair", "Kingston", "Western Digital", "Samsung", "Crucial", "Seagate", "TP-Link"];
    
    // Networking
    if (cat.includes("net") || cat.includes("router") || cat.includes("wifi") || cat.includes("switch")) return ["TP-Link", "D-Link", "Netgear", "Linksys", "Tenda", "Asus", "Xiaomi", "Ubiquiti", "Cisco", "Mercusys"];
    
    // Peripherals
    if (cat.includes("acc") || cat.includes("peripheral") || cat.includes("mouse") || cat.includes("keyboard") || cat.includes("gaming")) return ["Logitech", "Razer", "Corsair", "SteelSeries", "Redgear", "HP", "Dell", "Lenovo", "Apple", "Ant Esports", "Zebronics"];
    
    // General Electronics fallback
    if (cat.includes("electronics")) return ["Samsung", "LG", "Sony", "Panasonic", "Philips", "Bajaj", "Havells"];

    return ["Generic", "Premium", "Global", "Imported"];
  };

  const [resetTimerStr, setResetTimerStr] = useState("");

  useEffect(() => {
    if (!apiResetTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = apiResetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setResetTimerStr("Available Now");
        setSyncStatus("idle");
        setApiResetTime(null);
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setResetTimerStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [apiResetTime]);

  // AI Brand Discovery Effect
  useEffect(() => {
    const fetchAIBrands = async () => {
      if (!isSyncModalOpen) return;
      try {
        const response = await fetch(`/api/ai/brands?category=${syncCategory}`);
        const data = await response.json();
        setAvailableBrands(data.brands || []);
      } catch (error) {
        setAvailableBrands(["HP", "Dell", "Lenovo", "Apple", "ASUS", "Acer"]);
      }
    };
    fetchAIBrands();
  }, [syncCategory, isSyncModalOpen]);

  const openExternalSource = (sourceName: string, productName?: string) => {
    // If a specific product name is provided, we prioritize it for an exact match.
    // Otherwise, we fallback to our holistic category/brand/search filter strategy.
    const searchTerm = productName || `${syncSearchTerm} ${syncCategory === 'all' ? '' : syncCategory} ${syncBrand !== 'all' ? syncBrand : ''}`.trim();
    const query = encodeURIComponent(searchTerm);
    let url = "";
    
    switch(sourceName) {
      case "Amazon":
        url = `https://www.amazon.in/s?k=${query}`;
        break;
      case "Flipkart":
        url = `https://www.flipkart.com/search?q=${query}`;
        break;
      case "Google Shopping":
        url = `https://www.google.com/search?q=${query}&tbm=shop`;
        break;
      case "Bing Search":
        url = `https://www.bing.com/search?q=${query}`;
        break;
      case "Reliance Digital":
        url = `https://www.reliancedigital.in/search?q=${query}`;
        break;
      case "Croma":
        url = `https://www.croma.com/searchB?q=${query}`;
        break;
      case "eBay Global":
        url = `https://www.ebay.com/sch/i.html?_nkw=${query}`;
        break;
      case "Walmart API":
        url = `https://www.walmart.com/search?q=${query}`;
        break;
      default:
        url = `https://www.google.com/search?q=${query}`;
    }
    
    window.open(url, '_blank');
  };

  const handleSyncMarketplaceData = async () => {
    setIsSyncingLive(true);
    setSyncStatus("loading");
    setSyncResults([]);
    setSelectedSyncItems(new Set());
    
    try {
      const response = await fetch('/api/ai/sync-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplace: syncMarketplace,
          category: syncCategory,
          brand: syncBrand,
          searchTerm: syncSearchTerm,
          minPrice: syncMinPrice,
          maxPrice: syncMaxPrice
        })
      });

      if (!response.ok) {
        throw new Error("AI Sync failed. Please check your Groq API Key.");
      }

      const data = await response.json();
      
      // Transform AI results into the internal product format
      const formattedResults = (data.results || []).map((p: any, i: number) => ({
        id: `ai_${Date.now()}_${i}`,
        ...p,
        images: p.images || [`https://images.unsplash.com/photo-1517336714460-4c70d30c0429?auto=format&fit=crop&w=400&q=80`], // Fallback image
        source: syncMarketplace,
        rating: p.rating || 4.5,
        reviews: p.reviews || 120,
        margin: p.margin || 18,
        category: p.category || syncCategory
      }));

      setSyncResults(formattedResults);
      setSyncStatus("success");
    } catch (error) {
      console.error("AI Sync Error:", error);
      setSyncStatus("error");
      const resetTime = new Date();
      resetTime.setMinutes(resetTime.getMinutes() + 30);
      setApiResetTime(resetTime);
    } finally {
      setIsSyncingLive(false);
    }
  };

  const toggleSyncItemSelection = (id: string) => {
    setSelectedSyncItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleKeepSelected = async () => {
    const itemsToImport = syncResults.filter(p => selectedSyncItems.size === 0 || selectedSyncItems.has(p.id));
    if (itemsToImport.length === 0) return;

    setSaving(true);
    let successCount = 0;

    for (const product of itemsToImport) {
      try {
        const productData: Omit<Product, "id"> = {
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.mrp,
          images: product.images,
          description: product.description,
          specs: product.specs,
          inStock: true,
          source: product.source,
          importedAt: new Date().toISOString()
        };
        await createProduct(productData);
        successCount++;
      } catch (err) {
        console.error("Import failed for", product.name);
      }
    }

    if (successCount > 0) {
      toast({ 
        title: "Batch Import Complete", 
        description: `Successfully added ${successCount} products to inventory.`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-900"
      });
      setSyncResults(prev => prev.filter(p => !selectedSyncItems.has(p.id)));
      setSelectedSyncItems(new Set());
      loadData();
    }
    setSaving(false);
  };

  const handleKeepProduct = async (product: any) => {
    try {
      const productData: Omit<Product, "id"> = {
        name: product.name,
        category: product.category,
        price: product.price,
        images: product.images,
        description: product.description,
        specs: product.specs,
        inStock: true,
        source: product.source,
        importedAt: new Date().toISOString()
      };

      const { error } = await createProduct(productData);
      if (error) throw new Error(error);

      toast({ 
        title: "Product Imported", 
        description: `"${product.name}" added to your inventory.`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-900"
      });
      
      // Remove from sync results
      setSyncResults(prev => prev.filter(p => p.id !== product.id));
      loadData();
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleIgnoreProduct = (productId: string) => {
    setSyncResults(prev => prev.filter(p => p.id !== productId));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Fetch products
    const { data: prodData, error: prodError } = await getProducts();
    if (prodError) {
      toast({ title: "Error", description: prodError, variant: "destructive" });
    } else if (prodData) {
      setProducts(prodData);
    }

    // Fetch categories for Sales
    const { data: catData, error: catError } = await getCategories("Sales", true);
    if (catError) {
      toast({ title: "Error fetching categories", description: catError, variant: "destructive" });
    } else if (catData) {
      setCategories(catData);
      if (catData.length > 0 && emptyFormData.category === "") {
        emptyFormData.category = catData[0].name;
      }
    }

    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "category":
        return a.category.localeCompare(b.category);
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "status":
        const statusOrder = { true: 1, false: 0 };
        return (statusOrder[String(b.inStock) as "true" | "false"] || 0) - (statusOrder[String(a.inStock) as "true" | "false"] || 0);
      default:
        return 0;
    }
  });

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({ ...emptyFormData });
    setSpecsInput("");
    setNewImageFiles([]);
    setImagePreviewUrls([]);
    setIsDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images || [],
      badge: product.badge || "",
      inStock: product.inStock ?? true,
      specs: product.specs || [],
      description: product.description,
    });
    setSpecsInput(product.specs?.join(", ") || "");
    setNewImageFiles([]);
    setImagePreviewUrls([]);
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = formData.images.length + newImageFiles.length + files.length;

    if (totalImages > 5) {
      toast({
        title: "Too many images",
        description: "A product can have at most 5 images",
        variant: "destructive",
      });
      return;
    }

    // Create preview URLs for new files
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setNewImageFiles((prev) => [...prev, ...files]);
    setImagePreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= formData.images.length) return;

    setFormData((prev) => {
      const newImages = [...prev.images];
      [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
      return { ...prev, images: newImages };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const specsArray = specsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const productData: Omit<Product, "id"> = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      images: formData.images,
      badge: formData.badge || undefined,
      inStock: formData.inStock,
      specs: specsArray,
      description: formData.description,
    };

    if (editingProduct) {
      const { error } = await updateProduct(
        editingProduct.id,
        { ...productData, id: editingProduct.id } as Product,
        newImageFiles.length > 0 ? newImageFiles : undefined
      );
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Product updated", description: `"${productData.name}" has been updated.` });
        loadData();
      }
    } else {
      const { error } = await createProduct(
        productData,
        newImageFiles.length > 0 ? newImageFiles : undefined
      );
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Product added", description: `"${productData.name}" has been added.` });
        loadData();
      }
    }

    setSaving(false);
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
    setNewImageFiles([]);
    setImagePreviewUrls([]);
  };

  const handleDelete = async (id: number | string) => {
    const { error } = await deleteProduct(id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Product deleted", description: "The product has been removed.", variant: "destructive" });
      loadData();
    }
  };

  const handleAISynthesize = async () => {
    if (!formData.name) {
      toast({ title: "Reference Required", description: "Please enter a product title first.", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    const { data, error } = await synthesizeSKU(formData.name);
    if (error) {
      toast({ title: "Synthesis Failed", description: error, variant: "destructive" });
    } else if (data) {
      setFormData(prev => ({ ...prev, description: data.description }));
      setSpecsInput(data.specs.join(", "));
      toast({ title: "Intelligence Synthesized", description: `"${formData.name}" description and specs have been optimized.` });
    }
    setSaving(false);
  };

  // Get primary image for display
  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || "https://via.placeholder.com/80";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalImagesCount = formData.images.length + newImageFiles.length;
  const canAddMoreImages = totalImagesCount < 5;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory ({products.length} items)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 gap-3 px-6 font-black uppercase tracking-widest text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100 hover:bg-indigo-100 transition-all active:scale-95" onClick={() => setIsSyncModalOpen(true)}>
            <Sparkles className="h-4 w-4" />
            AI Market Discovery
          </Button>
          <Button className="gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "category" | "price-low" | "price-high" | "status") => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Sort by Category</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TooltipProvider>
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary">
                      <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 group">
                      <div className="line-clamp-1 max-w-[280px]" title={product.name}>{product.name}</div>
                      {product.importedAt && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help p-1 bg-blue-50 rounded-full text-blue-600 transition-colors hover:bg-blue-100">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-3 rounded-xl border-blue-100 shadow-xl bg-white text-slate-900 border max-w-xs">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 border-b border-blue-50 pb-1">
                                <RefreshCw className="h-3 w-3" /> Market Intelligence Data
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-bold uppercase tracking-tighter">Sourced From</span>
                                  <span className="font-bold text-blue-700">{product.source}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-bold uppercase tracking-tighter">Import Cycle</span>
                                  <span className="font-medium text-slate-600">{format(new Date(product.importedAt), 'MMM dd, yyyy · HH:mm')}</span>
                                </div>
                              </div>
                              <div className="pt-1 text-[9px] italic text-slate-400 font-medium">
                                Direct sync with platform pricing and metadata.
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{product.category}</TableCell>
                  <TableCell>₹{product.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.images?.length || 0} / 5</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.inStock ? "default" : "destructive"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => handleViewProduct(product)}
                        title="Quick Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">Intelligence Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewProduct(product)} className="py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(product)} className="py-2.5 px-3 focus:bg-slate-50 cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Record
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive py-2.5 px-3 focus:text-destructive focus:bg-destructive/5 cursor-pointer" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No products found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {editingProduct ? "Refine Product Record" : "New Market Entry"}
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">
                  {editingProduct ? "Update your product details for optimal conversion." : "Create a premium listing for your store inventory."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Title *</Label>
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAISynthesize}
                        disabled={saving || !formData.name}
                        className="h-6 px-2 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                    >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Synthesize
                    </Button>
                </div>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange("name", e.target.value)} 
                  placeholder="e.g., HP Pavilion 15 Laptop" 
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Mapping *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="h-11 border-slate-200 rounded-xl font-medium bg-slate-50/50">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.length === 0 && <SelectItem value="loading" disabled>Loading categories...</SelectItem>}
                    {categories.map((cat) => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Marketing Badge</Label>
                <Input 
                  id="badge" 
                  value={formData.badge || ""} 
                  onChange={(e) => handleInputChange("badge", e.target.value)} 
                  placeholder="e.g., Best Seller" 
                  className="h-11 border-slate-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selling Price (INR) *</Label>
                <div className="relative">
                  <Input 
                    id="price" 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => handleInputChange("price", e.target.value)} 
                    className="pl-8 h-11 border-slate-200 rounded-xl font-bold focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">MRP Value (INR)</Label>
                <div className="relative">
                  <Input 
                    id="originalPrice" 
                    type="number" 
                    value={formData.originalPrice || ""} 
                    onChange={(e) => handleInputChange("originalPrice", e.target.value || undefined)} 
                    placeholder="Market price" 
                    className="pl-8 h-11 border-slate-200 rounded-xl text-slate-500 italic bg-slate-50/50" 
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-[2rem] space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Visual Assets ({totalImagesCount}/5)</span>
                </div>
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest bg-blue-100/50 px-2 py-0.5 rounded-full border border-blue-200">Recommended: 4:5 Aspect</span>
              </div>
              
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {totalImagesCount > 0 ? (
                  <div className="grid grid-cols-5 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group aspect-[4/5] rounded-[1.2rem] overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                        <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                            <GripVertical className="h-3 w-3" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => removeExistingImage(index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {index === 0 && <div className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-md">Base</div>}
                      </div>
                    ))}
                    {imagePreviewUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative group aspect-[4/5] rounded-[1.2rem] overflow-hidden border border-dashed border-blue-300 bg-blue-50/20">
                        <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-red-600 bg-white/50 backdrop-blur-sm rounded-full" onClick={() => removeNewImage(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Draft</div>
                      </div>
                    ))}
                    {canAddMoreImages && (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/5] rounded-[1.2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:bg-white hover:border-blue-400 transition-all text-slate-400 group/add"
                      >
                        <Plus className="h-6 w-6 mb-1 text-slate-300 group-hover/add:text-blue-500 transition-colors" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Upload</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer hover:bg-white hover:border-blue-400 transition-all group/upload bg-white/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-3 text-slate-300 group-hover/upload:text-blue-500 transition-colors" />
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Select Visual Assets</p>
                    <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-tighter">Max 5 Images • JPEG/PNG/WEBP • 4:5 Preferred</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="specs" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Standard Technical Specs</Label>
                <Input 
                  id="specs" 
                  value={specsInput} 
                  onChange={(e) => setSpecsInput(e.target.value)} 
                  placeholder="e.g. 16GB RAM, 512GB SSD, Windows 11" 
                  className="h-11 border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Executive Narrative *</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange("description", e.target.value)} 
                  rows={4} 
                  placeholder="Define the strategic value proposition of this product..." 
                  className="resize-none border-slate-200 rounded-xl focus:border-blue-500 p-4"
                />
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 border rounded-3xl">
                <div className="space-y-0.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-800">Operational Status</Label>
                  <p className="text-[10px] text-slate-400 font-medium italic">Active availability on digital storefront</p>
                </div>
                <Switch checked={formData.inStock} onCheckedChange={(checked) => handleInputChange("inStock", checked)} className="data-[state=checked]:bg-blue-600 shadow-sm" />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-8 h-12 font-bold flex-1 border-slate-200">
              Discard
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name || !formData.price || !formData.description || saving}
              className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-xl px-12 h-12 font-black uppercase tracking-widest flex-1"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? "Update Entry" : "Commit Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Results Modal - Compact & Minimal Redesign */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden rounded-[2rem] p-0 border border-slate-800/20 shadow-2xl flex flex-col bg-white">
          <DialogHeader className="bg-blue-600 text-white p-6 shrink-0 relative overflow-hidden">
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-3 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                <RefreshCw className={`h-6 w-6 text-indigo-400 ${syncStatus === "loading" ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                    <DialogTitle className="text-lg font-black tracking-tight uppercase">Market Discovery Command</DialogTitle>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[8px] font-black tracking-[0.2em] px-1.5 h-4">ENGINE v3.3</Badge>
                </div>
                <DialogDescription className="text-slate-500 font-medium mt-0.5 text-[11px] max-w-lg">
                  {syncStatus === 'loading' ? (
                    <span className="flex items-center gap-2">
                       <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> 
                       Sourcing intelligent data from {syncMarketplace}...
                    </span>
                  ) : (
                    "High-frequency retail reconnaissance and strategic demand modeling active."
                  )}
                </DialogDescription>
              </div>
              <div className="hidden md:flex flex-col items-end gap-0.5 px-4 border-l border-white/5">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Status</span>
                 <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Operational</span>
                 </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {/* High-Density Recon Parameters */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200/50 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Ecosystem</Label>
                  <Select value={syncMarketplace} onValueChange={setSyncMarketplace}>
                    <SelectTrigger className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-bold text-slate-700 text-xs shadow-none">
                      <SelectValue placeholder="Marketplace" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="Amazon" className="text-xs">Amazon.in (India)</SelectItem>
                      <SelectItem value="Flipkart" className="text-xs">Flipkart.com (India)</SelectItem>
                      <SelectItem value="Reliance Digital" className="text-xs">Reliance Digital</SelectItem>
                      <SelectItem value="Croma" className="text-xs">Croma (Tata)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Sector</Label>
                  <Select value={syncCategory} onValueChange={setSyncCategory}>
                    <SelectTrigger className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-bold text-slate-700 text-xs shadow-none">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="all" className="text-xs">Omni-Trends</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name} className="text-xs">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Authority Tracker</Label>
                  <Select value={syncBrand} onValueChange={setSyncBrand}>
                    <SelectTrigger className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-bold text-slate-700 text-xs shadow-none">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 max-h-[250px]">
                      <SelectItem value="all" className="text-xs font-bold text-indigo-600">All Leaders</SelectItem>
                      {availableBrands.map((b) => (
                        <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Custom Recon</Label>
                  <div className="relative">
                    <Input 
                      value={syncSearchTerm}
                      onChange={(e) => setSyncSearchTerm(e.target.value)}
                      placeholder="Models..." 
                      className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-bold text-xs pr-8 shadow-none"
                    />
                    <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-300" />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Threshold (INR)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                        type="number"
                        value={syncMinPrice}
                        onChange={(e) => setSyncMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="MIN" 
                        className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-black p-2 text-center text-xs shadow-none"
                    />
                    <span className="text-slate-300 text-[10px]">—</span>
                    <Input 
                        type="number"
                        value={syncMaxPrice}
                        onChange={(e) => setSyncMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="MAX" 
                        className="h-9 border-slate-200 bg-slate-50/30 rounded-lg font-black p-2 text-center text-xs shadow-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-8">
                    <Button 
                        onClick={handleSyncMarketplaceData}
                        disabled={syncStatus === 'loading'}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                    {syncStatus === 'loading' ? (
                        <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> SCANNING MARKET...
                        </>
                    ) : (
                        <>
                        <Sparkles className="h-3.5 w-3.5" /> INITIALIZE DISCOVERY
                        </>
                    )}
                    </Button>
                </div>
              </div>
            </div>

            {/* Tactical Intelligence Stream - Compact Horizontal Layout */}
            {syncStatus === "success" && syncResults.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Extracts ({syncResults.length})</h4>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">Sorted by AI Confidence</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {syncResults.map((product) => (
                            <Card key={product.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 bg-white">
                                <div className="flex items-center p-4 gap-5">
                                    {/* Intelligence Identity (Dynamic Image) */}
                                    <div className="h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50 shadow-inner group">
                                        <img 
                                          src={`https://images.unsplash.com/featured/?${encodeURIComponent(product.brand || '')},${encodeURIComponent(product.name || 'tech')},${encodeURIComponent(product.category || 'gadget')}`} 
                                          alt={product.name} 
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80`;
                                          }}
                                        />
                                    </div>

                                    {/* Intelligence Details (Center Column) */}
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-sm font-black text-slate-800 truncate leading-none mb-1">{product.name}</h3>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {product.specs?.slice(0, 3).map((spec, i) => (
                                                            <span key={i} className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                        {product.name && (
                                                            <a 
                                                                href={
                                                                    product.sourceUrl && product.sourceUrl.startsWith('http') && !product.sourceUrl.includes('REAL_MARKETPLACE') 
                                                                    ? product.sourceUrl 
                                                                    : syncMarketplace === 'Amazon' 
                                                                        ? `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`
                                                                        : syncMarketplace === 'Flipkart'
                                                                            ? `https://www.flipkart.com/search?q=${encodeURIComponent(product.name)}`
                                                                            : `https://www.google.com/search?q=${encodeURIComponent(product.brand + ' ' + product.name + ' ' + syncMarketplace)}`
                                                                }
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-[8px] font-black text-blue-600 uppercase hover:underline flex items-center gap-0.5 ml-1"
                                                            >
                                                                <ExternalLink className="h-2 w-2" /> View on {syncMarketplace}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-indigo-600">₹{product.price?.toLocaleString()}</p>
                                                    <p className="text-[8px] font-bold text-slate-300 line-through">₹{product.mrp?.toLocaleString()}</p>
                                                </div>
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black h-5">
                                                    {product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 15}% OFF
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 mb-2">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Confidence:</span>
                                                <span className="text-[10px] font-bold text-slate-600">{product.confidence || '96.2'}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Demand:</span>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase">{product.demand || 'High'}</span>
                                            </div>
                                            {product.isUpcoming && (
                                                <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase h-4">Projected Trend</Badge>
                                            )}
                                        </div>

                                        {/* Deployment Rationale (Compact) */}
                                        <div className="flex items-start gap-2 max-w-2xl">
                                            <ShieldCheck className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                                            <p className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-1 italic">
                                                "{product.aiInsights || 'Strategic recommendation based on regional consumption and inventory velocity trends.'}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Vector (Right Column) */}
                                    <div className="flex items-center gap-2 shrink-0 border-l border-slate-100 pl-5 ml-2">
                                        <Button 
                                            onClick={() => handleKeepProduct(product)}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 h-9 font-black uppercase text-[9px] tracking-widest transition-all shadow-sm"
                                        >
                                            Enlist
                                        </Button>
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleIgnoreProduct(product.id)}
                                            className="text-slate-400 hover:text-rose-500 h-9 w-9 p-0 rounded-lg transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {syncStatus === "error" && (
                <div className="text-center py-20 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-rose-900 uppercase tracking-widest">Market Access Denied</h3>
                    <p className="text-sm text-rose-700 max-w-xs mx-auto mt-2">Could not authenticate with Groq API. Please verify your API Key in Settings.</p>
                </div>
            )}
          </div>

          {(syncStatus === "success" || syncStatus === "error") && (
            <div className="p-6 bg-blue-50/50 border-t border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
              
              <div className="flex items-center gap-3 relative z-10">
                 <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-900">System Integrity Verified</span>
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Secure Intelligence Tunnel Active</span>
                 </div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <Button variant="ghost" onClick={() => setIsSyncModalOpen(false)} className="rounded-xl px-6 h-10 font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </Button>
                {syncResults.length > 0 && (
                  <Button 
                    onClick={handleKeepSelected} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 rounded-xl px-10 h-11 font-black uppercase tracking-[0.1em] text-[10px] text-white transition-all hover:scale-105 active:scale-95 border-t border-white/20"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 text-blue-100" />}
                    Commit Intelligence
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Quick View Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] p-0 border-0 shadow-2xl flex flex-col">
          {viewingProduct && (
            <>
              <DialogHeader className="bg-slate-900 text-white p-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{viewingProduct.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] font-black border-white/20 text-white/60 uppercase tracking-widest">{viewingProduct.category}</Badge>
                        {viewingProduct.badge && (
                          <Badge className="bg-amber-500 text-white text-[9px] font-black border-none px-2 h-5 tracking-widest uppercase">{viewingProduct.badge}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Market Valuation</p>
                    <p className="text-2xl font-black text-white">₹{viewingProduct.price.toLocaleString()}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Visual Showcase */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl bg-slate-50">
                      <img 
                        src={viewingProduct.images?.[0] || viewingProduct.image} 
                        alt={viewingProduct.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {viewingProduct.images && viewingProduct.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-3">
                        {viewingProduct.images.slice(1).map((img, i) => (
                          <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Strategic Intelligence */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Executive Narrative</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-5 rounded-3xl border border-slate-100 italic">
                            "{viewingProduct.description}"
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Technical Specifications</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {viewingProduct.specs?.map((spec, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{spec}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Stock Status</p>
                             <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${viewingProduct.inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                                    {viewingProduct.inStock ? 'Active Inventory' : 'Depleted'}
                                </span>
                             </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pricing Strategy</p>
                             <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                                    {viewingProduct.originalPrice ? `${Math.round(((viewingProduct.originalPrice - viewingProduct.price) / viewingProduct.originalPrice) * 100)}% Discount` : 'Market Standard'}
                                </span>
                             </div>
                        </div>
                    </div>
                  </div>
                </div>

                {viewingProduct.importedAt && (
                   <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.1em]">Intelligence Trail</h4>
                                <p className="text-xs text-blue-800/70 font-bold mt-0.5">Sourced from <span className="underline">{viewingProduct.source}</span> Ecosystem</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-blue-400 uppercase">Synchronization Timestamp</p>
                            <p className="text-xs font-bold text-blue-900">{format(new Date(viewingProduct.importedAt), 'MMM dd, yyyy · HH:mm:ss')}</p>
                        </div>
                   </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authenticated Product Record View</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="rounded-xl px-8 font-bold border-slate-200 bg-white uppercase tracking-widest text-[10px]">
                    Dismiss Preview
                  </Button>
                  <Button onClick={() => { setIsViewDialogOpen(false); openEditDialog(viewingProduct); }} className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-xl px-10 h-11 font-black uppercase tracking-widest text-[10px] text-white">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Enter Edit Mode
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
