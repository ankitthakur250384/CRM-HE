/**
 * Company Intelligence Agent
 * Specialized agent for company research, market analysis, and business intelligence
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { customerTool, leadTool, dealTool } from '../tools/CRMTools.js';

export class CompanyIntelligenceAgent extends BaseAgent {
  constructor(hub) {
    super('company_intelligence', hub);
    
    this.capabilities = [
      'company_research',
      'market_analysis',
      'competitive_intelligence',
      'financial_analysis',
      'industry_insights',
      'risk_assessment'
    ];
    
    this.specializations = [
      'company_analysis',
      'market_research',
      'competitive_analysis',
      'industry_trends',
      'business_intelligence'
    ];

    // Research categories and data sources
    this.researchCategories = {
      company_profile: ['company_size', 'industry', 'location', 'revenue', 'employees'],
      financial_health: ['credit_rating', 'financial_stability', 'payment_history', 'debt_ratio'],
      market_position: ['market_share', 'competitors', 'growth_trajectory', 'reputation'],
      project_history: ['previous_projects', 'equipment_usage', 'project_scale', 'success_rate'],
      decision_makers: ['key_contacts', 'decision_process', 'influence_network', 'procurement_process']
    };

    // Industry classifications and insights
    this.industryInsights = {
      construction: {
        typical_projects: ['residential', 'commercial', 'infrastructure'],
        equipment_needs: ['mobile_cranes', 'tower_cranes', 'rough_terrain'],
        seasonal_patterns: { peak: 'spring_summer', low: 'winter' },
        avg_project_duration: 90,
        typical_budget_range: { min: 10000, max: 500000 }
      },
      manufacturing: {
        typical_projects: ['facility_expansion', 'equipment_installation', 'maintenance'],
        equipment_needs: ['overhead_cranes', 'gantry_cranes', 'mobile_cranes'],
        seasonal_patterns: { peak: 'year_round', low: 'december' },
        avg_project_duration: 60,
        typical_budget_range: { min: 15000, max: 300000 }
      },
      oil_gas: {
        typical_projects: ['refinery_work', 'pipeline_construction', 'maintenance'],
        equipment_needs: ['heavy_lift_cranes', 'crawler_cranes', 'all_terrain'],
        seasonal_patterns: { peak: 'year_round', low: 'none' },
        avg_project_duration: 120,
        typical_budget_range: { min: 50000, max: 2000000 }
      }
    };

    // Risk factors and indicators
    this.riskIndicators = {
      financial: ['late_payments', 'bankruptcy_history', 'credit_issues', 'declining_revenue'],
      operational: ['safety_violations', 'project_delays', 'quality_issues', 'high_turnover'],
      market: ['industry_decline', 'increased_competition', 'regulatory_changes', 'economic_downturn']
    };

    console.log('🔍 Company Intelligence Agent initialized with research and analysis capabilities');
  }

  /**
   * Research company comprehensive profile
   */
  async research_company(data, context = {}) {
    const { companyName, domain, additionalInfo = {} } = data;
    console.log(`🔍 Researching company: ${companyName}`);
    
    try {
      // Gather basic company information
      const basicProfile = await this.gatherBasicCompanyInfo(companyName, domain);
      
      // Perform industry analysis
      const industryAnalysis = await this.analyzeIndustryContext(basicProfile);
      
      // Assess financial health
      const financialAssessment = await this.assessFinancialHealth(basicProfile, additionalInfo);
      
      // Analyze market position
      const marketPosition = await this.analyzeMarketPosition(basicProfile);
      
      // Generate comprehensive intelligence report
      const intelligenceReport = await this.generateIntelligenceReport({
        basicProfile,
        industryAnalysis,
        financialAssessment,
        marketPosition
      });

      return {
        companyProfile: basicProfile,
        industryAnalysis,
        financialAssessment,
        marketPosition,
        intelligenceReport,
        researchedAt: new Date().toISOString(),
        confidence: this.calculateConfidenceScore(intelligenceReport)
      };
      
    } catch (error) {
      console.error(`❌ Company research failed for ${companyName}:`, error.message);
      throw error;
    }
  }

  /**
   * Analyze market trends and opportunities
   */
  async analyze_market_trends(data, context = {}) {
    const { industry, region, timeframe = 'quarterly' } = data;
    console.log(`📊 Analyzing market trends for ${industry} in ${region}`);
    
    try {
      // Analyze industry trends
      const industryTrends = await this.analyzeIndustryTrends(industry, region);
      
      // Identify market opportunities
      const opportunities = await this.identifyMarketOpportunities(industryTrends, timeframe);
      
      // Assess competitive landscape
      const competitiveLandscape = await this.assessCompetitiveLandscape(industry, region);
      
      // Generate market intelligence
      const marketIntelligence = await this.generateMarketIntelligence({
        industryTrends,
        opportunities,
        competitiveLandscape,
        industry,
        region,
        timeframe
      });

      return {
        industryTrends,
        opportunities,
        competitiveLandscape,
        marketIntelligence,
        analyzedAt: new Date().toISOString(),
        timeframe,
        nextReviewDate: this.calculateNextReviewDate(timeframe)
      };
      
    } catch (error) {
      console.error(`❌ Market analysis failed for ${industry}:`, error.message);
      throw error;
    }
  }

  /**
   * Assess customer potential and risk
   */
  async assess_customer_potential(data, context = {}) {
    const { customerId, companyData } = data;
    console.log(`🎯 Assessing customer potential: ${customerId || companyData.name}`);
    
    try {
      // Get customer history if available
      let customerHistory = {};
      if (customerId) {
        const historyResult = await customerTool.getCustomerHistory(customerId);
        customerHistory = historyResult.success ? historyResult.data : {};
      }

      // Analyze business potential
      const potentialAnalysis = await this.analyzeBusinessPotential(companyData, customerHistory);
      
      // Assess risks
      const riskAssessment = await this.performRiskAssessment(companyData, customerHistory);
      
      // Generate recommendations
      const recommendations = await this.generateCustomerRecommendations(
        potentialAnalysis,
        riskAssessment,
        companyData
      );

      return {
        potentialScore: potentialAnalysis.score,
        riskLevel: riskAssessment.level,
        potentialAnalysis,
        riskAssessment,
        recommendations,
        assessedAt: new Date().toISOString(),
        nextAssessmentDate: this.calculateNextAssessmentDate(riskAssessment.level)
      };
      
    } catch (error) {
      console.error(`❌ Customer assessment failed:`, error.message);
      throw error;
    }
  }

  /**
   * Identify decision makers and influencers
   */
  async identify_decision_makers(data, context = {}) {
    const { companyName, industry, projectType } = data;
    console.log(`👥 Identifying decision makers for ${companyName}`);
    
    try {
      // Analyze company structure
      const organizationalStructure = await this.analyzeOrganizationalStructure(
        companyName,
        industry
      );
      
      // Identify key roles for project type
      const keyRoles = await this.identifyKeyRoles(projectType, industry);
      
      // Map decision-making process
      const decisionProcess = await this.mapDecisionMakingProcess(
        organizationalStructure,
        keyRoles,
        projectType
      );

      return {
        organizationalStructure,
        keyRoles,
        decisionProcess,
        primaryContacts: decisionProcess.primaryContacts || [],
        influencers: decisionProcess.influencers || [],
        mappedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Decision maker identification failed for ${companyName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate competitive analysis
   */
  async generate_competitive_analysis(data, context = {}) {
    const { competitors, market, analysisType = 'comprehensive' } = data;
    console.log(`⚔️ Generating competitive analysis for ${market}`);
    
    try {
      // Analyze each competitor
      const competitorAnalyses = await Promise.all(
        competitors.map(competitor => this.analyzeCompetitor(competitor, market))
      );
      
      // Perform comparative analysis
      const comparativeAnalysis = await this.performComparativeAnalysis(
        competitorAnalyses,
        market
      );
      
      // Identify competitive advantages and threats
      const strategicInsights = await this.generateStrategicInsights(
        comparativeAnalysis,
        analysisType
      );

      return {
        competitorAnalyses,
        comparativeAnalysis,
        strategicInsights,
        marketPosition: strategicInsights.ourPosition,
        threats: strategicInsights.threats,
        opportunities: strategicInsights.opportunities,
        analyzedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Competitive analysis failed:`, error.message);
      throw error;
    }
  }

  /**
   * Gather basic company information
   */
  async gatherBasicCompanyInfo(companyName, domain) {
    // In a real implementation, this would integrate with external APIs
    // For now, we'll use AI to analyze available information
    
    const messages = [
      {
        role: "system",
        content: `You are a business intelligence researcher. Analyze the provided company information and generate a comprehensive company profile.

Provide structured analysis covering:
- Company size and structure
- Industry classification
- Geographic presence
- Key business activities
- Financial indicators (if available)
- Recent news or developments

Respond with JSON structure for easy parsing.`
      },
      {
        role: "user",
        content: `Research this company:
Company Name: ${companyName}
Domain: ${domain || 'Not provided'}

Generate a basic company profile with available information and reasonable assumptions based on industry patterns.

Respond with JSON: {
  "name": "${companyName}",
  "industry": "industry_classification",
  "size": "small|medium|large|enterprise",
  "employees": "estimated_range",
  "revenue": "estimated_range",
  "locations": ["location1", "location2"],
  "businessType": "description",
  "keyActivities": ["activity1", "activity2"],
  "establishedYear": "estimated_year",
  "confidence": 0.7
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'company_intelligence',
        temperature: 0.3,
        maxTokens: 400
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Basic company info gathering failed:', error.message);
      return {
        name: companyName,
        industry: 'unknown',
        size: 'unknown',
        confidence: 0.1
      };
    }
  }

  /**
   * Analyze industry context
   */
  async analyzeIndustryContext(companyProfile) {
    const industry = companyProfile.industry;
    const industryData = this.industryInsights[industry] || this.industryInsights.construction;
    
    const messages = [
      PromptTemplates.getSystemPrompt('company_intelligence'),
      {
        role: 'user',
        content: `Analyze the industry context for this company:

Company Profile: ${JSON.stringify(companyProfile, null, 2)}
Industry Data: ${JSON.stringify(industryData, null, 2)}

Provide analysis of:
1. Industry health and trends
2. Growth opportunities
3. Market challenges
4. Seasonal factors
5. Technology trends
6. Regulatory environment

Focus on crane rental and construction equipment relevance.

Respond with JSON: {
  "industryHealth": "excellent|good|fair|poor",
  "growthRate": "percentage_estimate",
  "trends": ["trend1", "trend2"],
  "challenges": ["challenge1", "challenge2"],
  "opportunities": ["opp1", "opp2"],
  "seasonality": "high|medium|low",
  "equipmentDemand": "high|medium|low",
  "outlook": "positive|neutral|negative"
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'company_intelligence',
        temperature: 0.4,
        maxTokens: 500
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Industry analysis failed:', error.message);
      return {
        industryHealth: 'fair',
        growthRate: '3-5%',
        trends: [],
        challenges: ['Analysis unavailable'],
        opportunities: [],
        seasonality: 'medium',
        equipmentDemand: 'medium',
        outlook: 'neutral'
      };
    }
  }

  /**
   * Assess financial health
   */
  async assessFinancialHealth(companyProfile, additionalInfo) {
    const messages = [
      PromptTemplates.getSystemPrompt('company_intelligence'),
      {
        role: 'user',
        content: `Assess the financial health of this company:

Company Profile: ${JSON.stringify(companyProfile, null, 2)}
Additional Info: ${JSON.stringify(additionalInfo, null, 2)}

Consider:
1. Company size and industry stability
2. Payment history (if available)
3. Industry financial norms
4. Market position indicators
5. Risk factors

Provide financial health assessment for credit and partnership decisions.

Respond with JSON: {
  "creditRating": "excellent|good|fair|poor|unknown",
  "paymentRisk": "low|medium|high|unknown",
  "financialStability": "stable|uncertain|unstable",
  "riskFactors": ["factor1", "factor2"],
  "positiveIndicators": ["indicator1", "indicator2"],
  "recommendedCreditLimit": 50000,
  "paymentTerms": "net_30|net_15|prepay",
  "confidence": 0.7
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'company_intelligence',
        temperature: 0.3,
        maxTokens: 400
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Financial assessment failed:', error.message);
      return {
        creditRating: 'unknown',
        paymentRisk: 'medium',
        financialStability: 'uncertain',
        riskFactors: ['Assessment unavailable'],
        positiveIndicators: [],
        recommendedCreditLimit: 10000,
        paymentTerms: 'net_15',
        confidence: 0.3
      };
    }
  }

  /**
   * Analyze market position
   */
  async analyzeMarketPosition(companyProfile) {
    const messages = [
      PromptTemplates.getSystemPrompt('company_intelligence'),
      {
        role: 'user',
        content: `Analyze the market position of this company:

Company Profile: ${JSON.stringify(companyProfile, null, 2)}

Assess:
1. Market presence and reputation
2. Competitive position
3. Growth trajectory
4. Market share (estimated)
5. Competitive advantages
6. Strategic positioning

Focus on their potential as a crane rental customer.

Respond with JSON: {
  "marketPosition": "leader|strong|moderate|weak|niche",
  "reputation": "excellent|good|fair|poor|unknown",
  "competitiveAdvantages": ["advantage1", "advantage2"],
  "marketShare": "estimated_percentage",
  "growthStage": "startup|growth|mature|decline",
  "strategicImportance": "high|medium|low",
  "partnershipPotential": "high|medium|low"
}`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'company_intelligence',
        temperature: 0.4,
        maxTokens: 300
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Market position analysis failed:', error.message);
      return {
        marketPosition: 'moderate',
        reputation: 'unknown',
        competitiveAdvantages: [],
        marketShare: 'unknown',
        growthStage: 'mature',
        strategicImportance: 'medium',
        partnershipPotential: 'medium'
      };
    }
  }

  /**
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(analysisData) {
    const messages = [
      PromptTemplates.getSystemPrompt('company_intelligence'),
      {
        role: 'user',
        content: `Generate a comprehensive business intelligence report:

Analysis Data: ${JSON.stringify(analysisData, null, 2)}

Create an executive summary with:
1. Key findings and insights
2. Business opportunities
3. Risk factors and mitigation
4. Recommended engagement strategy
5. Next steps and actions

Focus on actionable intelligence for sales and business development.`
      }
    ];

    try {
      const result = await openaiService.chat(messages, {
        agentType: 'company_intelligence',
        temperature: 0.5,
        maxTokens: 600
      });

      return {
        executiveSummary: result.content,
        keyFindings: this.extractKeyFindings(analysisData),
        recommendedActions: this.generateRecommendedActions(analysisData),
        confidenceLevel: this.calculateConfidenceScore(analysisData)
      };
    } catch (error) {
      console.error('Intelligence report generation failed:', error.message);
      return {
        executiveSummary: 'Intelligence report generation failed. Manual review required.',
        keyFindings: [],
        recommendedActions: ['Conduct manual research'],
        confidenceLevel: 0.1
      };
    }
  }

  /**
   * Analyze business potential
   */
  async analyzeBusinessPotential(companyData, customerHistory) {
    let score = 50; // Base score
    const factors = [];

    // Company size scoring
    switch (companyData.size) {
      case 'enterprise': score += 20; factors.push('Large enterprise'); break;
      case 'large': score += 15; factors.push('Large company'); break;
      case 'medium': score += 10; factors.push('Medium company'); break;
      case 'small': score += 5; factors.push('Small company'); break;
    }

    // Industry scoring
    if (companyData.industry === 'construction') {
      score += 15;
      factors.push('Construction industry - high equipment need');
    } else if (companyData.industry === 'manufacturing') {
      score += 10;
      factors.push('Manufacturing industry - moderate equipment need');
    }

    // Customer history scoring
    if (customerHistory.previousRentals > 0) {
      score += 10;
      factors.push('Existing customer with rental history');
    }

    if (customerHistory.totalSpent > 50000) {
      score += 15;
      factors.push('High-value customer');
    }

    return {
      score: Math.min(100, score),
      level: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
      factors,
      revenue_potential: this.estimateRevenuePotential(companyData, score)
    };
  }

  /**
   * Perform risk assessment
   */
  async performRiskAssessment(companyData, customerHistory) {
    let riskScore = 0;
    const risks = [];

    // Industry risk factors
    if (companyData.industry === 'oil_gas') {
      riskScore += 5;
      risks.push('Oil & gas industry volatility');
    }

    // Size-based risk
    if (companyData.size === 'small') {
      riskScore += 10;
      risks.push('Small company financial instability risk');
    }

    // Payment history risk
    if (customerHistory.latePayments > 0) {
      riskScore += 15;
      risks.push('History of late payments');
    }

    const level = riskScore <= 10 ? 'low' : riskScore <= 25 ? 'medium' : 'high';

    return {
      score: riskScore,
      level,
      risks,
      mitigation: this.generateRiskMitigation(level, risks)
    };
  }

  /**
   * Generate customer recommendations
   */
  async generateCustomerRecommendations(potentialAnalysis, riskAssessment, companyData) {
    const recommendations = [];

    if (potentialAnalysis.level === 'high') {
      recommendations.push('Prioritize for direct sales engagement');
      recommendations.push('Assign senior sales representative');
    }

    if (riskAssessment.level === 'high') {
      recommendations.push('Require prepayment or deposit');
      recommendations.push('Implement stricter credit monitoring');
    } else if (riskAssessment.level === 'low') {
      recommendations.push('Offer extended payment terms');
      recommendations.push('Consider volume discounts');
    }

    if (companyData.industry === 'construction') {
      recommendations.push('Focus on mobile and tower crane solutions');
      recommendations.push('Highlight seasonal availability');
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  calculateConfidenceScore(data) {
    // Simple confidence calculation based on data completeness
    const totalFields = 20;
    let completedFields = 0;

    const checkObject = (obj) => {
      Object.values(obj).forEach(value => {
        if (value && value !== 'unknown' && value !== 'unavailable') {
          completedFields++;
        }
      });
    };

    if (typeof data === 'object') {
      checkObject(data);
    }

    return Math.min(1.0, completedFields / totalFields);
  }

  calculateNextReviewDate(timeframe) {
    const date = new Date();
    switch (timeframe) {
      case 'monthly': date.setMonth(date.getMonth() + 1); break;
      case 'quarterly': date.setMonth(date.getMonth() + 3); break;
      case 'annually': date.setFullYear(date.getFullYear() + 1); break;
      default: date.setMonth(date.getMonth() + 3);
    }
    return date.toISOString();
  }

  calculateNextAssessmentDate(riskLevel) {
    const date = new Date();
    switch (riskLevel) {
      case 'high': date.setMonth(date.getMonth() + 3); break;
      case 'medium': date.setMonth(date.getMonth() + 6); break;
      case 'low': date.setFullYear(date.getFullYear() + 1); break;
    }
    return date.toISOString();
  }

  estimateRevenuePotential(companyData, potentialScore) {
    const baseRevenue = {
      small: 25000,
      medium: 75000,
      large: 200000,
      enterprise: 500000
    };

    const base = baseRevenue[companyData.size] || 25000;
    return Math.round(base * (potentialScore / 100));
  }

  generateRiskMitigation(level, risks) {
    const mitigations = [];
    
    if (level === 'high') {
      mitigations.push('Require security deposit');
      mitigations.push('Monthly payment terms maximum');
      mitigations.push('Regular credit monitoring');
    } else if (level === 'medium') {
      mitigations.push('Standard payment terms');
      mitigations.push('Quarterly credit review');
    } else {
      mitigations.push('Extended payment terms available');
      mitigations.push('Annual credit review');
    }

    return mitigations;
  }

  extractKeyFindings(analysisData) {
    const findings = [];
    
    if (analysisData.industryAnalysis?.industryHealth === 'excellent') {
      findings.push('Industry shows excellent health');
    }
    
    if (analysisData.financialAssessment?.creditRating === 'excellent') {
      findings.push('Excellent credit rating');
    }
    
    if (analysisData.marketPosition?.marketPosition === 'leader') {
      findings.push('Market leader position');
    }

    return findings;
  }

  generateRecommendedActions(analysisData) {
    const actions = [];
    
    actions.push('Schedule initial business meeting');
    actions.push('Prepare customized service proposal');
    
    if (analysisData.financialAssessment?.creditRating === 'poor') {
      actions.push('Require prepayment for services');
    }
    
    return actions;
  }

  /**
   * Health check for Company Intelligence Agent
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    return {
      ...baseHealth,
      researchCategoriesLoaded: Object.keys(this.researchCategories).length,
      industryInsightsAvailable: Object.keys(this.industryInsights).length,
      riskIndicatorsConfigured: Object.keys(this.riskIndicators).length
    };
  }
}

export default CompanyIntelligenceAgent;
