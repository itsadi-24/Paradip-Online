import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    ChevronRight,
    Clock,
    Edit,
    Layout,
    Trash2
} from "lucide-react";
import { pagesApi, Page } from "@/api/pagesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Pages = () => {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPages = async () => {
        setLoading(true);
        try {
            const { data } = await pagesApi.getAllPages();
            if (data) setPages(data);
        } catch (error) {
            console.error("Error fetching pages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleDelete = async (name: string) => {
        if (!window.confirm(`Are you sure you want to delete the "${name}" page? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await pagesApi.deletePage(name);
            if (error) {
                toast({
                    title: "Error Deleting Page",
                    description: error,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Page Deleted",
                    description: `Successfully deleted "${name}" page.`,
                });
                fetchPages();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete page. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    const corePages = ['home', 'products', 'services'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Website Pages</h2>
                    <p className="text-muted-foreground">
                        Manage the content and sections of your website's pages.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page) => (
                    <Card key={page.name} className="hover:shadow-md transition-shadow relative">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Layout className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {page.updatedAt ? formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true }) : 'Never'}
                                </div>
                            </div>
                            <CardTitle className="mt-4">{page.title}</CardTitle>
                            <CardDescription>
                                Slug: <code className="bg-muted px-1 rounded">{page.name}</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button asChild className="flex-1 mt-4" variant="outline">
                                    <Link to={`/admin/pages/${page.name}`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Content
                                    </Link>
                                </Button>
                                
                                {!corePages.includes(page.name) && (
                                    <Button 
                                        className="mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                                        variant="outline"
                                        onClick={() => handleDelete(page.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Pages;
