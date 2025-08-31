/**
 * Deal Agent
 * Specialized agent for deal management, pipeline tracking, and revenue forecasting
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { dealTool, leadTool, customerTool, quotationTool } from '../tools/CRMTools.js';

export class DealAgent extends BaseAgent {
  constructor(hub) {
    super('deal_agent', hub);
    
    this.capabilities = [
      'deal_management',
      'deal_crud',
      'pipeline_tracking',
      'revenue_forecasting',
      'opportunity_analysis',
      'competitive_analysis'
    ];
    
    this.specializations = [
      'deals',
      'opportunities',
      'pipeline_management',
      'sales_forecasting',
      'revenue_optimization'
    ];

    // Deal stage configuration
    this.dealStages = {
      'prospecting': { probability: 10, typical_duration: 14 },
      'qualification': { probability: 20, typical_duration: 7 },
      'needs_analysis': { probability: 30, typical_duration: 10 },
      'proposal': { probability: 50, typical_duration: 14 },
      'negotiation': { probability: 70, typical_duration: 7 },
      'closed_won': { probability: 100, typical_duration: 0 },
      'closed_lost': { probability: 0, typical_duration: 0 }
    };

    // Revenue forecasting models
    this.forecastingModels = {
      conservative: 0.8,
      realistic: 1.0,
      optimistic: 1.2
    };

    console.log('💼 Deal Agent initialized with pipeline and forecasting capabilities');
  }

  /**
   * Create new deal/opportunity
   */
  async create_deal(dealData, context = {}) {
    console.log('🆕 Creating new deal opportunity');
    
    try {
      // Enrich deal data
      const enrichedData = await this.enrichDealData(dealData);
      
      // Analyze opportunity potential
      const analysis = await this.analyzeDealPotential(enrichedData);
      enrichedData.opportunityScore = analysis.score;
      enrichedData.riskFactors = analysis.riskFactors;
      enrichedData.successProbability = this.dealStages[enrichedData.stage]?.probability || 10;
      
      // Create deal in CRM
      const result = await dealTool.create(enrichedData);
      
      if (result.success) {
        console.log(`✅ Deal created with ID: ${result.data.id}`);
        
        // Trigger pipeline actions
        await this.triggerPipelineActions(result.data, analysis);
        
        return {
          deal: result.data,
          analysis,
          pipelinePosition: await this.analyzePipelinePosition(result.data)
        };
      } else {
        throw new Error(result.error || 'Failed to create deal');
      }
      
    } catch (error) {
      console.error('❌ Deal creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update existing deal
   */
  async update_deal(data, context = {}) {
    const { dealId, updateData } = data;
    console.log(`📝 Updating deal: ${dealId}`);
    
    try {
      // Get current deal data
      const currentDeal = await dealTool.getById(dealId);
      if (!currentDeal.success) {
        throw new Error('Deal not found');
      }

      // Check for stage progression
      const stageChanged = updateData.stage && updateData.stage !== currentDeal.data.stage;
      
      // Enrich update data
      const enrichedData = await this.enrichDealData({
        ...currentDeal.data,
        ...updateData
      });

      // Update probability if stage changed
      if (stageChanged) {
        enrichedData.successProbability = this.dealStages[enrichedData.stage]?.probability || 10;
        enrichedData.stageChangedAt = new Date().toISOString();
        
        // Analyze stage change impact
        const stageAnalysis = await this.analyzeStageChange(
          currentDeal.data.stage,
          enrichedData.stage,
          enrichedData
        );
        enrichedData.stageChangeNotes = stageAnalysis.notes;
      }

      // Update deal
      const result = await dealTool.update(dealId, enrichedData);
      
      if (result.success) {
        console.log(`✅ Deal ${dealId} updated successfully`);
        
        // Handle stage progression actions
        if (stageChanged) {
          await this.handleStageProgression(result.data, currentDeal.data.stage);
        }
        
        return {
          deal: result.data,
          stageChanged,
          pipelineImpact: stageChanged ? await this.analyzePipelineImpact(result.data) : null
        };
      } else {
        throw new Error(result.error || 'Failed to update deal');
      }
      
    } catch (error) {
      console.error(`❌ Deal update failed for ${dealId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get deals with filtering and analytics
   */
  async get_deals(data = {}, context = {}) {
    console.log('📋 Retrieving deals with criteria:', data);
    
    try {
      const result = await dealTool.getAll(data);
      
      if (result.success) {
        // Add comprehensive analytics
        const analytics = await this.analyzeDealsSet(result.data);
        
        return {
          deals: result.data,
          count: result.data.length,
          analytics,
          pipelineHealth: await this.assessPipelineHealth(result.data)
        };
      } else {
        throw new Error(result.error || 'Failed to retrieve deals');
      }
      
    } catch (error) {
      console.error('❌ Deal retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Create opportunity from lead
   */
  async create_opportunity(data, context = {}) {
    const { leadId, opportunityData } = data;
    console.log(`🎯 Creating opportunity from lead: ${leadId}`);
    
    try {
      // Get lead data
      const leadResult = await leadTool.getById(leadId);
      if (!leadResult.success) {
        throw new Error('Lead not found');
      }

      const lead = leadResult.data;
      
      // Convert lead to opportunity
      const dealData = {
        customerName: lead.customerName,
        customerId: lead.customerId,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        serviceNeeded: lead.serviceNeeded,
        siteLocation: lead.siteLocation,
        startDate: lead.startDate,
        rentalDays: lead.rentalDays,
        stage: 'qualification',
        source: `Lead ${leadId}`,
        leadId: leadId,
        ...opportunityData
      };

      // Create the deal
      const dealResult = await this.create_deal(dealData, context);
      
      if (dealResult.success !== false) {
        // Update lead status
        await leadTool.updateStatus(leadId, 'converted');
        
        return {
          opportunity: dealResult.deal,
          convertedFromLead: leadId,
          analysis: dealResult.analysis
        };
      } else {
        throw new Error('Failed to create opportunity from lead');
      }
      
    } catch (error) {
      console.error(`❌ Opportunity creation failed for lead ${leadId}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate revenue forecast
   */
  async generate_forecast(data = {}, context = {}) {
    console.log('📈 Generating revenue forecast');
    
    try {
      const { timeframe = 'quarterly', model = 'realistic' } = data;
      
      // Get active deals
      const activeDeals = await dealTool.getAll({ 
        status: 'active',
        stage_not: ['closed_won', 'closed_lost']
      });
      
      if (!activeDeals.success) {
        throw new Error('Failed to retrieve deals for forecasting');
      }

      // Generate forecast
      const forecast = await this.calculateRevenueForecast(
        activeDeals.data,
        timeframe,
        model
      );

      return {
        forecast,
        basedOnDeals: activeDeals.data.length,
        model,
        timeframe,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Forecast generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze deal potential with AI
   */
  async analyzeDealPotential(dealData) {
    const messages = [
      {
        role: "system",
        content: `You are a deal analysis specialist for ASP Cranes. Analyze deal potential based on customer data, project requirements, and market factors.

Consider:
- Project size and complexity
- Customer financial stability
- Timeline and urgency
- Competition likelihood
- Service requirements fit
- Revenue potential

Respond with JSON: {
  "score": 0-100,
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "competitiveAdvantages": ["advantage1"],
  "recommendedActions": ["action1", "action2"],
  "estimatedValue": 50000,
  "timelineRisk": "low|medium|high"
}`
      },
      {
        role: "user",
        content: `Analyze this deal: ${JSON.stringify(dealData, null, 2)}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'deal_agent',
        temperature: 0.3,
        maxTokens: 400
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Deal potential analysis failed:', error.message);
      return {
        score: 50,
        riskFactors: ['Analysis unavailable'],
        opportunities: [],
        competitiveAdvantages: [],
        recommendedActions: ['Manual review required'],
        estimatedValue: 0,
        timelineRisk: 'medium'
      };
    }
  }

  /**
   * Analyze stage change impact
   */
  async analyzeStageChange(fromStage, toStage, dealData) {
    const messages = [
      PromptTemplates.getSystemPrompt('deal_agent'),
      {
        role: 'user',
        content: `Analyze deal stage progression:

Deal: ${JSON.stringify(dealData, null, 2)}
Stage Change: ${fromStage} → ${toStage}

Analyze:
1. Progression significance
2. Required actions for new stage
3. Risk factors to monitor
4. Success probability changes
5. Timeline implications

Provide specific recommendations for the new stage.

Respond with JSON: {
  "significance": "major|minor|concerning",
  "notes": "detailed analysis",
  "requiredActions": ["action1", "action2"],
  "risksToMonitor": ["risk1", "risk2"],
  "timelineExpectation": "days_expected",
  "successFactors": ["factor1", "factor2"]
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'deal_agent',
        temperature: 0.4,
        maxTokens: 400
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Stage change analysis failed:', error.message);
      return {
        significance: 'minor',
        notes: 'Stage progression analysis unavailable',
        requiredActions: ['Monitor progress'],
        risksToMonitor: ['Analysis failure'],
        timelineExpectation: 'unknown',
        successFactors: []
      };
    }
  }

  /**
   * Calculate revenue forecast
   */
  async calculateRevenueForecast(deals, timeframe, model) {
    const forecastData = {
      totalPipelineValue: 0,
      weightedForecast: 0,
      dealCount: deals.length,
      byStage: {},
      confidence: 0,
      modelUsed: model
    };

    const modelMultiplier = this.forecastingModels[model] || 1.0;
    
    deals.forEach(deal => {
      const value = parseFloat(deal.estimatedValue || deal.value || 0);
      const probability = (deal.successProbability || this.dealStages[deal.stage]?.probability || 10) / 100;
      
      forecastData.totalPipelineValue += value;
      forecastData.weightedForecast += (value * probability * modelMultiplier);
      
      // Group by stage
      if (!forecastData.byStage[deal.stage]) {
        forecastData.byStage[deal.stage] = {
          count: 0,
          totalValue: 0,
          weightedValue: 0
        };
      }
      
      forecastData.byStage[deal.stage].count++;
      forecastData.byStage[deal.stage].totalValue += value;
      forecastData.byStage[deal.stage].weightedValue += (value * probability * modelMultiplier);
    });

    // Calculate confidence based on deal maturity
    const matureDeals = deals.filter(d => 
      ['proposal', 'negotiation'].includes(d.stage)
    ).length;
    forecastData.confidence = Math.min(90, (matureDeals / deals.length) * 100);

    // Add time-based adjustments
    if (timeframe === 'monthly') {
      forecastData.weightedForecast *= 0.3;
    } else if (timeframe === 'annually') {
      forecastData.weightedForecast *= 4;
    }

    return forecastData;
  }

  /**
   * Enrich deal data
   */
  async enrichDealData(dealData) {
    const enriched = { ...dealData };
    
    // Add timestamps
    if (!enriched.createdAt) {
      enriched.createdAt = new Date().toISOString();
    }
    enriched.updatedAt = new Date().toISOString();

    // Set default stage and status
    if (!enriched.stage) {
      enriched.stage = 'prospecting';
    }
    
    if (!enriched.status) {
      enriched.status = 'active';
    }

    // Calculate expected close date if not provided
    if (!enriched.expectedCloseDate && enriched.stage) {
      const stageConfig = this.dealStages[enriched.stage];
      if (stageConfig) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + stageConfig.typical_duration);
        enriched.expectedCloseDate = expectedDate.toISOString();
      }
    }

    // Estimate value if not provided
    if (!enriched.estimatedValue && enriched.serviceNeeded && enriched.rentalDays) {
      enriched.estimatedValue = await this.estimateDealValue(enriched);
    }

    return enriched;
  }

  /**
   * Estimate deal value based on service requirements
   */
  async estimateDealValue(dealData) {
    // Basic estimation logic - would be enhanced with real pricing data
    const baseRates = {
      'mobile_crane': 800,
      'tower_crane': 1500,
      'crawler_crane': 1200,
      'rough_terrain': 600,
      'all_terrain': 1000
    };

    const serviceType = dealData.serviceNeeded?.toLowerCase() || 'mobile_crane';
    const rentalDays = parseInt(dealData.rentalDays) || 1;
    const baseRate = baseRates[serviceType] || 800;
    
    return baseRate * rentalDays;
  }

  /**
   * Analyze pipeline position
   */
  async analyzePipelinePosition(deal) {
    // Get all deals for comparison
    const allDeals = await dealTool.getAll({ status: 'active' });
    
    if (!allDeals.success) {
      return { position: 'unknown', insights: [] };
    }

    const deals = allDeals.data;
    const dealValue = parseFloat(deal.estimatedValue || 0);
    
    // Calculate position metrics
    const higherValueDeals = deals.filter(d => 
      parseFloat(d.estimatedValue || 0) > dealValue
    ).length;
    
    const totalDeals = deals.length;
    const percentile = totalDeals > 0 ? ((totalDeals - higherValueDeals) / totalDeals) * 100 : 50;
    
    const insights = [];
    if (percentile >= 80) {
      insights.push('High-value opportunity');
    }
    if (deal.stage === 'negotiation') {
      insights.push('Close to conversion');
    }
    
    return {
      position: `${Math.round(percentile)}th percentile`,
      valueRank: higherValueDeals + 1,
      totalDealsInPipeline: totalDeals,
      insights
    };
  }

  /**
   * Analyze deals set for insights
   */
  async analyzeDealsSet(deals) {
    if (!deals || deals.length === 0) {
      return { message: 'No deals to analyze' };
    }

    const analytics = {
      total: deals.length,
      byStage: {},
      byStatus: {},
      totalValue: 0,
      weightedValue: 0,
      averageValue: 0,
      conversionMetrics: {}
    };

    let totalValue = 0;
    let weightedValue = 0;
    
    deals.forEach(deal => {
      const value = parseFloat(deal.estimatedValue || deal.value || 0);
      const probability = (deal.successProbability || 10) / 100;
      
      totalValue += value;
      weightedValue += (value * probability);
      
      // Stage distribution
      analytics.byStage[deal.stage] = (analytics.byStage[deal.stage] || 0) + 1;
      
      // Status distribution
      analytics.byStatus[deal.status] = (analytics.byStatus[deal.status] || 0) + 1;
    });

    analytics.totalValue = totalValue;
    analytics.weightedValue = weightedValue;
    analytics.averageValue = totalValue / deals.length;

    return analytics;
  }

  /**
   * Assess pipeline health
   */
  async assessPipelineHealth(deals) {
    const health = {
      overall: 'healthy',
      concerns: [],
      strengths: [],
      recommendations: []
    };

    if (!deals || deals.length === 0) {
      health.overall = 'concerning';
      health.concerns.push('Empty pipeline');
      health.recommendations.push('Focus on lead generation');
      return health;
    }

    // Analyze stage distribution
    const stageDistribution = {};
    deals.forEach(deal => {
      stageDistribution[deal.stage] = (stageDistribution[deal.stage] || 0) + 1;
    });

    // Check for bottlenecks
    const totalDeals = deals.length;
    const proposalStage = stageDistribution['proposal'] || 0;
    const negotiationStage = stageDistribution['negotiation'] || 0;
    
    if ((proposalStage + negotiationStage) / totalDeals > 0.6) {
      health.concerns.push('Deals stalling in late stages');
      health.recommendations.push('Focus on closing tactics');
    }

    if (stageDistribution['prospecting'] / totalDeals < 0.2) {
      health.concerns.push('Low early-stage activity');
      health.recommendations.push('Increase prospecting efforts');
    }

    // Assess overall health
    if (health.concerns.length === 0) {
      health.overall = 'excellent';
      health.strengths.push('Well-balanced pipeline');
    } else if (health.concerns.length <= 2) {
      health.overall = 'good';
    } else {
      health.overall = 'needs_attention';
    }

    return health;
  }

  /**
   * Trigger pipeline actions based on deal
   */
  async triggerPipelineActions(deal, analysis) {
    console.log(`🎬 Triggering pipeline actions for deal ${deal.id}`);
    
    try {
      // High-value deal actions
      if (analysis.estimatedValue > 25000) {
        await this.sendMessage('master_agent', 'prioritize_high_value_deal', { deal, analysis });
      }

      // Stage-specific actions
      switch (deal.stage) {
        case 'proposal':
          await this.sendMessage('quotation_agent', 'prepare_proposal', { deal });
          break;
        case 'negotiation':
          await this.sendMessage('master_agent', 'prepare_negotiation_strategy', { deal, analysis });
          break;
      }
    } catch (error) {
      console.error('Error triggering pipeline actions:', error.message);
    }
  }

  /**
   * Handle stage progression actions
   */
  async handleStageProgression(deal, fromStage) {
    console.log(`📈 Handling stage progression: ${fromStage} → ${deal.stage}`);
    
    try {
      // Notify relevant agents of stage change
      await this.sendMessage('master_agent', 'deal_stage_changed', {
        deal,
        fromStage,
        toStage: deal.stage
      });

      // Stage-specific notifications
      if (deal.stage === 'closed_won') {
        await this.sendMessage('master_agent', 'deal_won', { deal });
      } else if (deal.stage === 'closed_lost') {
        await this.sendMessage('master_agent', 'deal_lost', { deal });
      }
    } catch (error) {
      console.error('Error handling stage progression:', error.message);
    }
  }

  /**
   * Analyze pipeline impact of deal change
   */
  async analyzePipelineImpact(deal) {
    // Simple impact analysis - would be enhanced in production
    return {
      revenueImpact: deal.estimatedValue || 0,
      probabilityChange: this.dealStages[deal.stage]?.probability || 0,
      timelineImpact: this.dealStages[deal.stage]?.typical_duration || 0
    };
  }

  /**
   * Health check for Deal Agent
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    // Test CRM connectivity
    const crmTest = await dealTool.getAll({ limit: 1 });
    
    return {
      ...baseHealth,
      crmConnected: crmTest.success,
      dealStagesConfigured: Object.keys(this.dealStages).length,
      forecastingModelsAvailable: Object.keys(this.forecastingModels).length
    };
  }
}

export default DealAgent;
