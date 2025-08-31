/**
 * OpenAI Integration Service for ASP Cranes CRM Agents
 * Optimized for performance with GPT-4o-mini
 */
import { OpenAI } from 'openai';
import { EventEmitter } from 'events';

/**
 * OpenAI Service for agent interactions
 */
export class OpenAIService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: process.env.OPENAI_API_KEY,
      model: config.model || 'gpt-4o-mini',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 2000, // 2 second timeout for performance
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 500,
      ...config
    };

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout
    });

    // Response cache for performance optimization
    this.cache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheTimeout = 300000; // 5 minutes

    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      totalResponseTime: 0
    };

    console.log('🤖 OpenAI Service initialized with GPT-4o-mini');
    this.startMetricsReporting();
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(messages, options = {}) {
    const key = JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model: options.model || this.config.model,
      temperature: options.temperature || this.config.temperature
    });
    return Buffer.from(key).toString('base64');
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.metrics.cacheHits++;
      console.log('⚡ Cache hit for OpenAI request');
      return cached.response;
    }
    return null;
  }

  /**
   * Cache response
   */
  setCachedResponse(cacheKey, response) {
    // Manage cache size
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Main chat completion method with optimization
   */
  async chat(messages, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(messages, options);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Prepare request
      const requestOptions = {
        model: options.model || this.config.model,
        messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature || this.config.temperature,
        stream: options.stream || false
      };

      console.log(`🤖 OpenAI Request: ${messages.length} messages to ${requestOptions.model}`);

      // Make request with retry logic
      const response = await this.makeRequestWithRetry(requestOptions);
      
      // Process response
      const result = {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        responseTime: Date.now() - startTime,
        cached: false
      };

      // Cache the response
      this.setCachedResponse(cacheKey, result);

      // Update metrics
      this.updateMetrics(startTime, true);
      
      this.emit('response', {
        agentType: options.agentType,
        responseTime: result.responseTime,
        tokens: response.usage.total_tokens,
        success: true
      });

      return result;

    } catch (error) {
      console.error('❌ OpenAI chat error:', error.message);
      
      this.updateMetrics(startTime, false);
      this.emit('error', {
        agentType: options.agentType,
        error: error.message,
        responseTime: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Make request with retry logic
   */
  async makeRequestWithRetry(requestOptions, attempt = 1) {
    try {
      return await this.openai.chat.completions.create(requestOptions);
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        console.log(`🔄 Retry attempt ${attempt} for OpenAI request`);
        await this.delay(this.config.retryDelay * attempt);
        return await this.makeRequestWithRetry(requestOptions, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update performance metrics
   */
  updateMetrics(startTime, success) {
    const responseTime = Date.now() - startTime;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
  }

  /**
   * Start metrics reporting
   */
  startMetricsReporting() {
    setInterval(() => {
      if (this.metrics.totalRequests > 0) {
        console.log('📊 OpenAI Service Metrics:', {
          total_requests: this.metrics.totalRequests,
          success_rate: `${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`,
          avg_response_time: `${Math.round(this.metrics.averageResponseTime)}ms`,
          cache_hit_rate: `${((this.metrics.cacheHits / this.metrics.totalRequests) * 100).toFixed(1)}%`,
          cache_size: this.cache.size
        });
      }
    }, 60000); // Report every minute
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.cacheHits / this.metrics.totalRequests) * 100 : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ OpenAI response cache cleared');
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      totalResponseTime: 0
    };
    console.log('📊 OpenAI metrics reset');
  }
}

/**
 * Prompt Templates for different agent types
 */
export class PromptTemplates {
  static SYSTEM_PROMPTS = {
    nlp_sales: {
      role: "You are a professional sales assistant for ASP Cranes, specializing in crane rentals and construction equipment. You help customers with inquiries, provide information about services, and guide them through the rental process.",
      guidelines: [
        "Be professional and helpful",
        "Focus on crane rental services",
        "Ask qualifying questions to understand customer needs",
        "Provide accurate information about equipment and pricing",
        "Guide customers toward actionable next steps"
      ]
    },
    
    lead_agent: {
      role: "You are a Lead Management specialist. You analyze, categorize, and prioritize leads for ASP Cranes.",
      guidelines: [
        "Analyze lead quality and potential value",
        "Categorize leads by service type and urgency",
        "Assign appropriate priority levels",
        "Identify missing information needed for qualification",
        "Recommend next actions for lead follow-up"
      ]
    },
    
    deal_agent: {
      role: "You are a Deal Management specialist. You track opportunities, forecast revenue, and optimize the sales pipeline.",
      guidelines: [
        "Monitor deal progression through pipeline stages",
        "Identify potential risks and opportunities",
        "Provide accurate revenue forecasting",
        "Suggest actions to advance deals",
        "Track competitive situations and pricing"
      ]
    },
    
    quotation_agent: {
      role: "You are a Quotation specialist. You create accurate pricing proposals and manage quotation processes.",
      guidelines: [
        "Calculate accurate equipment rental pricing",
        "Consider factors like duration, location, and equipment type",
        "Include all necessary terms and conditions",
        "Optimize pricing for competitiveness and profitability",
        "Track quotation status and follow-up requirements"
      ]
    },
    
    company_intelligence: {
      role: "You are a Company Intelligence analyst. You research and analyze potential customers and market opportunities.",
      guidelines: [
        "Research company backgrounds and financial stability",
        "Analyze market trends and opportunities",
        "Identify decision makers and key contacts",
        "Assess competitive landscape",
        "Provide strategic insights for business development"
      ]
    },
    
    master_agent: {
      role: "You are the Master Coordinator for the ASP Cranes CRM system. You orchestrate activities between specialized agents and ensure optimal workflow.",
      guidelines: [
        "Coordinate activities between specialized agents",
        "Prioritize tasks based on business impact",
        "Ensure data consistency across systems",
        "Monitor system performance and agent efficiency",
        "Make strategic decisions for complex scenarios"
      ]
    }
  };

  /**
   * Get system prompt for agent type
   */
  static getSystemPrompt(agentType) {
    const template = this.SYSTEM_PROMPTS[agentType];
    if (!template) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    return {
      role: "system",
      content: `${template.role}

Guidelines:
${template.guidelines.map(g => `• ${g}`).join('\n')}

You have access to ASP Cranes CRM data and can perform actions through the system. Always provide helpful, accurate, and professional responses.`
    };
  }

  /**
   * Create user message
   */
  static createUserMessage(content, context = {}) {
    let message = content;
    
    if (context.customerData) {
      message += `\n\nCustomer Context: ${JSON.stringify(context.customerData, null, 2)}`;
    }
    
    if (context.leadData) {
      message += `\n\nLead Context: ${JSON.stringify(context.leadData, null, 2)}`;
    }
    
    if (context.dealData) {
      message += `\n\nDeal Context: ${JSON.stringify(context.dealData, null, 2)}`;
    }
    
    return {
      role: "user",
      content: message
    };
  }

  /**
   * Create context-aware conversation
   */
  static createConversation(agentType, userMessage, context = {}, history = []) {
    const messages = [this.getSystemPrompt(agentType)];
    
    // Add conversation history
    if (history.length > 0) {
      messages.push(...history.slice(-10)); // Keep last 10 messages for context
    }
    
    // Add current user message with context
    messages.push(this.createUserMessage(userMessage, context));
    
    return messages;
  }
}

// Create singleton instance
export const openaiService = new OpenAIService({
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 2000 // 2 second target
});

export default openaiService;
