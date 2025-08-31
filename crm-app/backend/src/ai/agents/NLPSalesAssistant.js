/**
 * NLP Sales Assistant Agent
 * Primary interface for customer interactions and sales support
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { leadTool, dealTool, quotationTool, customerTool } from '../tools/CRMTools.js';

export class NLPSalesAssistant extends BaseAgent {
  constructor(hub) {
    super('nlp_sales_assistant', hub);
    
    this.capabilities = [
      'natural_language_processing',
      'customer_interaction',
      'sales_support',
      'lead_qualification',
      'product_information',
      'pricing_assistance'
    ];
    
    this.specializations = [
      'customer_queries',
      'sales_conversations',
      'product_recommendations',
      'initial_qualification'
    ];

    // Conversation context storage
    this.conversations = new Map();
    this.maxConversationLength = 20; // Messages to keep in context
    
    console.log('🗣️ NLP Sales Assistant initialized');
  }

  /**
   * Handle customer interaction
   */
  async handleCustomerQuery(query, context = {}) {
    console.log(`💬 Processing customer query: ${query.substring(0, 100)}...`);
    
    try {
      // Get or create conversation context
      const conversationId = context.conversationId || 'default';
      const conversation = this.getConversation(conversationId);
      
      // Analyze query intent
      const intent = await this.analyzeIntent(query);
      console.log(`🎯 Detected intent: ${intent.category}`);
      
      // Gather relevant context data
      const contextData = await this.gatherContextData(intent, context);
      
      // Generate response based on intent
      let response;
      switch (intent.category) {
        case 'equipment_inquiry':
          response = await this.handleEquipmentInquiry(query, contextData, conversation);
          break;
        case 'pricing_request':
          response = await this.handlePricingRequest(query, contextData, conversation);
          break;
        case 'rental_booking':
          response = await this.handleRentalBooking(query, contextData, conversation);
          break;
        case 'support_request':
          response = await this.handleSupportRequest(query, contextData, conversation);
          break;
        case 'general_information':
          response = await this.handleGeneralInformation(query, contextData, conversation);
          break;
        default:
          response = await this.handleGeneralQuery(query, contextData, conversation);
      }
      
      // Update conversation history
      this.updateConversation(conversationId, query, response.content);
      
      // Check if lead should be created or updated
      if (intent.shouldCreateLead && context.customerInfo) {
        await this.processLeadFromConversation(context.customerInfo, intent, query);
      }
      
      return {
        success: true,
        response: response.content,
        intent: intent.category,
        confidence: intent.confidence,
        conversationId,
        nextActions: response.nextActions || []
      };
      
    } catch (error) {
      console.error('❌ Error processing customer query:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackResponse: "I apologize, but I'm experiencing technical difficulties. Please contact our sales team directly at your convenience."
      };
    }
  }

  /**
   * Analyze customer query intent
   */
  async analyzeIntent(query) {
    const messages = [
      {
        role: "system",
        content: `You are an intent classifier for ASP Cranes customer queries. 

Classify the query into one of these categories:
- equipment_inquiry: Questions about crane types, specifications, availability
- pricing_request: Requests for quotes, pricing information, cost estimates
- rental_booking: Intent to book or reserve equipment
- support_request: Technical support, service issues, complaints
- general_information: Company info, locations, contact details

Respond with JSON: {"category": "intent_name", "confidence": 0.8, "shouldCreateLead": true/false, "extractedInfo": {...}}`
      },
      {
        role: "user",
        content: query
      }
    ];

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.3,
      maxTokens: 200
    });

    try {
      return JSON.parse(result.content);
    } catch (error) {
      console.error('Failed to parse intent analysis:', error.message);
      return {
        category: 'general_information',
        confidence: 0.5,
        shouldCreateLead: false,
        extractedInfo: {}
      };
    }
  }

  /**
   * Gather relevant context data based on intent
   */
  async gatherContextData(intent, context) {
    const contextData = { ...context };
    
    try {
      // Get customer history if customer ID is available
      if (context.customerId) {
        const customerResult = await customerTool.getById(context.customerId);
        if (customerResult.success) {
          contextData.customerData = customerResult.data;
          
          // Get customer's lead and deal history
          const leadHistory = await leadTool.getAll({ customer_id: context.customerId });
          const dealHistory = await dealTool.getAll({ customer_id: context.customerId });
          
          contextData.leadHistory = leadHistory.success ? leadHistory.data : [];
          contextData.dealHistory = dealHistory.success ? dealHistory.data : [];
        }
      }
      
      // Get recent quotations if relevant
      if (intent.category === 'pricing_request' || intent.category === 'rental_booking') {
        const recentQuotations = await quotationTool.getAll({ limit: 5, status: 'active' });
        contextData.recentQuotations = recentQuotations.success ? recentQuotations.data : [];
      }
      
    } catch (error) {
      console.error('Error gathering context data:', error.message);
    }
    
    return contextData;
  }

  /**
   * Handle equipment inquiry
   */
  async handleEquipmentInquiry(query, contextData, conversation) {
    const messages = PromptTemplates.createConversation(
      'nlp_sales',
      `Customer is asking about equipment: "${query}"
      
      Available context: ${JSON.stringify(contextData, null, 2)}
      
      Provide helpful information about our crane rental services, including:
      - Types of cranes available
      - Capacity ranges
      - Typical applications
      - General availability
      
      Ask relevant qualifying questions to understand their specific needs.`,
      contextData,
      conversation
    );

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.7
    });

    return {
      content: result.content,
      nextActions: ['qualify_requirements', 'provide_specifications']
    };
  }

  /**
   * Handle pricing request
   */
  async handlePricingRequest(query, contextData, conversation) {
    // Check if we have enough information for pricing
    const needsQualification = !contextData.equipmentType || !contextData.rentalDuration || !contextData.location;
    
    if (needsQualification) {
      const messages = PromptTemplates.createConversation(
        'nlp_sales',
        `Customer is requesting pricing: "${query}"
        
        We need to gather more information before providing accurate pricing. Ask for:
        - Type of crane/equipment needed
        - Rental duration
        - Location/site details
        - Specific project requirements
        
        Be helpful and explain why this information is needed for accurate pricing.`,
        contextData,
        conversation
      );

      const result = await openaiService.chat(messages, {
        agentType: 'nlp_sales',
        temperature: 0.7
      });

      return {
        content: result.content,
        nextActions: ['gather_pricing_requirements', 'schedule_consultation']
      };
    } else {
      // We have enough info - involve quotation agent
      const quotationRequest = await this.hub.routeRequest('quotation_agent', 'calculate_pricing', {
        query,
        contextData,
        conversation
      });

      return {
        content: quotationRequest.response || "I'll prepare a detailed quote for you. Our pricing specialist will review your requirements and provide accurate pricing shortly.",
        nextActions: ['prepare_quotation', 'schedule_follow_up']
      };
    }
  }

  /**
   * Handle rental booking
   */
  async handleRentalBooking(query, contextData, conversation) {
    const messages = PromptTemplates.createConversation(
      'nlp_sales',
      `Customer wants to book equipment: "${query}"
      
      Context: ${JSON.stringify(contextData, null, 2)}
      
      Guide them through the booking process:
      1. Confirm equipment requirements
      2. Verify rental dates
      3. Confirm location and site access
      4. Explain booking procedures
      5. Mention any required documentation
      
      If information is missing, ask for it professionally.`,
      contextData,
      conversation
    );

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.7
    });

    // Route to deal agent for opportunity creation
    await this.hub.routeRequest('deal_agent', 'create_opportunity', {
      customerInfo: contextData.customerData,
      query,
      intent: 'rental_booking'
    });

    return {
      content: result.content,
      nextActions: ['create_booking', 'collect_documentation', 'confirm_details']
    };
  }

  /**
   * Handle support request
   */
  async handleSupportRequest(query, contextData, conversation) {
    const messages = PromptTemplates.createConversation(
      'nlp_sales',
      `Customer has a support request: "${query}"
      
      Context: ${JSON.stringify(contextData, null, 2)}
      
      Provide helpful support while being empathetic:
      - Address their concern professionally
      - Provide relevant information if available
      - Escalate to appropriate team if needed
      - Offer alternative solutions
      
      If it's a technical issue, direct them to our technical support team.`,
      contextData,
      conversation
    );

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.8
    });

    return {
      content: result.content,
      nextActions: ['escalate_if_needed', 'follow_up_resolution']
    };
  }

  /**
   * Handle general information requests
   */
  async handleGeneralInformation(query, contextData, conversation) {
    const messages = PromptTemplates.createConversation(
      'nlp_sales',
      `Customer is asking for general information: "${query}"
      
      Provide helpful information about ASP Cranes:
      - Company overview and experience
      - Service areas and locations
      - Types of projects we handle
      - Contact information
      - Next steps for engagement
      
      Be professional and try to guide toward business opportunities.`,
      contextData,
      conversation
    );

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.7
    });

    return {
      content: result.content,
      nextActions: ['provide_contact_info', 'schedule_consultation']
    };
  }

  /**
   * Handle general queries (fallback)
   */
  async handleGeneralQuery(query, contextData, conversation) {
    const messages = PromptTemplates.createConversation(
      'nlp_sales',
      `Customer query: "${query}"
      
      Respond helpfully as an ASP Cranes sales representative. If you're not sure about specific details, offer to connect them with the appropriate specialist.`,
      contextData,
      conversation
    );

    const result = await openaiService.chat(messages, {
      agentType: 'nlp_sales',
      temperature: 0.8
    });

    return {
      content: result.content,
      nextActions: ['clarify_needs', 'provide_assistance']
    };
  }

  /**
   * Process lead creation from conversation
   */
  async processLeadFromConversation(customerInfo, intent, query) {
    try {
      const leadData = {
        customerName: customerInfo.name || customerInfo.company || 'Unknown',
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company,
        serviceNeeded: intent.extractedInfo.serviceType || 'Crane Rental',
        source: 'Chat Conversation',
        status: 'new',
        notes: `Lead generated from chat conversation. Original query: "${query.substring(0, 200)}..."`
      };

      // Route to lead agent for processing
      const leadResult = await this.hub.routeRequest('lead_agent', 'create_lead', {
        leadData,
        intent,
        originalQuery: query
      });

      if (leadResult.success) {
        console.log('✅ Lead created from conversation:', leadResult.data?.id);
      }
      
    } catch (error) {
      console.error('Error creating lead from conversation:', error.message);
    }
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId) || [];
  }

  /**
   * Update conversation history
   */
  updateConversation(conversationId, userMessage, assistantMessage) {
    let conversation = this.conversations.get(conversationId) || [];
    
    conversation.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    );
    
    // Keep only recent messages
    if (conversation.length > this.maxConversationLength) {
      conversation = conversation.slice(-this.maxConversationLength);
    }
    
    this.conversations.set(conversationId, conversation);
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId) {
    this.conversations.delete(conversationId);
    console.log(`🗑️ Cleared conversation: ${conversationId}`);
  }

  /**
   * Get conversation statistics
   */
  getConversationStats() {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values())
        .reduce((total, conv) => total + conv.length, 0)
    };
  }

  /**
   * Health check for NLP Sales Assistant
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    const testResult = await openaiService.chat([
      { role: 'user', content: 'Test message' }
    ], { agentType: 'nlp_sales', maxTokens: 10 });

    return {
      ...baseHealth,
      openaiConnected: testResult.success,
      conversationStats: this.getConversationStats(),
      cacheStats: openaiService.getMetrics()
    };
  }
}

export default NLPSalesAssistant;
