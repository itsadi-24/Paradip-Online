const Groq = require('groq-sdk');
const Settings = require('../models/Settings');

class GroqService {
  constructor() {
    this.client = null;
  }

  /**
   * Lazily initialize or refresh the Groq client from environment variables
   * This ensures that as soon as the .env is updated, the service starts working
   */
  async _getClient() {
    // 1. Try to get key from Database first
    const settings = await Settings.getSettings();
    let apiKey = settings.groqApiKey;

    // 2. Fallback to Environment Variable if DB is empty or masked
    if (!apiKey || apiKey.includes("...")) {
      apiKey = process.env.GROQ_API_KEY;
    }
    
    if (!apiKey || apiKey === 'your_groq_paid_api_key_here') {
      throw new Error("GROQ_API_KEY is not configured or still using placeholder. Please check your AI Settings in the Dashboard.");
    }

    // Re-initialize if the key has changed or if first time
    if (!this.client || this.client.apiKey !== apiKey) {
      this.client = new Groq({ apiKey });
    }
    
    return this.client;
  }

  async getMarketDiscovery(params) {
    const client = await this._getClient();

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
    const client = await this._getClient();
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
    const client = await this._getClient();
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
    const client = await this._getClient();
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
      const client = await this._getClient();
      const prompt = `List the top 8 most reputed and famous brands for the product category: "${category}" in the Indian market. Return ONLY a JSON object: {"brands": ["Brand1", "Brand2", ...]} `;

      const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error("Brand Discovery Error:", error);
      throw error;
    }
  }

  async generateSocialProof(mode = 'synthesis') {
    const client = await this._getClient();
    
    let prompt = "";
    if (mode === 'synthesis') {
      prompt = `Act as a Marketing Psychologist for a tech retail & repair shop in Paradip, Odisha.
      Generate 5 highly realistic, diverse social proof "activities" that make the shop look busy and trusted.
      Use local names (from Odisha/India) and local areas (Paradip Port, Badapadia, Kujang, PPL Township, etc.).
      Actions should include: Repair bookings, CCTV installs, Laptop purchases, and claiming discounts.
      
      Return ONLY a JSON array in this format: 
      [
        {"name": "Firstname from Location", "action": "booked a Laptop Screen Fix", "time": "5 mins ago"},
        ...
      ]`;
    } else {
      // Future: Real data anonymization
      prompt = `Anonymize and format these recent database activities into engaging social proof. 
      (Currently fallback to synthesis mode).`;
    }

    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });

      // The response format might vary slightly depending on how LLM interprets "JSON array"
      // Usually it wraps it in an object if forced json_object.
      const content = JSON.parse(chatCompletion.choices[0].message.content);
      return Array.isArray(content) ? content : (content.activities || content.proofs || Object.values(content)[0]);
    } catch (error) {
      console.error("Social Proof Generation Error:", error);
      return [
        { name: 'Rajesh from Paradip Port', action: 'booked a Screen Repair', time: '2 mins ago' },
        { name: 'Soumya from Kujang', action: 'purchased a HP Laptop', time: '15 mins ago' }
      ];
    }
  }
}

module.exports = new GroqService();
