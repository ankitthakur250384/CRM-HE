/**
 * CrewAI Cloud Platform Integration Service
 * Manages communication between ASP Cranes CRM and CrewAI cloud platform
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class CrewAICloudService {
  constructor() {
    this.config = {
      apiKey: process.env.CREWAI_API_KEY,
      orgId: process.env.CREWAI_ORG_ID,
      baseURL: process.env.CREWAI_API_BASE_URL || 'https://api.crewai.com/v1',
      workspaceURL: process.env.CREWAI_WORKSPACE_URL,
      webhookSecret: process.env.CREWAI_WEBHOOK_SECRET,
      timeout: parseInt(process.env.AI_TIMEOUT) || 5000
    };

    // Validate required configuration
    this.validateConfig();
    
    // Initialize API client
    this.client = this.createClient();
    
    console.log('🌐 CrewAI Cloud Service initialized');
  }

  validateConfig() {
    const required = ['apiKey', 'orgId', 'baseURL'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required CrewAI configuration: ${missing.join(', ')}`);
    }
  }

  createClient() {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Organization-ID': this.config.orgId,
        'Content-Type': 'application/json',
        'User-Agent': 'ASP-Cranes-CRM/1.0'
      }
    });
  }

  /**
   * Process customer chat through CrewAI platform
   */
  async processChat(message, context = {}) {
    try {
      console.log('🤖 Processing chat via CrewAI Cloud:', message);
      
      const response = await this.client.post('/agents/asp-master-agent/chat', {
        message,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          source: 'asp-cranes-crm'
        },
        config: {
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000
        }
      });

      return {
        success: true,
        response: response.data.message,
        agentId: response.data.agentId,
        confidence: response.data.confidence,
        metadata: response.data.metadata
      };

    } catch (error) {
      console.error('❌ CrewAI chat processing error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Process leads through CrewAI Lead Agent
   */
  async processLead(leadData) {
    try {
      console.log('🎯 Processing lead via CrewAI:', leadData.customerName);
      
      const response = await this.client.post('/agents/asp-lead-agent/process', {
        leadData,
        workflow: 'lead-qualification',
        crmEndpoint: `${process.env.ASP_CRM_BASE_URL}/leads`,
        headers: {
          [process.env.LEADS_BYPASS_HEADER]: process.env.LEADS_BYPASS_VALUE
        }
      });

      return {
        success: true,
        leadScore: response.data.score,
        qualification: response.data.qualification,
        recommendations: response.data.recommendations,
        nextActions: response.data.nextActions
      };

    } catch (error) {
      console.error('❌ CrewAI lead processing error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Generate quotations through CrewAI Quotation Agent
   */
  async generateQuotation(quotationData) {
    try {
      console.log('💰 Generating quotation via CrewAI:', quotationData.equipmentType);
      
      const response = await this.client.post('/agents/asp-quotation-agent/generate', {
        quotationData,
        workflow: 'quotation-generation',
        crmEndpoint: `${process.env.ASP_CRM_BASE_URL}/quotations`,
        pricingRules: {
          baseRates: true,
          dynamicPricing: true,
          discountRules: true
        }
      });

      return {
        success: true,
        quotation: response.data.quotation,
        pricing: response.data.pricing,
        terms: response.data.terms,
        validUntil: response.data.validUntil
      };

    } catch (error) {
      console.error('❌ CrewAI quotation generation error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Research companies through CrewAI Intelligence Agent
   */
  async researchCompany(companyData) {
    try {
      console.log('🔍 Researching company via CrewAI:', companyData.companyName);
      
      const response = await this.client.post('/agents/asp-intelligence-agent/research', {
        companyData,
        workflow: 'company-intelligence',
        sources: ['web-search', 'business-databases', 'social-media'],
        depth: 'comprehensive'
      });

      return {
        success: true,
        companyProfile: response.data.profile,
        financialInfo: response.data.financial,
        industryInsights: response.data.industry,
        riskAssessment: response.data.risk,
        opportunities: response.data.opportunities
      };

    } catch (error) {
      console.error('❌ CrewAI company research error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId = null) {
    try {
      const endpoint = agentId ? `/agents/${agentId}/metrics` : '/analytics/agents';
      const response = await this.client.get(endpoint);

      return {
        success: true,
        metrics: response.data.metrics,
        performance: response.data.performance,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('❌ CrewAI metrics error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for CrewAI platform
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      
      return {
        success: true,
        status: response.data.status,
        platform: 'CrewAI Cloud',
        latency: response.headers['x-response-time'],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ CrewAI health check failed:', error.message);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Handle errors with appropriate fallback
   */
  handleError(error) {
    const errorInfo = {
      message: error.message,
      code: error.response?.status,
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString()
    };

    // Check if fallback to local AI is enabled
    if (process.env.ENABLE_FALLBACK_TO_LOCAL === 'true') {
      console.log('🔄 Attempting fallback to local AI system...');
      errorInfo.fallbackAvailable = true;
      errorInfo.fallbackEndpoint = process.env.LOCAL_AI_ENDPOINT;
    }

    return errorInfo;
  }

  /**
   * Initialize agents on CrewAI platform
   */
  async initializeAgents() {
    try {
      console.log('🚀 Initializing ASP Cranes agents on CrewAI platform...');
      
      const agents = [
        {
          name: 'asp-master-agent',
          role: 'Master Coordinator',
          description: 'Central coordinator for ASP Cranes CRM operations',
          model: 'gpt-4o-mini',
          tools: ['crm-api', 'data-processing', 'workflow-management']
        },
        {
          name: 'asp-lead-agent',
          role: 'Lead Processing Specialist',
          description: 'Processes and qualifies sales leads',
          model: 'gpt-4o-mini',
          tools: ['lead-qualification', 'scoring-algorithm', 'crm-api']
        },
        {
          name: 'asp-deal-agent',
          role: 'Deal Management Expert',
          description: 'Manages deal progression and analysis',
          model: 'gpt-4o-mini',
          tools: ['deal-analysis', 'pipeline-management', 'crm-api']
        },
        {
          name: 'asp-quotation-agent',
          role: 'Quotation Specialist',
          description: 'Generates accurate quotations and pricing',
          model: 'gpt-4o-mini',
          tools: ['pricing-calculator', 'pdf-generator', 'crm-api']
        },
        {
          name: 'asp-intelligence-agent',
          role: 'Business Intelligence Analyst',
          description: 'Provides company research and market insights',
          model: 'gpt-4o-mini',
          tools: ['web-search', 'data-analysis', 'business-intelligence']
        },
        {
          name: 'asp-nlp-assistant',
          role: 'Natural Language Processing Assistant',
          description: 'Handles customer conversations and support',
          model: 'gpt-4o-mini',
          tools: ['nlp-processing', 'conversation-ai', 'sentiment-analysis']
        }
      ];

      const initPromises = agents.map(agent => 
        this.client.post('/agents', {
          ...agent,
          organizationId: this.config.orgId,
          crmIntegration: {
            baseURL: process.env.ASP_CRM_BASE_URL,
            authHeaders: {
              [process.env.LEADS_BYPASS_HEADER]: process.env.LEADS_BYPASS_VALUE
            }
          }
        })
      );

      const results = await Promise.allSettled(initPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      console.log(`✅ Successfully initialized ${successful}/${agents.length} agents on CrewAI platform`);
      
      return {
        success: successful === agents.length,
        initialized: successful,
        total: agents.length,
        details: results
      };

    } catch (error) {
      console.error('❌ Agent initialization failed:', error.message);
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
export const crewaiCloudService = new CrewAICloudService();

// Export default for easy importing
export default crewaiCloudService;
