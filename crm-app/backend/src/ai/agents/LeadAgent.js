/**
 * Lead Agent
 * Specialized agent for lead management, qualification, and assignment
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { leadTool, customerTool } from '../tools/CRMTools.js';

export class LeadAgent extends BaseAgent {
  constructor(hub) {
    super('lead_agent', hub);
    
    this.capabilities = [
      'lead_management',
      'lead_crud',
      'lead_qualification',
      'lead_assignment',
      'lead_analytics',
      'lead_scoring'
    ];
    
    this.specializations = [
      'leads',
      'prospect_management',
      'qualification_analysis',
      'lead_nurturing'
    ];

    // Lead scoring configuration
    this.scoringCriteria = {
      company_size: { small: 2, medium: 5, large: 8, enterprise: 10 },
      budget_range: { low: 2, medium: 5, high: 8, premium: 10 },
      urgency: { low: 1, medium: 3, high: 7, urgent: 10 },
      service_type: { one_time: 3, recurring: 7, contract: 10 },
      location: { local: 8, regional: 5, national: 3, international: 2 }
    };

    // Lead qualification thresholds
    this.qualificationThresholds = {
      hot: 35,
      warm: 20,
      cold: 10
    };

    console.log('🎯 Lead Agent initialized with scoring and qualification capabilities');
  }

  /**
   * Create new lead
   */
  async create_lead(leadData, context = {}) {
    console.log('🆕 Creating new lead');
    
    try {
      // Validate and enrich lead data
      const enrichedData = await this.enrichLeadData(leadData);
      
      // Score the lead
      const score = await this.scoreLead(enrichedData);
      enrichedData.score = score.totalScore;
      enrichedData.qualification = score.qualification;
      
      // Create lead in CRM
      const result = await leadTool.create(enrichedData);
      
      if (result.success) {
        console.log(`✅ Lead created with ID: ${result.data.id}`);
        
        // Trigger follow-up actions based on score
        await this.triggerFollowUpActions(result.data, score);
        
        return {
          lead: result.data,
          score: score,
          actions_triggered: true
        };
      } else {
        throw new Error(result.error || 'Failed to create lead');
      }
      
    } catch (error) {
      console.error('❌ Lead creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update existing lead
   */
  async update_lead(data, context = {}) {
    const { leadId, updateData } = data;
    console.log(`📝 Updating lead: ${leadId}`);
    
    try {
      // Get current lead data
      const currentLead = await leadTool.getById(leadId);
      if (!currentLead.success) {
        throw new Error('Lead not found');
      }

      // Merge and enrich update data
      const enrichedData = await this.enrichLeadData({
        ...currentLead.data,
        ...updateData
      });

      // Recalculate score if significant data changed
      if (this.hasSignificantChanges(currentLead.data, updateData)) {
        const score = await this.scoreLead(enrichedData);
        enrichedData.score = score.totalScore;
        enrichedData.qualification = score.qualification;
      }

      // Update lead
      const result = await leadTool.update(leadId, enrichedData);
      
      if (result.success) {
        console.log(`✅ Lead ${leadId} updated successfully`);
        return {
          lead: result.data,
          changes_applied: Object.keys(updateData),
          rescored: this.hasSignificantChanges(currentLead.data, updateData)
        };
      } else {
        throw new Error(result.error || 'Failed to update lead');
      }
      
    } catch (error) {
      console.error(`❌ Lead update failed for ${leadId}:`, error.message);
      throw error;
    }
  }

  /**
   * Qualify lead with AI analysis
   */
  async qualify_lead(data, context = {}) {
    const { leadId } = data;
    console.log(`🔍 Qualifying lead: ${leadId}`);
    
    try {
      // Get lead data
      const leadResult = await leadTool.getById(leadId);
      if (!leadResult.success) {
        throw new Error('Lead not found');
      }

      const lead = leadResult.data;

      // Perform AI-powered qualification analysis
      const qualificationAnalysis = await this.performQualificationAnalysis(lead);
      
      // Update lead with qualification results
      const updateData = {
        qualification: qualificationAnalysis.qualification,
        qualificationNotes: qualificationAnalysis.notes,
        nextAction: qualificationAnalysis.recommendedAction,
        score: qualificationAnalysis.score
      };

      await leadTool.update(leadId, updateData);

      return {
        qualification: qualificationAnalysis.qualification,
        score: qualificationAnalysis.score,
        analysis: qualificationAnalysis,
        recommendedActions: qualificationAnalysis.recommendedActions
      };
      
    } catch (error) {
      console.error(`❌ Lead qualification failed for ${leadId}:`, error.message);
      throw error;
    }
  }

  /**
   * Assign lead to sales representative
   */
  async assign_lead(data, context = {}) {
    const { leadId, assigneeId, assignmentReason } = data;
    console.log(`👤 Assigning lead ${leadId} to ${assigneeId}`);
    
    try {
      // Update lead assignment
      const result = await leadTool.assignLead(leadId, assigneeId);
      
      if (result.success) {
        // Create assignment notes
        const assignmentNotes = `Lead assigned to ${assigneeId}. Reason: ${assignmentReason || 'Manual assignment'}`;
        
        await leadTool.update(leadId, {
          assignmentNotes,
          assignedAt: new Date().toISOString(),
          status: 'assigned'
        });

        return {
          assigned: true,
          assignee: assigneeId,
          assignmentNotes,
          lead: result.data
        };
      } else {
        throw new Error(result.error || 'Failed to assign lead');
      }
      
    } catch (error) {
      console.error(`❌ Lead assignment failed for ${leadId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get leads by various criteria
   */
  async get_leads(data = {}, context = {}) {
    console.log('📋 Retrieving leads with criteria:', data);
    
    try {
      const result = await leadTool.getAll(data);
      
      if (result.success) {
        // Add analytics to the response
        const analytics = this.analyzeLeadSet(result.data);
        
        return {
          leads: result.data,
          count: result.data.length,
          analytics
        };
      } else {
        throw new Error(result.error || 'Failed to retrieve leads');
      }
      
    } catch (error) {
      console.error('❌ Lead retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Enrich lead data with additional information
   */
  async enrichLeadData(leadData) {
    const enriched = { ...leadData };
    
    // Add timestamps if missing
    if (!enriched.createdAt) {
      enriched.createdAt = new Date().toISOString();
    }
    enriched.updatedAt = new Date().toISOString();

    // Normalize phone number format
    if (enriched.phone) {
      enriched.phone = this.normalizePhoneNumber(enriched.phone);
    }

    // Standardize email
    if (enriched.email) {
      enriched.email = enriched.email.toLowerCase().trim();
    }

    // Extract company domain for enrichment
    if (enriched.email && !enriched.companyDomain) {
      const domain = enriched.email.split('@')[1];
      if (domain && !this.isPersonalEmailDomain(domain)) {
        enriched.companyDomain = domain;
      }
    }

    // Set default status if not provided
    if (!enriched.status) {
      enriched.status = 'new';
    }

    return enriched;
  }

  /**
   * Score lead based on multiple criteria
   */
  async scoreLead(leadData) {
    console.log('📊 Scoring lead');
    
    let totalScore = 0;
    const scoreBreakdown = {};

    // Company size scoring
    if (leadData.companySize) {
      const sizeScore = this.scoringCriteria.company_size[leadData.companySize] || 0;
      totalScore += sizeScore;
      scoreBreakdown.companySize = sizeScore;
    }

    // Budget range scoring
    if (leadData.budgetRange) {
      const budgetScore = this.scoringCriteria.budget_range[leadData.budgetRange] || 0;
      totalScore += budgetScore;
      scoreBreakdown.budgetRange = budgetScore;
    }

    // Urgency scoring
    if (leadData.urgency) {
      const urgencyScore = this.scoringCriteria.urgency[leadData.urgency] || 0;
      totalScore += urgencyScore;
      scoreBreakdown.urgency = urgencyScore;
    }

    // Service type scoring
    if (leadData.serviceType) {
      const serviceScore = this.scoringCriteria.service_type[leadData.serviceType] || 0;
      totalScore += serviceScore;
      scoreBreakdown.serviceType = serviceScore;
    }

    // Location scoring
    if (leadData.location) {
      const locationScore = this.scoringCriteria.location[leadData.location] || 0;
      totalScore += locationScore;
      scoreBreakdown.location = locationScore;
    }

    // AI-powered scoring for complex factors
    const aiScore = await this.performAIScoring(leadData);
    totalScore += aiScore.score;
    scoreBreakdown.aiFactors = aiScore.score;

    // Determine qualification level
    let qualification;
    if (totalScore >= this.qualificationThresholds.hot) {
      qualification = 'hot';
    } else if (totalScore >= this.qualificationThresholds.warm) {
      qualification = 'warm';
    } else {
      qualification = 'cold';
    }

    return {
      totalScore,
      qualification,
      scoreBreakdown,
      aiInsights: aiScore.insights
    };
  }

  /**
   * Perform AI-powered lead scoring
   */
  async performAIScoring(leadData) {
    const messages = [
      {
        role: "system",
        content: `You are a lead scoring specialist for ASP Cranes. Analyze lead data and provide additional scoring based on qualitative factors.

Consider:
- Quality of communication and inquiry
- Specific requirements mentioned
- Timeline and project details
- Decision-making authority indicators
- Previous interaction quality

Respond with JSON: {
  "score": 0-15,
  "insights": "explanation of scoring factors",
  "redFlags": ["any concerns"],
  "positiveIndicators": ["positive signals"]
}`
      },
      {
        role: "user",
        content: `Analyze this lead data: ${JSON.stringify(leadData, null, 2)}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'lead_agent',
        temperature: 0.3,
        maxTokens: 300
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('AI scoring failed:', error.message);
      return {
        score: 0,
        insights: 'AI scoring unavailable',
        redFlags: [],
        positiveIndicators: []
      };
    }
  }

  /**
   * Perform comprehensive lead qualification analysis
   */
  async performQualificationAnalysis(lead) {
    const messages = [
      PromptTemplates.getSystemPrompt('lead_agent'),
      {
        role: 'user',
        content: `Perform comprehensive qualification analysis for this lead:

Lead Data: ${JSON.stringify(lead, null, 2)}

Analyze:
1. BANT qualification (Budget, Authority, Need, Timeline)
2. Project fit with ASP Cranes services
3. Decision-making process and stakeholders
4. Competition and pricing sensitivity
5. Risk factors and opportunities

Provide detailed qualification assessment with specific recommendations.

Respond with JSON: {
  "qualification": "hot|warm|cold|unqualified",
  "score": 0-50,
  "bant": {
    "budget": "qualified|unknown|insufficient",
    "authority": "decision_maker|influencer|unknown",
    "need": "immediate|future|unclear",
    "timeline": "urgent|planned|flexible"
  },
  "notes": "detailed analysis",
  "recommendedAction": "next step",
  "recommendedActions": ["action1", "action2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"]
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'lead_agent',
        temperature: 0.4,
        maxTokens: 600
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Qualification analysis failed:', error.message);
      return {
        qualification: 'unknown',
        score: 0,
        bant: { budget: 'unknown', authority: 'unknown', need: 'unclear', timeline: 'flexible' },
        notes: 'Qualification analysis failed',
        recommendedAction: 'Manual review required',
        recommendedActions: ['Manual review'],
        risks: ['Analysis failure'],
        opportunities: []
      };
    }
  }

  /**
   * Trigger follow-up actions based on lead score
   */
  async triggerFollowUpActions(lead, score) {
    console.log(`🎬 Triggering follow-up actions for ${score.qualification} lead`);
    
    try {
      switch (score.qualification) {
        case 'hot':
          await this.sendMessage('master_agent', 'handle_hot_lead', { lead, score });
          break;
        case 'warm':
          await this.sendMessage('master_agent', 'schedule_follow_up', { lead, score });
          break;
        case 'cold':
          await this.sendMessage('master_agent', 'add_to_nurture_campaign', { lead, score });
          break;
      }
    } catch (error) {
      console.error('Error triggering follow-up actions:', error.message);
    }
  }

  /**
   * Check if lead update has significant changes requiring re-scoring
   */
  hasSignificantChanges(currentData, updateData) {
    const significantFields = ['companySize', 'budgetRange', 'urgency', 'serviceType', 'location'];
    return significantFields.some(field => 
      updateData.hasOwnProperty(field) && updateData[field] !== currentData[field]
    );
  }

  /**
   * Analyze a set of leads for insights
   */
  analyzeLeadSet(leads) {
    if (!leads || leads.length === 0) {
      return { message: 'No leads to analyze' };
    }

    const analytics = {
      total: leads.length,
      byStatus: {},
      byQualification: {},
      bySource: {},
      averageScore: 0,
      conversionMetrics: {}
    };

    let totalScore = 0;
    
    leads.forEach(lead => {
      // Status distribution
      analytics.byStatus[lead.status] = (analytics.byStatus[lead.status] || 0) + 1;
      
      // Qualification distribution
      if (lead.qualification) {
        analytics.byQualification[lead.qualification] = (analytics.byQualification[lead.qualification] || 0) + 1;
      }
      
      // Source distribution
      if (lead.source) {
        analytics.bySource[lead.source] = (analytics.bySource[lead.source] || 0) + 1;
      }
      
      // Score aggregation
      if (lead.score) {
        totalScore += lead.score;
      }
    });

    analytics.averageScore = totalScore / leads.length;

    return analytics;
  }

  /**
   * Utility functions
   */
  normalizePhoneNumber(phone) {
    return phone.replace(/\D/g, '').replace(/^1/, '');
  }

  isPersonalEmailDomain(domain) {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    return personalDomains.includes(domain.toLowerCase());
  }

  /**
   * Health check for Lead Agent
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    // Test CRM connectivity
    const crmTest = await leadTool.getAll({ limit: 1 });
    
    return {
      ...baseHealth,
      crmConnected: crmTest.success,
      scoringEnabled: Object.keys(this.scoringCriteria).length > 0,
      qualificationThresholds: this.qualificationThresholds
    };
  }
}

export default LeadAgent;
