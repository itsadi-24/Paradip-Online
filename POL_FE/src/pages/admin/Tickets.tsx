import { useState, useEffect } from "react";
import { 
  Check, Clock, MessageSquare, MoreHorizontal, User, Loader2, Search, ArrowUpDown, Send, Plus, Phone, Laptop, Shield, Upload, ImageIcon, Copy, Mail, FileText, Calendar, History, Trash2, ClipboardList, Monitor, Settings2, Info, CheckCircle2, IndianRupee, Sparkles, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImages } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { getTickets, updateTicket, createTicket, Ticket } from "@/api/ticketsApi";
import { getRepairRoadmap, RepairRoadmap } from "@/api/aiApi";
import { useToast } from "@/hooks/use-toast";

const Tickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState("");
  const [historyNote, setHistoryNote] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [roadmap, setRoadmap] = useState<RepairRoadmap | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [repeatCustomerTickets, setRepeatCustomerTickets] = useState<Ticket[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    jobCardNo: "",
    subject: "",
    customer: "",
    phone: "",
    email: "",
    priority: "Medium",
    status: "Open",
    gadget: { brand: "", model: "", productName: "", productType: "", serial: "", condition: "" },
    images: [],
    date: new Date().toISOString().split('T')[0],
    password: Math.random().toString(36).slice(-6).toUpperCase(),
    technicianAssigned: "",
    remarks: "",
  });

  useEffect(() => {
    loadTickets();
  }, []);

  // Repeat customer check based on phone number input
  useEffect(() => {
    if (newTicket.phone && newTicket.phone.length >= 8) {
      const pastTickets = tickets.filter(t => t.phone === newTicket.phone);
      setRepeatCustomerTickets(pastTickets);
    } else {
      setRepeatCustomerTickets([]);
    }
  }, [newTicket.phone, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await getTickets();
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else if (data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const query = searchQuery.toLowerCase();
    return (
      ticket.id.toLowerCase().includes(query) ||
      ticket.customer.toLowerCase().includes(query) ||
      ticket.subject.toLowerCase().includes(query)
    );
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return sortOrder === "desc" ? -diff : diff;
    } else {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }
  });

  const handleStatusChange = async (ticket: Ticket, newStatus: Ticket["status"], note: string = "Status updated by administrator") => {
    const historyEntry = {
      status: newStatus,
      note: note,
      timestamp: new Date().toISOString()
    };

    const updated = {
      ...ticket,
      status: newStatus,
      history: [...(ticket.history || []), historyEntry]
    };

    const { error } = await updateTicket(ticket.id, updated);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Ticket updated", description: `Status changed to ${newStatus}.` });
      loadTickets();
    }
  };

  const handleCreateTicket = async () => {
    setSaving(true);
    const { error } = await createTicket(newTicket);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Repair job card created successfully." });
      setCreateDialogOpen(false);
      setNewTicket({
        jobCardNo: "", subject: "", customer: "", phone: "", email: "", priority: "Medium", status: "Open",
        gadget: { brand: "", model: "", productName: "", serial: "", condition: "" }, images: [],
        date: new Date().toISOString().split('T')[0], password: Math.random().toString(36).slice(-6).toUpperCase(),
        technicianAssigned: "", remarks: ""
      });
      loadTickets();
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      const files = Array.from(e.target.files);
      const { data, error } = await uploadImages(files);
      if (error) {
        toast({ title: "Upload failed", description: error, variant: "destructive" });
      } else if (data) {
        const urls = data.map(img => img.url);
        setNewTicket(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
        toast({ title: "Success", description: "Images uploaded successfully." });
      }
      setUploadingImages(false);
    }
  };

  const copyCommunicationTemplate = () => {
    if (!selectedTicket) return;
    const text = `Hello ${selectedTicket.customer},\n\nYour repair job is currently: *${selectedTicket.status}*\nJob Card No: ${selectedTicket.jobCardNo || selectedTicket.id}\nTrack exactly what is happening live on our website using your phone number and this tracking password: ${selectedTicket.password}\n\nThank you for choosing us!`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Message copied to clipboard." });
  };

  const generateEmailLink = () => {
    if (!selectedTicket || !selectedTicket.email) return "#";
    const subject = `Repair Update - Job Card ${selectedTicket.jobCardNo || selectedTicket.id}`;
    const body = `Hello ${selectedTicket.customer},\n\nThis is an update regarding your repair (${selectedTicket.gadget?.productName || 'device'} - ${selectedTicket.gadget?.brand} ${selectedTicket.gadget?.model}).\n\nCurrent Status: ${selectedTicket.status}\n\nYou can track the live progress on our website using your tracking password: ${selectedTicket.password}\n\nRegards,\nThe Support Team`;
    return `mailto:${selectedTicket.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleUpdateManage = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    const { error } = await updateTicket(selectedTicket.id, selectedTicket);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ticket details updated." });
      setManageDialogOpen(false);
      loadTickets();
    }
    setSaving(false);
  };

  const openCommentDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCommentText(ticket.comment || "");
    setCommentDialogOpen(true);
  };

  const handleSaveComment = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    const updated = { ...selectedTicket, comment: commentText };
    const { error } = await updateTicket(selectedTicket.id, updated);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Comment saved", description: "Your comment has been added to the ticket." });
      loadTickets();
    }
    setSaving(false);
    setCommentDialogOpen(false);
    setSelectedTicket(null);
    setCommentText("");
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedTicket) return;
    setLoadingRoadmap(true);
    setRoadmap(null);
    const { data, error } = await getRepairRoadmap(selectedTicket);
    if (error) {
      toast({ title: "Intelligence Failure", description: error, variant: "destructive" });
    } else if (data) {
      setRoadmap(data);
      toast({ title: "Roadmap Generated", description: "Strategic troubleshooting guide is now active." });
    }
    setLoadingRoadmap(false);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Medium": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Open": return "default";
      case "In Progress": return "secondary";
      case "Closed": return "outline";
      default: return "default";
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer support requests ({tickets.length} tickets)
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100 font-bold rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" /> Create New Job Card
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ticket ID, customer name, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: "priority" | "date") => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort by Priority</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={toggleSortOrder} title={sortOrder === "desc" ? "Descending" : "Ascending"}>
          <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer / Phone</TableHead>
              <TableHead>Subject / Gadget</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{ticket.customer}</div>
                    <div className="text-xs text-muted-foreground">{ticket.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="truncate font-medium">{ticket.subject}</div>
                    {ticket.gadget && (
                      <div className="text-[10px] text-blue-600 font-bold truncate">
                        {ticket.gadget.brand} {ticket.gadget.model}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(ticket.status) as any}>{ticket.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ticket.date}
                  </div>
                </TableCell>
                <TableCell>
                  {ticket.comment ? (
                    <span className="text-xs text-muted-foreground max-w-[150px] truncate block" title={ticket.comment}>
                      {ticket.comment.slice(0, 30)}{ticket.comment.length > 30 ? "..." : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">No comment</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket, "Open")}>Mark as Open</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket, "In Progress")}>Mark In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket, "Closed")}>
                        <Check className="mr-2 h-3 w-3" /> Mark as Closed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedTicket(ticket);
                        setManageDialogOpen(true);
                      }}>
                        <Shield className="mr-2 h-3 w-3" /> Manage Job Card
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCommentDialog(ticket)}>
                        <MessageSquare className="mr-2 h-3 w-3" /> Add/Edit Comment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-amber-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">New Repair Job Card</DialogTitle>
                <DialogDescription className="text-amber-100 text-xs mt-0.5">
                  Establish a formal technical entry and tracking ID for service.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-8 bg-white">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b pb-1">
                  <User className="h-4 w-4 text-amber-600" /> Customer Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ph" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number *</Label>
                    <Input id="ph" value={newTicket.phone} onChange={(e) => setNewTicket({ ...newTicket, phone: e.target.value })} placeholder="Mobile Number" className="h-11 rounded-xl border-slate-200 focus:border-amber-500 font-medium" />
                  </div>
                  {repeatCustomerTickets.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800 text-[10px] font-black uppercase tracking-widest leading-none">
                        <History className="h-3 w-3 animate-pulse" /> Repeat Client Detected
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-8 bg-white border-amber-200 text-amber-700 font-bold rounded-lg hover:bg-amber-100 transition-colors" 
                        onClick={() => setNewTicket({ 
                          ...newTicket, 
                          customer: repeatCustomerTickets[0].customer, 
                          email: repeatCustomerTickets[0].email || "",
                          gadget: {
                            ...newTicket.gadget!,
                            brand: repeatCustomerTickets[0].gadget?.brand || "",
                            model: repeatCustomerTickets[0].gadget?.model || "",
                            productType: repeatCustomerTickets[0].gadget?.productType || ""
                          }
                        })}
                      >
                        Autofill: {repeatCustomerTickets[0].customer}
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="cust" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Full Name *</Label>
                    <Input id="cust" value={newTicket.customer} onChange={(e) => setNewTicket({ ...newTicket, customer: e.target.value })} placeholder="Full Name" className="h-11 rounded-xl border-slate-200 focus:border-amber-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                    <Input id="email" type="email" value={newTicket.email} onChange={(e) => setNewTicket({ ...newTicket, email: e.target.value })} placeholder="Optional" className="h-11 rounded-xl border-slate-200 focus:border-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b pb-1">
                  <Laptop className="h-4 w-4 text-amber-600" /> Device & Issue
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subj" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Fault *</Label>
                    <Input id="subj" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="e.g. Screen Replacement" className="h-11 rounded-xl border-slate-200 focus:border-amber-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Category / Type</Label>
                    <Input className="h-11 rounded-xl border-slate-200 focus:border-amber-500 font-medium" placeholder="e.g. Laptop, Mobile, Printer, CCTV" value={newTicket.gadget?.productType} onChange={(e) => setNewTicket({ ...newTicket, gadget: { ...newTicket.gadget!, productType: e.target.value } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand</Label>
                      <Input className="h-10 text-xs rounded-xl border-slate-200" placeholder="Brand" value={newTicket.gadget?.brand} onChange={(e) => setNewTicket({ ...newTicket, gadget: { ...newTicket.gadget!, brand: e.target.value } })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Model</Label>
                      <Input className="h-10 text-xs rounded-xl border-slate-200" placeholder="Model" value={newTicket.gadget?.model} onChange={(e) => setNewTicket({ ...newTicket, gadget: { ...newTicket.gadget!, model: e.target.value } })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Serial / IMEI #</Label>
                    <Input className="h-11 text-xs font-mono rounded-xl bg-slate-50 border-dashed border-slate-300" placeholder="Serial / IMEI #" value={newTicket.gadget?.serial} onChange={(e) => setNewTicket({ ...newTicket, gadget: { ...newTicket.gadget!, serial: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Administrative Remarks</Label>
                    <Textarea className="h-20 text-xs rounded-xl border-slate-200 resize-none" placeholder="Internal notes (optional)" value={newTicket.remarks} onChange={(e) => setNewTicket({ ...newTicket, remarks: e.target.value })} />
                  </div>
                  
                  <div className="bg-slate-900 p-5 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-slate-200 border-2 border-slate-800 mt-2">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Shield className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Secret</p>
                        <p className="text-xl font-mono font-black text-amber-500 leading-none tracking-tight">{newTicket.password}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-xl px-8 h-12 font-bold flex-1 border-slate-200">Discard</Button>
            <Button onClick={handleCreateTicket} disabled={saving} className="bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-100 rounded-xl px-12 h-12 font-black uppercase tracking-widest flex-1">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Generate Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Ticket Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Settings2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-xl font-bold">Repair Management Console</DialogTitle>
                  <span className="font-mono text-[10px] font-black bg-white/20 px-3 py-1 rounded-full border border-white/20 uppercase tracking-tighter">
                    Entry: {selectedTicket?.jobCardNo || selectedTicket?.id}
                  </span>
                </div>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">
                  Strategic control and direct dispatch for <span className="text-white font-black">{selectedTicket?.customer}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="p-8 grid grid-cols-3 gap-8 bg-white">
              {/* Column 1: Workflow */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-1">Operational Phase</h3>
                  <Select value={selectedTicket.status} onValueChange={(val: any) => setSelectedTicket({ ...selectedTicket, status: val })}>
                    <SelectTrigger className="h-12 font-bold rounded-2xl border-2 border-blue-50 bg-blue-50/30 text-blue-700 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="Open">🔓 Received</SelectItem>
                      <SelectItem value="Diagnosing">🔬 Diagnosing</SelectItem>
                      <SelectItem value="In Progress">🛠 In Progress</SelectItem>
                      <SelectItem value="Awaiting Parts">📦 Awaiting Parts</SelectItem>
                      <SelectItem value="Ready for Pickup">🎁 Ready</SelectItem>
                      <SelectItem value="Closed">🎉 Closed</SelectItem>
                      <SelectItem value="Cancelled">⛔ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                    <FileText className="h-3 w-3" /> Status Milestone
                  </div>
                  <Textarea 
                    placeholder="Log technical milestones..." 
                    className="h-32 resize-none rounded-2xl bg-white border-slate-200 text-xs p-4 shadow-inner" 
                    value={historyNote}
                    onChange={(e) => setHistoryNote(e.target.value)}
                  />
                  <Button size="sm" className="w-full bg-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] h-11 hover:bg-black transition-all" onClick={() => { handleStatusChange(selectedTicket, selectedTicket.status, historyNote); setHistoryNote(""); setManageDialogOpen(false); }}>
                    Update Global Status
                  </Button>
                </div>
              </div>

              {/* Column 2: Details */}
              <div className="space-y-6">
                <div className="p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-b border-blue-200/30 pb-1">Technical Audit</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400 ml-1">Brand</Label>
                        <Input className="h-9 text-xs rounded-xl bg-white border-slate-200 font-medium" value={selectedTicket.gadget?.brand} onChange={(e) => setSelectedTicket({ ...selectedTicket, gadget: { ...selectedTicket.gadget!, brand: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400 ml-1">Model</Label>
                        <Input className="h-9 text-xs rounded-xl bg-white border-slate-200 font-medium" value={selectedTicket.gadget?.model} onChange={(e) => setSelectedTicket({ ...selectedTicket, gadget: { ...selectedTicket.gadget!, model: e.target.value } })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400 ml-1">Serial / IMEI Identification</Label>
                        <Input className="h-9 text-xs font-mono rounded-xl bg-white border-slate-200" value={selectedTicket.gadget?.serial} onChange={(e) => setSelectedTicket({ ...selectedTicket, gadget: { ...selectedTicket.gadget!, serial: e.target.value } })} />
                       </div>
                       <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400 ml-1">Product Type</Label>
                        <Input className="h-9 text-xs rounded-xl bg-white border-slate-200" value={selectedTicket.gadget?.productType} onChange={(e) => setSelectedTicket({ ...selectedTicket, gadget: { ...selectedTicket.gadget!, productType: e.target.value } })} />
                       </div>
                    </div>
                    <div className="space-y-1 pb-2">
                       <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400 ml-1">Internal Remarks</Label>
                       <Textarea className="h-16 text-xs rounded-xl bg-white border-slate-200 resize-none" value={selectedTicket.remarks} onChange={(e) => setSelectedTicket({ ...selectedTicket, remarks: e.target.value })} />
                    </div>

                    <div className="pt-2 border-t border-blue-200/30">
                        {!roadmap && !loadingRoadmap ? (
                            <Button 
                                type="button" 
                                onClick={handleGenerateRoadmap}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-100"
                            >
                                <Sparkles className="h-4 w-4" />
                                Generate AI Repair Roadmap
                            </Button>
                        ) : loadingRoadmap ? (
                            <div className="p-4 bg-white/50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Synthesizing Intelligence...</span>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="outline" className="text-[7px] font-black border-blue-100 text-blue-500 bg-blue-50/50">AI GUIDANCE</Badge>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Probable Root Cause</p>
                                    <p className="text-[11px] text-slate-700 font-bold leading-tight line-clamp-2">{roadmap?.probableCause}</p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Execution Steps</p>
                                    <ul className="space-y-1">
                                        {roadmap?.restorationSteps.slice(0, 3).map((step, i) => (
                                            <li key={i} className="text-[10px] text-slate-600 font-medium flex gap-2">
                                                <span className="text-blue-400 font-black">{i+1}.</span> {step}
                                            </li>
                                        ))}
                                        {(roadmap?.restorationSteps.length || 0) > 3 && (
                                            <li className="text-[9px] text-blue-400 italic font-medium">+ View full roadmap for remaining steps</li>
                                        )}
                                    </ul>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleGenerateRoadmap}
                                    className="w-full h-7 text-[8px] font-black uppercase text-blue-400 hover:text-blue-600 hover:bg-blue-50 mt-1"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" /> Re-Analyze Problem
                                </Button>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-emerald-600 rounded-[2.5rem] shadow-xl shadow-emerald-100 text-white space-y-4 border-4 border-emerald-500/30">
                  <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                    <IndianRupee className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Financial Summary</span>
                  </div>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between bg-white/10 p-2 py-1.5 rounded-xl">
                      <span className="text-[10px] font-black uppercase tracking-tight opacity-70">Estimate</span>
                      <div className="flex items-center">
                        <span className="text-xs mr-1 opacity-50 italic">₹</span>
                        <Input type="number" className="h-7 w-20 bg-transparent border-0 text-white text-right font-black p-0 focus-visible:ring-0" value={selectedTicket.estimatedPrice} onChange={(e) => setSelectedTicket({ ...selectedTicket, estimatedPrice: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/10 p-2 py-1.5 rounded-xl">
                      <span className="text-[10px] font-black uppercase tracking-tight opacity-70">Advance</span>
                      <div className="flex items-center">
                        <span className="text-xs mr-1 opacity-50 italic">₹</span>
                        <Input type="number" className="h-7 w-20 bg-transparent border-0 text-white text-right font-black p-0 focus-visible:ring-0" value={selectedTicket.advanceReceived} onChange={(e) => setSelectedTicket({ ...selectedTicket, advanceReceived: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Communication */}
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-200 flex flex-col gap-6 border border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800 pb-1">Client Dispatch</h4>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-[10px] px-1">
                        <span className="opacity-40 uppercase font-black tracking-widest">Access Key</span>
                        <span className="font-mono text-blue-400 font-black bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">{selectedTicket.password}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] px-1">
                        <span className="opacity-40 uppercase font-black tracking-widest">Ph. Target</span>
                        <span className="font-black text-slate-200">{selectedTicket.phone}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-white text-slate-900 border-0 rounded-2xl font-black uppercase text-[10px] h-12 shadow-xl hover:bg-slate-50 transition-all scale-100 active:scale-95" onClick={copyCommunicationTemplate}>
                      <Copy className="h-4 w-4 mr-2" /> Copy WhatsApp Snippet
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 px-1">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Team Assignment</Label>
                  <Input className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-xs italic font-medium px-4" value={selectedTicket.technicianAssigned} onChange={(e) => setSelectedTicket({ ...selectedTicket, technicianAssigned: e.target.value })} placeholder="Lead Technician Name" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
            <Button variant="outline" onClick={() => setManageDialogOpen(false)} className="rounded-xl px-8 h-12 font-bold flex-1 border-slate-200 bg-white">Abort</Button>
            <Button onClick={handleUpdateManage} disabled={saving} className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-xl px-12 h-12 font-black uppercase tracking-widest flex-1">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Commit All Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Internal Remark</DialogTitle>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">
                  {selectedTicket ? `Private log for Ticket ${selectedTicket.id}` : 'Record administrative context.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 bg-white">
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confidential Note</Label>
              <Textarea 
                id="comment"
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
                placeholder="Note down sensitive administrative details..." 
                className="h-40 rounded-2xl p-4 bg-slate-50/50 border-slate-200 focus:border-blue-500 resize-none shadow-inner"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)} className="rounded-xl px-6 h-11 font-bold flex-1 bg-white border-slate-200">Discard</Button>
            <Button onClick={handleSaveComment} disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-100 h-11 font-black uppercase tracking-widest flex-1">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
