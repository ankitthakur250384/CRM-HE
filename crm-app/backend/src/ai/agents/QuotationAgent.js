/**
 * Quotation Agent
 * Specialized agent for pricing calculations, proposal generation, and quotation management
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { quotationTool, dealTool, customerTool } from '../tools/CRMTools.js';

export class QuotationAgent extends BaseAgent {
  constructor(hub) {
    super('quotation_agent', hub);
    
    this.capabilities = [
      'quotation_management',
      'quotation_crud',
      'pricing_calculations',
      'proposal_generation',
      'cost_optimization',
      'competitive_pricing'
    ];
    
    this.specializations = [
      'quotations',
      'proposals',
      'pricing',
      'cost_analysis',
      'profit_optimization'
    ];

    // Pricing configuration
    this.pricingModels = {
      standard: {
        mobile_crane: { daily: 800, weekly: 5200, monthly: 20000 },
        tower_crane: { daily: 1500, weekly: 9750, monthly: 37500 },
        crawler_crane: { daily: 1200, weekly: 7800, monthly: 30000 },
        rough_terrain: { daily: 600, weekly: 3900, monthly: 15000 },
        all_terrain: { daily: 1000, weekly: 6500, monthly: 25000 }
      },
      premium: {
        mobile_crane: { daily: 1000, weekly: 6500, monthly: 25000 },
        tower_crane: { daily: 1800, weekly: 11700, monthly: 45000 },
        crawler_crane: { daily: 1450, weekly: 9425, monthly: 36250 },
        rough_terrain: { daily: 750, weekly: 4875, monthly: 18750 },
        all_terrain: { daily: 1250, weekly: 8125, monthly: 31250 }
      }
    };

    // Discount and markup rules
    this.discountRules = {
      volume: {
        '30_plus_days': 0.15,
        '60_plus_days': 0.20,
        '90_plus_days': 0.25
      },
      loyalty: {
        'returning_customer': 0.05,
        'preferred_customer': 0.10
      },
      seasonal: {
        'off_peak': 0.10,
        'standard': 0.00,
        'peak': -0.05
      }
    };

    // Additional cost factors
    this.additionalCosts = {
      transportation: { local: 200, regional: 500, long_distance: 1000 },
      setup: { simple: 300, standard: 600, complex: 1200 },
      operator: { daily: 400, weekly: 2600, monthly: 10000 },
      insurance: { percentage: 0.03 }
    };

    console.log('📋 Quotation Agent initialized with pricing and proposal capabilities');
  }

  /**
   * Create new quotation
   */
  async create_quotation(quotationData, context = {}) {
    console.log('🆕 Creating new quotation');
    
    try {
      // Enrich quotation data with calculations
      const enrichedData = await this.enrichQuotationData(quotationData);
      
      // Calculate detailed pricing
      const pricingDetails = await this.calculateDetailedPricing(enrichedData);
      enrichedData.pricingBreakdown = pricingDetails.breakdown;
      enrichedData.totalAmount = pricingDetails.total;
      enrichedData.discountsApplied = pricingDetails.discounts;
      
      // Generate quotation number
      enrichedData.quotationNumber = await this.generateQuotationNumber();
      
      // Create quotation in CRM
      const result = await quotationTool.create(enrichedData);
      
      if (result.success) {
        console.log(`✅ Quotation created: ${enrichedData.quotationNumber}`);
        
        // Trigger follow-up actions
        await this.triggerQuotationActions(result.data, pricingDetails);
        
        return {
          quotation: result.data,
          pricingDetails,
          recommendations: await this.generatePricingRecommendations(enrichedData, pricingDetails)
        };
      } else {
        throw new Error(result.error || 'Failed to create quotation');
      }
      
    } catch (error) {
      console.error('❌ Quotation creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate pricing for a request
   */
  async calculate_pricing(data, context = {}) {
    console.log('💰 Calculating pricing');
    
    try {
      const { equipmentType, rentalDuration, location, requirements = {} } = data;
      
      if (!equipmentType || !rentalDuration) {
        throw new Error('Equipment type and rental duration are required for pricing');
      }

      // Calculate base pricing
      const basePricing = await this.calculateBasePricing(equipmentType, rentalDuration);
      
      // Apply modifiers
      const modifiedPricing = await this.applyPricingModifiers(basePricing, {
        location,
        requirements,
        customerData: context.customerData
      });

      // Generate pricing options
      const pricingOptions = await this.generatePricingOptions(modifiedPricing, data);

      return {
        basePricing,
        modifiedPricing,
        pricingOptions,
        recommendations: await this.generatePricingRecommendations(data, modifiedPricing),
        validUntil: this.calculateValidityDate()
      };
      
    } catch (error) {
      console.error('❌ Pricing calculation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate formal proposal
   */
  async generate_proposal(data, context = {}) {
    const { quotationId, templateType = 'standard' } = data;
    console.log(`📄 Generating proposal for quotation: ${quotationId}`);
    
    try {
      // Get quotation data
      const quotationResult = await quotationTool.getById(quotationId);
      if (!quotationResult.success) {
        throw new Error('Quotation not found');
      }

      const quotation = quotationResult.data;

      // Generate proposal content
      const proposalContent = await this.generateProposalContent(quotation, templateType);
      
      // Update quotation with proposal
      await quotationTool.update(quotationId, {
        proposalGenerated: true,
        proposalGeneratedAt: new Date().toISOString(),
        proposalContent: proposalContent.content,
        status: 'proposal_sent'
      });

      return {
        proposalContent,
        quotationNumber: quotation.quotationNumber,
        generatedAt: new Date().toISOString(),
        templateUsed: templateType
      };
      
    } catch (error) {
      console.error(`❌ Proposal generation failed for ${quotationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update quotation pricing
   */
  async update_pricing(data, context = {}) {
    const { quotationId, pricingChanges } = data;
    console.log(`💰 Updating pricing for quotation: ${quotationId}`);
    
    try {
      // Get current quotation
      const quotationResult = await quotationTool.getById(quotationId);
      if (!quotationResult.success) {
        throw new Error('Quotation not found');
      }

      const currentQuotation = quotationResult.data;

      // Recalculate pricing with changes
      const updatedPricing = await this.recalculatePricing(currentQuotation, pricingChanges);
      
      // Update quotation
      const updateData = {
        ...pricingChanges,
        pricingBreakdown: updatedPricing.breakdown,
        totalAmount: updatedPricing.total,
        discountsApplied: updatedPricing.discounts,
        updatedAt: new Date().toISOString(),
        pricingVersion: (currentQuotation.pricingVersion || 0) + 1
      };

      const result = await quotationTool.update(quotationId, updateData);
      
      if (result.success) {
        return {
          quotation: result.data,
          pricingChanges: updatedPricing,
          previousTotal: currentQuotation.totalAmount,
          newTotal: updatedPricing.total,
          difference: updatedPricing.total - (currentQuotation.totalAmount || 0)
        };
      } else {
        throw new Error(result.error || 'Failed to update pricing');
      }
      
    } catch (error) {
      console.error(`❌ Pricing update failed for ${quotationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get quotations with analytics
   */
  async get_quotations(data = {}, context = {}) {
    console.log('📋 Retrieving quotations with criteria:', data);
    
    try {
      const result = await quotationTool.getAll(data);
      
      if (result.success) {
        // Add analytics
        const analytics = await this.analyzeQuotationsSet(result.data);
        
        return {
          quotations: result.data,
          count: result.data.length,
          analytics,
          insights: await this.generateQuotationInsights(result.data)
        };
      } else {
        throw new Error(result.error || 'Failed to retrieve quotations');
      }
      
    } catch (error) {
      console.error('❌ Quotation retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate base pricing for equipment and duration
   */
  async calculateBasePricing(equipmentType, rentalDuration) {
    const equipment = equipmentType.toLowerCase().replace(/\s+/g, '_');
    const duration = parseInt(rentalDuration);
    
    // Get standard pricing
    const standardRates = this.pricingModels.standard[equipment];
    if (!standardRates) {
      throw new Error(`Pricing not available for equipment type: ${equipmentType}`);
    }

    let dailyRate = standardRates.daily;
    let totalCost = 0;
    let rateType = 'daily';

    // Optimize rate based on duration
    if (duration >= 30) {
      const monthlyRate = standardRates.monthly;
      const months = Math.floor(duration / 30);
      const remainingDays = duration % 30;
      totalCost = (months * monthlyRate) + (remainingDays * dailyRate);
      rateType = 'monthly_optimized';
    } else if (duration >= 7) {
      const weeklyRate = standardRates.weekly;
      const weeks = Math.floor(duration / 7);
      const remainingDays = duration % 7;
      totalCost = (weeks * weeklyRate) + (remainingDays * dailyRate);
      rateType = 'weekly_optimized';
    } else {
      totalCost = duration * dailyRate;
    }

    return {
      equipmentType,
      duration,
      dailyRate,
      totalCost,
      rateType,
      rates: standardRates
    };
  }

  /**
   * Apply pricing modifiers based on various factors
   */
  async applyPricingModifiers(basePricing, modifiers) {
    let adjustedCost = basePricing.totalCost;
    const appliedModifiers = [];

    // Location-based transportation costs
    if (modifiers.location) {
      const transportCost = this.calculateTransportationCost(modifiers.location);
      adjustedCost += transportCost;
      appliedModifiers.push({
        type: 'transportation',
        amount: transportCost,
        description: `Transportation to ${modifiers.location}`
      });
    }

    // Additional requirements
    if (modifiers.requirements) {
      const additionalCosts = this.calculateAdditionalCosts(modifiers.requirements);
      adjustedCost += additionalCosts.total;
      appliedModifiers.push(...additionalCosts.items);
    }

    // Volume discounts
    if (basePricing.duration >= 30) {
      const discountKey = basePricing.duration >= 90 ? '90_plus_days' : 
                         basePricing.duration >= 60 ? '60_plus_days' : '30_plus_days';
      const discount = this.discountRules.volume[discountKey];
      const discountAmount = adjustedCost * discount;
      adjustedCost -= discountAmount;
      appliedModifiers.push({
        type: 'volume_discount',
        amount: -discountAmount,
        description: `Volume discount for ${basePricing.duration}+ days`
      });
    }

    // Customer loyalty discounts
    if (modifiers.customerData) {
      const loyaltyDiscount = this.calculateLoyaltyDiscount(modifiers.customerData);
      if (loyaltyDiscount.amount > 0) {
        adjustedCost -= loyaltyDiscount.amount;
        appliedModifiers.push({
          type: 'loyalty_discount',
          amount: -loyaltyDiscount.amount,
          description: loyaltyDiscount.description
        });
      }
    }

    return {
      ...basePricing,
      adjustedCost,
      modifiers: appliedModifiers,
      totalSavings: appliedModifiers
        .filter(m => m.amount < 0)
        .reduce((sum, m) => sum + Math.abs(m.amount), 0)
    };
  }

  /**
   * Calculate transportation costs
   */
  calculateTransportationCost(location) {
    // Simple distance-based calculation - would use real mapping service in production
    const distance = this.estimateDistance(location);
    
    if (distance <= 50) return this.additionalCosts.transportation.local;
    if (distance <= 200) return this.additionalCosts.transportation.regional;
    return this.additionalCosts.transportation.long_distance;
  }

  /**
   * Calculate additional costs for special requirements
   */
  calculateAdditionalCosts(requirements) {
    const costs = { total: 0, items: [] };

    if (requirements.needsOperator) {
      const operatorCost = this.additionalCosts.operator.daily;
      costs.total += operatorCost;
      costs.items.push({
        type: 'operator',
        amount: operatorCost,
        description: 'Certified crane operator'
      });
    }

    if (requirements.complexSetup) {
      const setupCost = this.additionalCosts.setup.complex;
      costs.total += setupCost;
      costs.items.push({
        type: 'setup',
        amount: setupCost,
        description: 'Complex setup and configuration'
      });
    }

    if (requirements.specialInsurance) {
      const insuranceCost = 500; // Base amount for special insurance
      costs.total += insuranceCost;
      costs.items.push({
        type: 'insurance',
        amount: insuranceCost,
        description: 'Special insurance coverage'
      });
    }

    return costs;
  }

  /**
   * Calculate loyalty discount for returning customers
   */
  calculateLoyaltyDiscount(customerData) {
    if (customerData.previousRentals > 5) {
      return {
        amount: 100, // Flat discount for preferred customers
        description: 'Preferred customer discount'
      };
    } else if (customerData.previousRentals > 0) {
      return {
        amount: 50, // Small discount for returning customers
        description: 'Returning customer discount'
      };
    }
    
    return { amount: 0, description: 'No loyalty discount applicable' };
  }

  /**
   * Generate pricing options (standard, premium, budget)
   */
  async generatePricingOptions(basePricing, requestData) {
    const options = {
      budget: { ...basePricing },
      standard: { ...basePricing },
      premium: { ...basePricing }
    };

    // Budget option - reduce some services
    options.budget.adjustedCost *= 0.85;
    options.budget.description = 'Basic package with standard equipment';
    options.budget.features = ['Standard equipment', 'Basic setup', 'Standard support'];

    // Standard option - as calculated
    options.standard.description = 'Complete package with all standard services';
    options.standard.features = ['Premium equipment', 'Professional setup', 'Full support', 'Operator training'];

    // Premium option - add premium services
    options.premium.adjustedCost *= 1.25;
    options.premium.description = 'Premium package with enhanced services';
    options.premium.features = ['Latest equipment', 'Expert setup', '24/7 support', 'Certified operator', 'Insurance included'];

    return options;
  }

  /**
   * Generate detailed quotation content using AI
   */
  async generateProposalContent(quotation, templateType) {
    const messages = [
      {
        role: "system",
        content: `You are a professional proposal writer for ASP Cranes. Generate a comprehensive, professional proposal document.

Template Type: ${templateType}

Include:
- Executive summary
- Detailed scope of work
- Equipment specifications
- Pricing breakdown
- Terms and conditions
- Timeline
- Contact information

Use professional language and highlight ASP Cranes' expertise and value proposition.`
      },
      {
        role: "user",
        content: `Generate proposal content for this quotation:

${JSON.stringify(quotation, null, 2)}

Create a professional proposal document that would impress the client and clearly communicate value.`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'quotation_agent',
        temperature: 0.4,
        maxTokens: 800
      });

      return {
        content: result.content,
        templateType,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Proposal content generation failed:', error.message);
      return {
        content: this.generateFallbackProposal(quotation),
        templateType: 'fallback',
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate pricing recommendations using AI
   */
  async generatePricingRecommendations(requestData, pricingDetails) {
    const messages = [
      PromptTemplates.getSystemPrompt('quotation_agent'),
      {
        role: 'user',
        content: `Analyze this pricing scenario and provide recommendations:

Request: ${JSON.stringify(requestData, null, 2)}
Pricing: ${JSON.stringify(pricingDetails, null, 2)}

Provide recommendations for:
1. Competitive positioning
2. Pricing optimization opportunities
3. Risk factors to consider
4. Upselling possibilities
5. Negotiation strategies

Respond with JSON: {
  "competitivePosition": "above|at|below market",
  "optimizationOpportunities": ["opp1", "opp2"],
  "riskFactors": ["risk1", "risk2"],
  "upsellOpportunities": ["upsell1", "upsell2"],
  "negotiationStrategy": "approach description",
  "confidence": 0.8
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'quotation_agent',
        temperature: 0.3,
        maxTokens: 400
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Pricing recommendations failed:', error.message);
      return {
        competitivePosition: 'at market',
        optimizationOpportunities: [],
        riskFactors: ['Analysis unavailable'],
        upsellOpportunities: [],
        negotiationStrategy: 'Standard approach',
        confidence: 0.5
      };
    }
  }

  /**
   * Enrich quotation data
   */
  async enrichQuotationData(quotationData) {
    const enriched = { ...quotationData };
    
    // Add timestamps
    if (!enriched.createdAt) {
      enriched.createdAt = new Date().toISOString();
    }
    enriched.updatedAt = new Date().toISOString();

    // Set default status
    if (!enriched.status) {
      enriched.status = 'draft';
    }

    // Calculate validity date (default 30 days)
    if (!enriched.validUntil) {
      enriched.validUntil = this.calculateValidityDate();
    }

    return enriched;
  }

  /**
   * Calculate detailed pricing breakdown
   */
  async calculateDetailedPricing(quotationData) {
    const breakdown = {
      baseRental: 0,
      transportation: 0,
      setup: 0,
      operator: 0,
      insurance: 0,
      additionalServices: 0,
      subtotal: 0,
      discounts: 0,
      taxes: 0,
      total: 0
    };

    // Calculate base rental
    if (quotationData.equipmentType && quotationData.rentalDuration) {
      const basePricing = await this.calculateBasePricing(
        quotationData.equipmentType,
        quotationData.rentalDuration
      );
      breakdown.baseRental = basePricing.totalCost;
    }

    // Add transportation if location specified
    if (quotationData.location) {
      breakdown.transportation = this.calculateTransportationCost(quotationData.location);
    }

    // Calculate subtotal
    breakdown.subtotal = Object.values(breakdown)
      .filter(v => typeof v === 'number' && v > 0)
      .reduce((sum, v) => sum + v, 0);

    // Apply discounts
    if (quotationData.discountPercentage) {
      breakdown.discounts = breakdown.subtotal * (quotationData.discountPercentage / 100);
    }

    // Calculate taxes (assume 10% tax rate)
    const taxableAmount = breakdown.subtotal - breakdown.discounts;
    breakdown.taxes = taxableAmount * 0.10;

    // Calculate total
    breakdown.total = breakdown.subtotal - breakdown.discounts + breakdown.taxes;

    return {
      breakdown,
      total: breakdown.total,
      discounts: breakdown.discounts
    };
  }

  /**
   * Generate unique quotation number
   */
  async generateQuotationNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `ASP-${year}${month}${day}-${random}`;
  }

  /**
   * Calculate validity date
   */
  calculateValidityDate(days = 30) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    return validUntil.toISOString();
  }

  /**
   * Estimate distance (placeholder - would use real mapping service)
   */
  estimateDistance(location) {
    // Simple placeholder logic
    const locationLower = location.toLowerCase();
    if (locationLower.includes('local') || locationLower.includes('nearby')) return 25;
    if (locationLower.includes('city') || locationLower.includes('metro')) return 100;
    return 300; // Default to long distance
  }

  /**
   * Generate fallback proposal content
   */
  generateFallbackProposal(quotation) {
    return `
**CRANE RENTAL PROPOSAL**

**ASP Cranes - Professional Equipment Solutions**

Dear Valued Client,

We are pleased to present our proposal for your crane rental requirements.

**QUOTATION DETAILS:**
- Quotation Number: ${quotation.quotationNumber}
- Equipment: ${quotation.equipmentType}
- Duration: ${quotation.rentalDuration} days
- Total Amount: $${quotation.totalAmount}

**OUR COMMITMENT:**
- Professional, certified operators
- Well-maintained, reliable equipment
- Comprehensive insurance coverage
- 24/7 support during rental period

This quotation is valid until ${quotation.validUntil}.

Thank you for considering ASP Cranes for your project needs.

Best regards,
ASP Cranes Sales Team
`;
  }

  /**
   * Recalculate pricing with changes
   */
  async recalculatePricing(currentQuotation, changes) {
    const updatedData = { ...currentQuotation, ...changes };
    return await this.calculateDetailedPricing(updatedData);
  }

  /**
   * Analyze quotations set
   */
  async analyzeQuotationsSet(quotations) {
    if (!quotations || quotations.length === 0) {
      return { message: 'No quotations to analyze' };
    }

    const analytics = {
      total: quotations.length,
      byStatus: {},
      totalValue: 0,
      averageValue: 0,
      conversionRate: 0
    };

    let totalValue = 0;
    let convertedCount = 0;

    quotations.forEach(quotation => {
      // Status distribution
      analytics.byStatus[quotation.status] = (analytics.byStatus[quotation.status] || 0) + 1;
      
      // Value aggregation
      const value = parseFloat(quotation.totalAmount || 0);
      totalValue += value;
      
      // Conversion tracking
      if (quotation.status === 'accepted' || quotation.status === 'converted') {
        convertedCount++;
      }
    });

    analytics.totalValue = totalValue;
    analytics.averageValue = totalValue / quotations.length;
    analytics.conversionRate = (convertedCount / quotations.length) * 100;

    return analytics;
  }

  /**
   * Generate quotation insights
   */
  async generateQuotationInsights(quotations) {
    // Basic insights - would be enhanced with AI analysis
    const insights = [];
    
    if (quotations.length === 0) {
      insights.push('No quotations to analyze');
      return insights;
    }

    const avgValue = quotations.reduce((sum, q) => sum + (parseFloat(q.totalAmount) || 0), 0) / quotations.length;
    insights.push(`Average quotation value: $${Math.round(avgValue)}`);

    const pendingCount = quotations.filter(q => q.status === 'pending').length;
    if (pendingCount > 0) {
      insights.push(`${pendingCount} quotations pending customer response`);
    }

    return insights;
  }

  /**
   * Trigger quotation-related actions
   */
  async triggerQuotationActions(quotation, pricingDetails) {
    console.log(`🎬 Triggering quotation actions for ${quotation.quotationNumber}`);
    
    try {
      // High-value quotation notification
      if (pricingDetails.total > 20000) {
        await this.sendMessage('master_agent', 'high_value_quotation', { quotation, pricingDetails });
      }

      // Follow-up scheduling
      await this.sendMessage('master_agent', 'schedule_quotation_followup', { 
        quotation, 
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });
    } catch (error) {
      console.error('Error triggering quotation actions:', error.message);
    }
  }

  /**
   * Health check for Quotation Agent
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    // Test CRM connectivity
    const crmTest = await quotationTool.getAll({ limit: 1 });
    
    return {
      ...baseHealth,
      crmConnected: crmTest.success,
      pricingModelsLoaded: Object.keys(this.pricingModels).length > 0,
      discountRulesConfigured: Object.keys(this.discountRules).length > 0
    };
  }
}

export default QuotationAgent;
