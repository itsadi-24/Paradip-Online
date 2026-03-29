import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Wrench, Monitor, Cpu, Truck, HardDrive, Network, ArrowUp, ArrowDown, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServices, createService, updateService, patchService, deleteService, type Service } from '@/api/servicesApi';
import { getCategories, type Category } from '@/api/categoryApi';

const iconOptions = [
  { value: 'Wrench', label: 'Wrench', icon: Wrench },
  { value: 'Monitor', label: 'Monitor', icon: Monitor },
  { value: 'Cpu', label: 'CPU', icon: Cpu },
  { value: 'Truck', label: 'Truck', icon: Truck },
  { value: 'HardDrive', label: 'Hard Drive', icon: HardDrive },
  { value: 'Network', label: 'Network', icon: Network },
];

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];

type OmittedServiceFields = 'id' | 'createdAt' | 'updatedAt';

type ServiceFormData = {
  title: string;
  description: string;
  icon: string;
  features: string[];
  price: string;
  color: string;
  image?: string;
  detailedDescription?: string;
  category?: string;
  popular: boolean;
  order: number;
  enabled: boolean;
};

const ServicesManagement = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    icon: 'Wrench',
    features: ['', '', '', ''],
    price: '',
    color: 'blue',
    image: '',
    detailedDescription: '',
    popular: false,
    order: 1,
    enabled: true,
    category: 'General',
  });

  const fetchData = async () => {
    setLoading(true);
    // Fetch Services
    const { data: serviceData, error: serviceError } = await getServices();
    if (serviceData && !serviceError) {
      setServices(serviceData.sort((a, b) => a.order - b.order));
    }
    // Fetch Categories
    const { data: catData } = await getCategories('Service', true);
    if (catData) {
      setCategories(catData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'Wrench',
      features: ['', '', '', ''],
      price: '',
      color: 'blue',
      image: '',
      detailedDescription: '',
      popular: false,
      order: services.length + 1,
      enabled: true,
      category: categories.length > 0 ? categories[0].name : 'General',
    });
    setEditingService(null);
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        description: service.description,
        icon: service.icon,
        features: service.features,
        price: service.price,
        color: service.color,
        image: service.image || '',
        detailedDescription: service.detailedDescription || '',
        popular: service.popular,
        order: service.order,
        enabled: service.enabled,
        category: service.category || 'General',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingService) {
        await updateService(editingService.id, formData);
        toast({
          title: 'Service Updated',
          description: 'Service has been updated successfully',
        });
      } else {
        await createService(formData);
        toast({
          title: 'Service Created',
          description: 'New service has been created successfully',
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save service',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      await deleteService(deletingService.id);
      toast({
        title: 'Service Deleted',
        description: 'Service has been deleted successfully',
      });
      await fetchData();
      setIsDeleteDialogOpen(false);
      setDeletingService(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (service: Service) => {
    try {
      await patchService(service.id, { enabled: !service.enabled });
      await fetchData();
      toast({
        title: 'Service Updated',
        description: `Service ${service.enabled ? 'disabled' : 'enabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const handleMoveOrder = async (service: Service, direction: 'up' | 'down') => {
    const currentIndex = services.findIndex(s => s.id === service.id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === services.length - 1)) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetService = services[targetIndex];

    try {
      // Use patchService for partial updates to avoid data corruption
      await patchService(service.id, { order: targetService.order });
      await patchService(targetService.id, { order: service.order });
      await fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reorder services',
        variant: 'destructive',
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage service cards displayed on your website
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Service
        </Button>
      </div>

      {/* Services List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>
            {services.length} service{services.length !== 1 ? 's' : ''} configured · Use ↑↓ arrows to reorder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => {
              const IconComponent = iconOptions.find(opt => opt.value === service.icon)?.icon || Wrench;
              const colorClass = colorOptions.find(opt => opt.value === service.color)?.class || 'bg-blue-500';

              return (
                <div key={service.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveOrder(service, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveOrder(service, 'down')}
                      disabled={index === services.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center text-white flex-shrink-0`}>
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{service.title}</h3>
                      {service.popular && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                      {!service.enabled && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center mt-1 text-sm text-slate-500">
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                        {service.category || 'General'}
                      </span>
                      <span className="truncate">{service.description}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{service.price}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${service.id}`} className="text-sm">
                        Enabled
                      </Label>
                      <Switch
                        id={`enabled-${service.id}`}
                        checked={service.enabled}
                        onCheckedChange={() => handleToggleEnabled(service)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setDeletingService(service);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-emerald-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {editingService ? 'Refine Service Portfolio' : 'Standardize New Service'}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs mt-0.5">
                  {editingService ? 'Update your service specifications for the digital catalog.' : 'Create a high-impact service entry for your clients.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Designation *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Hardware Repair"
                  className="h-11 border-slate-200 rounded-xl font-medium focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Market Pricing *</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., From ₹500"
                  className="h-11 border-slate-200 rounded-xl font-bold focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sector Assignment *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category" className="h-11 border-slate-200 rounded-xl font-medium bg-slate-50/50">
                  <SelectValue placeholder="Select a Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                  ) : (
                    categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Brand Identity Assets</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Icon Type</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Signature Accent</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full ${option.class} shadow-sm border border-slate-100`}></div>
                            <span className="text-xs font-medium">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brief Summary *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service value proposition..."
                rows={2}
                className="resize-none border-slate-200 rounded-xl focus:border-emerald-500 p-4"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label htmlFor="image" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Main Digital Asset URL</Label>
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-100/50 px-2 py-0.5 rounded-full">Rec: 16:9 Aspect</span>
              </div>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="h-11 border-slate-200 rounded-xl focus:border-emerald-500 italic bg-slate-50/30"
              />
            </div>

            <div className="space-y-2 p-5 bg-emerald-50/40 rounded-[2rem] border border-emerald-100/50">
              <div className="flex items-center justify-between mb-2 px-1">
                <Label htmlFor="detailedDescription" className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Operational Capability (Markdown)</Label>
                <Info className="h-3 w-3 text-emerald-400" />
              </div>
              <Textarea
                id="detailedDescription"
                value={formData.detailedDescription}
                onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                placeholder="Write exhaustive, technical capability content here..."
                rows={6}
                className="bg-white border-emerald-100 rounded-xl focus:border-emerald-500 shadow-sm p-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-3xl border bg-white">
                <div className="space-y-0.5">
                  <Label htmlFor="popular" className="text-[11px] font-black uppercase tracking-widest text-slate-800">Priority Listing</Label>
                  <p className="text-[10px] text-slate-400 italic font-medium">Flag as popular choice</p>
                </div>
                <Switch
                  id="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                  className="data-[state=checked]:bg-emerald-600 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl border border-emerald-100 bg-emerald-50/10">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled" className="text-[11px] font-black uppercase tracking-widest text-slate-800">Live Status</Label>
                  <p className="text-[10px] text-slate-400 italic font-medium">Visibility on storefront</p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  className="data-[state=checked]:bg-emerald-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={handleCloseDialog} className="rounded-xl px-8 h-12 font-bold flex-1 border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 rounded-xl px-12 h-12 font-black uppercase tracking-widest flex-1">
              {editingService ? 'Confirm Update' : 'Publish Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingService?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingService(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesManagement;
