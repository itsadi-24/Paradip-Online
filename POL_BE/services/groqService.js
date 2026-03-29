const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.client = null;
  }

  /**
   * Lazily initialize or refresh the Groq client from environment variables
   * This ensures that as soon as the .env is updated, the service starts working
   */
  _getClient() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your_groq_paid_api_key_here') {
      throw new Error("GROQ_API_KEY is not configured or still using placeholder. Please check your .env file.");
    }

    // Re-initialize if the key has changed or if first time
    if (!this.client || this.client.apiKey !== apiKey) {
      this.client = new Groq({ apiKey });
    }
    
    return this.client;
  }

  async getMarketDiscovery(params) {
    const client = this._getClient();

    const { marketplace, category, brand, searchTerm, minPrice, maxPrice } = params;

    const systemPrompt = `You are a high-fidelity Senior Market Intelligence Analyst for the Indian Electronics and IT retail sector. 
    Your goal is to provide ultra-accurate, best-selling product data for a specific marketplace.
    Output ONLY valid JSON in the following format:
    {
      "results": [
        {
          "name": "Full Product Name",
          "price": 12000,
          "mrp": 15000,
          "rating": 4.5,
          "reviews": 1200,
          "aiInsights": "Strategic rationale for stocking this item",
          "buyingAdvice": "Specific strategic advice based on CURRENT market trends in Paradip",
          "isUpcoming": false,
          "sourceUrl": "REAL_MARKETPLACE_PRODUCT_URL",
          "imageUrl": "REAL_PRODUCT_IMAGE_URL_OR_EMPTY",
          "specs": ["spec1", "spec2"],
          "brand": "BrandName",
          "confidence": 98.4,
          "demand": "HIGH"
        }
      ]
    }
    
    IMPORTANT RULES:
    1. metadata (confidence, demand, buyingAdvice) MUST BE UNIQUE and specific to each product. 
    2. imageUrl MUST refer to a real image or leave empty string (do not use placeholders like link-to-image).
    3. prices MUST be in INR and reflect 2026 market projections.`;

    const userPrompt = `Reconnaissance Mission: Find the top 10 best-selling ${category} products on ${marketplace} 
    ${brand !== 'all' ? `specifically from brand ${brand}` : ''} 
    ${searchTerm ? `matching the term "${searchTerm}"` : ''} 
    ${minPrice || maxPrice ? `in the price range ₹${minPrice || 0} to ₹${maxPrice || 'unlimited'}` : ''}.
    
    Ensure the links and prices are realistic for the Indian market in early 2026.
    Include at least 2 products that are "Upcoming Trends".
    Every entry must have distinct, unique metadata and analysis.`;

    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error("Groq AI Error:", error);
      throw error;
    }
  }

  async generateProductContent(name) {
    const client = this._getClient();
    const prompt = `Act as a high-conversion eCommerce copywriter. Generate a premium product description and technical specification sheet for: "${name}".
    Return ONLY a JSON: {"description": "...", "specs": ["spec1", "spec2", ...]}`;

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });
    return JSON.parse(chatCompletion.choices[0].message.content);
  }

  async generateRepairRoadmap(ticketData) {
    const client = this._getClient();
    const prompt = `Act as a Senior IT Hardware Technician. Create a private troubleshooting roadmap for a ${ticketData.gadget.productName} (${ticketData.gadget.brand} ${ticketData.gadget.model}) with the following issue: "${ticketData.subject}".
    Return ONLY a JSON: {
      "probableCause": "...",
      "toolsRequired": ["tool1", "tool2"],
      "restorationSteps": ["step1", "step2", ...],
      "technicianAdvice": "..."
    }`;

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    return JSON.parse(chatCompletion.choices[0].message.content);
  }

  async generateBlogContent(topic, category) {
    const client = this._getClient();
    const prompt = `Act as a Senior Tech Journalist. Write a full, SEO-optimized technical blog post for the Paradip market on the topic: "${topic}" in category "${category}".
    The post should include an H1 title, an engaging intro, several H2 sections, and a conclusion.
    Return ONLY a JSON: {"title": "...", "content": "Full markdown content here...", "excerpt": "...", "readTime": "x min read"}`;

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    return JSON.parse(chatCompletion.choices[0].message.content);
  }

  async getBrandDiscovery(category) {
    try {
      const client = this._getClient();
      const prompt = `List the top 8 most reputed and famous brands for the product category: "${category}" in the Indian market. Return ONLY a JSON object: {"brands": ["Brand1", "Brand2", ...]} `;

      const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error("Brand Discovery Error:", error);
      return { brands: ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Samsung"] };
    }
  }
}

module.exports = new GroqService();
