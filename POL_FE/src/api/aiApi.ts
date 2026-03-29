import { post } from "./apiClient";

export interface SKUContent {
    description: string;
    specs: string[];
}

export interface RepairRoadmap {
    probableCause: string;
    toolsRequired: string[];
    restorationSteps: string[];
    technicianAdvice: string;
}

export interface BlogContent {
    title: string;
    content: string;
    excerpt: string;
    readTime: string;
}

/**
 * STRATEGIC PILLAR: SKU Synthesis
 */
export const synthesizeSKU = async (name: string): Promise<{ data?: SKUContent; error?: string }> => {
    try {
        const response = await post<SKUContent>("/ai/synthesize-sku", { name });
        return { data: response.data as SKUContent };
    } catch (error: any) {
        return { error: error.message || "Synthesis failed." };
    }
};

/**
 * STRATEGIC PILLAR: Repair Intelligence
 */
export const getRepairRoadmap = async (ticketData: any): Promise<{ data?: RepairRoadmap; error?: string }> => {
    try {
        const response = await post<RepairRoadmap>("/ai/repair-roadmap", { ticketData });
        return { data: response.data as RepairRoadmap };
    } catch (error: any) {
        return { error: error.message || "Roadmap generation failed." };
    }
};

/**
 * STRATEGIC PILLAR: SEO Auto-Pilot
 */
export const generateBlog = async (topic: string, category: string): Promise<{ data?: BlogContent; error?: string }> => {
    try {
        const response = await post<BlogContent>("/ai/generate-blog", { topic, category });
        return { data: response.data as BlogContent };
    } catch (error: any) {
        return { error: error.message || "Blog generation failed." };
    }
};

/**
 * AI Market Discovery Sync
 */
export const syncMarketDiscovery = async (params: any): Promise<{ data?: any; error?: string }> => {
    try {
        const response = await post<any>("/ai/sync-market", params);
        return { data: response.data };
    } catch (error: any) {
        return { error: error.message || "AI Analysis failed." };
    }
};
