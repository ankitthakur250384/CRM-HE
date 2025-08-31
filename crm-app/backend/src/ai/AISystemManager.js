/**
 * AI System Initialization
 * Bootstraps the CrewAI multi-agent system for ASP Cranes CRM
 */
import { AgentCommunicationHub } from './AgentCommunicationHub.js';
import { NLPSalesAssistant } from './agents/NLPSalesAssistant.js';
import { MasterAgent } from './agents/MasterAgent.js';
import { LeadAgent } from './agents/LeadAgent.js';
import { DealAgent } from './agents/DealAgent.js';
import { QuotationAgent } from './agents/QuotationAgent.js';
import { CompanyIntelligenceAgent } from './agents/CompanyIntelligenceAgent.js';
import { openaiService } from './services/OpenAIService.js';
import { crmTestTool } from './tools/CRMTools.js';

export class AISystemManager {
  constructor() {
    this.hub = null;
    this.agents = new Map();
    this.isInitialized = false;
    this.startTime = null;
    
    console.log('🚀 AI System Manager initialized');
  }

  /**
   * Initialize the complete AI system
   */
  async initialize() {
    try {
      console.log('🔄 Starting AI system initialization...');
      this.startTime = Date.now();

      // Step 1: Initialize the communication hub
      await this.initializeHub();
      
      // Step 2: Test external dependencies
      await this.testDependencies();
      
      // Step 3: Create and register all agents
      await this.initializeAgents();
      
      // Step 4: Start all agents
      await this.startAgents();
      
      // Step 5: Verify system health
      await this.verifySystemHealth();
      
      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;
      
      console.log(`✅ AI System initialized successfully in ${initTime}ms`);
      console.log(`🤖 Agents active: ${this.agents.size}`);
      
      return {
        success: true,
        initializationTime: initTime,
        agentsActive: this.agents.size,
        hubActive: this.hub.isHealthy(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ AI System initialization failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Initialize the communication hub
   */
  async initializeHub() {
    console.log('🌐 Initializing Agent Communication Hub...');
    
    this.hub = new AgentCommunicationHub();
    await this.hub.initialize();
    
    console.log('✅ Hub initialized and ready');
  }

  /**
   * Test external dependencies
   */
  async testDependencies() {
    console.log('🧪 Testing external dependencies...');
    
    // Test OpenAI connectivity
    console.log('Testing OpenAI connectivity...');
    const openaiTest = await openaiService.chat([
      { role: 'user', content: 'Test connection' }
    ], { agentType: 'system_test', maxTokens: 10 });
    
    if (!openaiTest.success) {
      throw new Error('OpenAI connectivity test failed');
    }
    
    // Test CRM API connectivity
    console.log('Testing CRM API connectivity...');
    const crmTest = await crmTestTool.testConnectivity();
    
    const failedEndpoints = Object.entries(crmTest)
      .filter(([, result]) => !result.success)
      .map(([endpoint]) => endpoint);
    
    if (failedEndpoints.length > 0) {
      console.warn(`⚠️ Some CRM endpoints failed: ${failedEndpoints.join(', ')}`);
      // Don't fail initialization for CRM issues, but log them
    }
    
    // Test leads endpoint authentication
    console.log('Testing leads endpoint authentication...');
    const leadsAuthTest = await crmTestTool.testLeadsAuthentication();
    console.log('Leads auth test result:', leadsAuthTest.test_result.success ? '✅' : '❌');
    
    console.log('✅ Dependency tests completed');
  }

  /**
   * Initialize all agents
   */
  async initializeAgents() {
    console.log('🤖 Initializing AI agents...');
    
    const agentConfigs = [
      { name: 'nlp_sales_assistant', class: NLPSalesAssistant, priority: 1 },
      { name: 'master_agent', class: MasterAgent, priority: 1 },
      { name: 'lead_agent', class: LeadAgent, priority: 2 },
      { name: 'deal_agent', class: DealAgent, priority: 2 },
      { name: 'quotation_agent', class: QuotationAgent, priority: 2 },
      { name: 'company_intelligence', class: CompanyIntelligenceAgent, priority: 3 }
    ];

    // Initialize agents in priority order
    const sortedConfigs = agentConfigs.sort((a, b) => a.priority - b.priority);
    
    for (const config of sortedConfigs) {
      try {
        console.log(`Creating ${config.name}...`);
        const agent = new config.class(this.hub);
        this.agents.set(config.name, agent);
        console.log(`✅ ${config.name} created`);
      } catch (error) {
        console.error(`❌ Failed to create ${config.name}:`, error.message);
        throw error;
      }
    }
    
    console.log(`✅ All ${this.agents.size} agents initialized`);
  }

  /**
   * Start all agents
   */
  async startAgents() {
    console.log('▶️ Starting AI agents...');
    
    const startPromises = Array.from(this.agents.entries()).map(async ([name, agent]) => {
      try {
        await agent.start();
        console.log(`✅ ${name} started`);
        return { name, success: true };
      } catch (error) {
        console.error(`❌ Failed to start ${name}:`, error.message);
        return { name, success: false, error: error.message };
      }
    });

    const results = await Promise.all(startPromises);
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      throw new Error(`Failed to start agents: ${failed.map(f => f.name).join(', ')}`);
    }
    
    console.log('✅ All agents started successfully');
  }

  /**
   * Verify system health
   */
  async verifySystemHealth() {
    console.log('🏥 Verifying system health...');
    
    // Check hub health
    const hubHealth = this.hub.getHealthStatus();
    if (!hubHealth.healthy) {
      throw new Error('Hub health check failed');
    }
    
    // Check agent health
    const agentHealthPromises = Array.from(this.agents.entries()).map(async ([name, agent]) => {
      try {
        const health = await agent.healthCheck();
        return { name, health, healthy: health.healthy };
      } catch (error) {
        return { name, healthy: false, error: error.message };
      }
    });

    const healthResults = await Promise.all(agentHealthPromises);
    const unhealthyAgents = healthResults.filter(r => !r.healthy);
    
    if (unhealthyAgents.length > 0) {
      console.warn(`⚠️ Some agents reported health issues: ${unhealthyAgents.map(a => a.name).join(', ')}`);
      // Don't fail for health warnings, but log them
    }
    
    console.log('✅ System health verification completed');
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      hubActive: this.hub ? this.hub.isHealthy() : false,
      agentsCount: this.agents.size,
      agents: Array.from(this.agents.keys()),
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      openaiConnected: true, // Would check actual status
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle customer interaction (main entry point)
   */
  async handleCustomerInteraction(interaction) {
    if (!this.isInitialized) {
      throw new Error('AI System not initialized');
    }

    console.log('💬 Handling customer interaction...');
    
    try {
      // Route to NLP Sales Assistant first
      const result = await this.hub.routeRequest(
        'nlp_sales_assistant',
        'handleCustomerQuery',
        interaction.query,
        interaction.context
      );

      return {
        success: true,
        response: result.response,
        agentUsed: 'nlp_sales_assistant',
        processingTime: result.responseTime,
        conversationId: result.conversationId
      };
      
    } catch (error) {
      console.error('❌ Customer interaction handling failed:', error.message);
      
      // Fallback response
      return {
        success: false,
        error: error.message,
        fallbackResponse: "I apologize, but I'm experiencing technical difficulties. Please contact our sales team directly."
      };
    }
  }

  /**
   * Process business workflow
   */
  async processBusinessWorkflow(workflowType, data) {
    if (!this.isInitialized) {
      throw new Error('AI System not initialized');
    }

    console.log(`🔄 Processing business workflow: ${workflowType}`);
    
    try {
      // Route to Master Agent for orchestration
      const result = await this.hub.routeRequest(
        'master_agent',
        'orchestrateWorkflow',
        {
          type: workflowType,
          data,
          context: {
            source: 'business_process',
            timestamp: Date.now()
          }
        }
      );

      return {
        success: true,
        workflowResult: result,
        processingTime: result.responseTime
      };
      
    } catch (error) {
      console.error(`❌ Workflow processing failed for ${workflowType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics() {
    if (!this.isInitialized) {
      return { error: 'System not initialized' };
    }

    const metrics = {
      system: this.getSystemStatus(),
      hub: this.hub.getMetrics(),
      openai: openaiService.getMetrics(),
      agents: {}
    };

    // Get metrics from each agent
    for (const [name, agent] of this.agents.entries()) {
      try {
        metrics.agents[name] = agent.getMetrics();
      } catch (error) {
        metrics.agents[name] = { error: error.message };
      }
    }

    return metrics;
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI system...');
    
    // Stop all agents
    const stopPromises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        await agent.stop();
      } catch (error) {
        console.error('Error stopping agent:', error.message);
      }
    });

    await Promise.all(stopPromises);
    
    // Clear agents
    this.agents.clear();
    
    // Cleanup hub
    if (this.hub) {
      await this.hub.cleanup();
      this.hub = null;
    }
    
    this.isInitialized = false;
    console.log('✅ AI system cleanup completed');
  }

  /**
   * Restart the entire system
   */
  async restart() {
    console.log('🔄 Restarting AI system...');
    
    await this.cleanup();
    await this.initialize();
    
    console.log('✅ AI system restarted successfully');
  }
}

// Create singleton instance
export const aiSystemManager = new AISystemManager();

// Export default for easy importing
export default aiSystemManager;
