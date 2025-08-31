/**
 * Master Agent - Orchestrator for the multi-agent CRM system
 * Coordinates activities between specialized agents and ensures optimal workflow
 */
import { BaseAgent } from './BaseAgent.js';
import { openaiService, PromptTemplates } from '../services/OpenAIService.js';
import { leadTool, dealTool, quotationTool, customerTool } from '../tools/CRMTools.js';

export class MasterAgent extends BaseAgent {
  constructor(hub) {
    super('master_agent', hub);
    
    this.capabilities = [
      'workflow_orchestration',
      'task_prioritization',
      'agent_coordination',
      'decision_making',
      'performance_monitoring',
      'strategic_planning'
    ];
    
    this.specializations = [
      'system_coordination',
      'business_intelligence',
      'workflow_optimization',
      'strategic_decisions'
    ];

    // Workflow and task management
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.priorities = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4
    };

    // Performance tracking
    this.agentPerformance = new Map();
    this.workflowMetrics = {
      tasksCompleted: 0,
      tasksQueued: 0,
      averageProcessingTime: 0,
      successRate: 0
    };

    console.log('👑 Master Agent initialized - Ready to coordinate CRM workflow');
    this.startPerformanceMonitoring();
  }

  /**
   * Main orchestration method - coordinates multi-agent workflows
   */
  async orchestrateWorkflow(request) {
    console.log(`🎯 Master Agent orchestrating: ${request.type}`);
    
    try {
      // Analyze the request and determine workflow
      const workflow = await this.analyzeAndPlanWorkflow(request);
      console.log(`📋 Planned workflow with ${workflow.steps.length} steps`);

      // Execute workflow steps
      const results = await this.executeWorkflow(workflow, request);

      // Analyze results and coordinate follow-up actions
      const finalResult = await this.coordinateFollowUp(results, request);

      return {
        success: true,
        workflowId: workflow.id,
        results: finalResult,
        metrics: this.getWorkflowMetrics(),
        nextActions: finalResult.recommendedActions || []
      };

    } catch (error) {
      console.error('❌ Workflow orchestration failed:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackActions: await this.generateFallbackActions(request)
      };
    }
  }

  /**
   * Analyze request and plan optimal workflow
   */
  async analyzeAndPlanWorkflow(request) {
    const messages = [
      PromptTemplates.getSystemPrompt('master_agent'),
      {
        role: 'user',
        content: `Analyze this CRM request and plan an optimal workflow:

Request Type: ${request.type}
Data: ${JSON.stringify(request.data, null, 2)}
Context: ${JSON.stringify(request.context || {}, null, 2)}

Available agents:
- lead_agent: Lead management, qualification, assignment
- deal_agent: Opportunity management, pipeline tracking, forecasting
- quotation_agent: Pricing calculations, proposal generation
- company_intelligence: Market research, company analysis
- nlp_sales_assistant: Customer interactions, sales support

Plan a workflow with specific steps, agent assignments, and dependencies.
Respond with JSON: {
  "id": "workflow_id",
  "priority": "high|medium|low",
  "steps": [
    {
      "stepId": "step1",
      "agent": "agent_name",
      "action": "action_name",
      "data": {...},
      "dependencies": ["step0"],
      "estimatedTime": 30
    }
  ],
  "expectedOutcome": "description"
}`
      }
    ];

    const result = await openaiService.chat(messages, {
      agentType: 'master_agent',
      temperature: 0.3,
      maxTokens: 800
    });

    try {
      const workflow = JSON.parse(result.content);
      workflow.id = workflow.id || this.generateWorkflowId();
      workflow.createdAt = Date.now();
      workflow.status = 'planned';
      
      return workflow;
    } catch (error) {
      console.error('Failed to parse workflow plan:', error.message);
      return this.createFallbackWorkflow(request);
    }
  }

  /**
   * Execute planned workflow
   */
  async executeWorkflow(workflow, originalRequest) {
    console.log(`⚡ Executing workflow: ${workflow.id}`);
    
    const results = new Map();
    const completedSteps = new Set();
    workflow.status = 'executing';

    // Execute steps based on dependencies
    for (const step of workflow.steps) {
      try {
        // Check if dependencies are met
        const dependenciesMet = step.dependencies.every(dep => completedSteps.has(dep));
        
        if (!dependenciesMet) {
          console.log(`⏳ Waiting for dependencies: ${step.stepId}`);
          continue;
        }

        console.log(`🔄 Executing step: ${step.stepId} with ${step.agent}`);
        
        // Prepare step data with results from previous steps
        const stepData = {
          ...step.data,
          workflowId: workflow.id,
          previousResults: Object.fromEntries(results),
          originalRequest
        };

        // Execute step through agent hub
        const stepResult = await this.hub.routeRequest(step.agent, step.action, stepData);
        
        results.set(step.stepId, {
          ...stepResult,
          executedAt: Date.now(),
          agent: step.agent,
          action: step.action
        });

        completedSteps.add(step.stepId);
        
        // Update agent performance tracking
        this.updateAgentPerformance(step.agent, stepResult.success);

      } catch (error) {
        console.error(`❌ Step ${step.stepId} failed:`, error.message);
        results.set(step.stepId, {
          success: false,
          error: error.message,
          executedAt: Date.now(),
          agent: step.agent,
          action: step.action
        });
      }
    }

    workflow.status = 'completed';
    workflow.completedAt = Date.now();

    return {
      workflowId: workflow.id,
      results: Object.fromEntries(results),
      completedSteps: Array.from(completedSteps),
      totalSteps: workflow.steps.length,
      success: completedSteps.size === workflow.steps.length
    };
  }

  /**
   * Coordinate follow-up actions based on workflow results
   */
  async coordinateFollowUp(workflowResults, originalRequest) {
    const messages = [
      PromptTemplates.getSystemPrompt('master_agent'),
      {
        role: 'user',
        content: `Analyze workflow results and coordinate follow-up actions:

Original Request: ${JSON.stringify(originalRequest, null, 2)}
Workflow Results: ${JSON.stringify(workflowResults, null, 2)}

Determine:
1. What follow-up actions are needed
2. Priority levels for each action
3. Which agents should handle follow-ups
4. Timeline for completion
5. Success metrics to track

Respond with JSON: {
  "summary": "workflow outcome summary",
  "successRate": 0.9,
  "recommendedActions": [
    {
      "action": "action_name",
      "agent": "agent_name",
      "priority": "high|medium|low",
      "deadline": "2024-01-15T10:00:00Z",
      "description": "what to do"
    }
  ],
  "risks": ["identified risks"],
  "opportunities": ["identified opportunities"]
}`
      }
    ];

    const result = await openaiService.chat(messages, {
      agentType: 'master_agent',
      temperature: 0.4,
      maxTokens: 600
    });

    try {
      return JSON.parse(result.content);
    } catch (error) {
      console.error('Failed to parse follow-up analysis:', error.message);
      return {
        summary: "Workflow completed with mixed results",
        successRate: workflowResults.success ? 1.0 : 0.5,
        recommendedActions: [],
        risks: ["Unable to analyze results properly"],
        opportunities: []
      };
    }
  }

  /**
   * Handle customer inquiry routing (primary entry point)
   */
  async handleCustomerInquiry(inquiry) {
    console.log('📞 Master Agent handling customer inquiry');
    
    return await this.orchestrateWorkflow({
      type: 'customer_inquiry',
      data: inquiry,
      context: {
        source: 'customer_direct',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle lead processing workflow
   */
  async processLead(leadData) {
    console.log('🎯 Master Agent processing lead');
    
    return await this.orchestrateWorkflow({
      type: 'lead_processing',
      data: leadData,
      context: {
        source: 'lead_generation',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle deal opportunity workflow
   */
  async manageDealOpportunity(dealData) {
    console.log('💼 Master Agent managing deal opportunity');
    
    return await this.orchestrateWorkflow({
      type: 'deal_management',
      data: dealData,
      context: {
        source: 'opportunity_creation',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle quotation workflow
   */
  async processQuotationRequest(quotationData) {
    console.log('📋 Master Agent processing quotation request');
    
    return await this.orchestrateWorkflow({
      type: 'quotation_processing',
      data: quotationData,
      context: {
        source: 'pricing_request',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Strategic business analysis
   */
  async performBusinessAnalysis(analysisRequest) {
    console.log('📊 Master Agent performing business analysis');
    
    return await this.orchestrateWorkflow({
      type: 'business_analysis',
      data: analysisRequest,
      context: {
        source: 'strategic_planning',
        timestamp: Date.now()
      }
    });
  }

  /**
   * System performance optimization
   */
  async optimizeSystemPerformance() {
    console.log('⚡ Master Agent optimizing system performance');
    
    const performanceData = {
      agentMetrics: Object.fromEntries(this.agentPerformance),
      workflowMetrics: this.workflowMetrics,
      hubMetrics: this.hub.getMetrics()
    };

    const messages = [
      PromptTemplates.getSystemPrompt('master_agent'),
      {
        role: 'user',
        content: `Analyze system performance and provide optimization recommendations:

Performance Data: ${JSON.stringify(performanceData, null, 2)}

Identify:
1. Performance bottlenecks
2. Underutilized resources
3. Optimization opportunities
4. Recommended configuration changes

Respond with actionable recommendations.`
      }
    ];

    const result = await openaiService.chat(messages, {
      agentType: 'master_agent',
      temperature: 0.3,
      maxTokens: 600
    });

    return {
      success: true,
      analysis: result.content,
      performanceData,
      timestamp: Date.now()
    };
  }

  /**
   * Create fallback workflow for error cases
   */
  createFallbackWorkflow(request) {
    return {
      id: this.generateWorkflowId(),
      priority: 'medium',
      steps: [
        {
          stepId: 'fallback_step',
          agent: 'nlp_sales_assistant',
          action: 'handle_query',
          data: request.data,
          dependencies: [],
          estimatedTime: 30
        }
      ],
      expectedOutcome: 'Fallback response to customer',
      createdAt: Date.now(),
      status: 'planned'
    };
  }

  /**
   * Generate fallback actions for failed workflows
   */
  async generateFallbackActions(request) {
    return [
      {
        action: 'manual_review',
        description: 'Route to human agent for manual handling',
        priority: 'high'
      },
      {
        action: 'system_check',
        description: 'Perform system health check',
        priority: 'medium'
      }
    ];
  }

  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(agentId, success) {
    const current = this.agentPerformance.get(agentId) || {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      successRate: 0
    };

    current.totalTasks++;
    if (success) {
      current.successfulTasks++;
    } else {
      current.failedTasks++;
    }
    current.successRate = current.successfulTasks / current.totalTasks;

    this.agentPerformance.set(agentId, current);
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics() {
    return {
      ...this.workflowMetrics,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      agentPerformance: Object.fromEntries(this.agentPerformance)
    };
  }

  /**
   * Generate unique workflow ID
   */
  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      const metrics = this.getWorkflowMetrics();
      console.log('👑 Master Agent Performance:', {
        active_workflows: metrics.activeTasks,
        queued_tasks: metrics.queuedTasks,
        agent_count: Object.keys(metrics.agentPerformance).length,
        avg_success_rate: Object.values(metrics.agentPerformance)
          .reduce((sum, perf) => sum + perf.successRate, 0) / 
          Object.keys(metrics.agentPerformance).length || 0
      });
    }, 120000); // Report every 2 minutes
  }

  /**
   * Health check for Master Agent
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    return {
      ...baseHealth,
      orchestrationCapable: true,
      workflowMetrics: this.getWorkflowMetrics(),
      hubConnected: this.hub ? true : false,
      agentPerformance: Object.fromEntries(this.agentPerformance)
    };
  }
}

export default MasterAgent;
