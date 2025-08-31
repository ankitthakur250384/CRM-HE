/**
 * AI System Manager - CrewAI Cloud Integration
 * Manages the CrewAI cloud platform integration for ASP Cranes CRM
 */
import { CrewAICloudService } from '../services/CrewAICloudService.js';

export class AISystemManager {
  constructor() {
    this.crewAIService = new CrewAICloudService();
    this.isInitialized = false;
    this.startTime = null;
    
    console.log('🚀 AI System Manager initialized - CrewAI Cloud Platform');
  }

  /**
   * Initialize the AI system
   */
  async initialize() {
    try {
      console.log('🔄 Starting CrewAI cloud integration...');
      this.startTime = Date.now();

      // Test CrewAI connectivity
      await this.testCrewAIConnectivity();
      
      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;
      
      console.log(`✅ CrewAI cloud integration initialized successfully in ${initTime}ms`);
      
      return {
        success: true,
        initializationTime: initTime,
        platform: 'CrewAI Cloud',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ CrewAI cloud integration failed:', error.message);
      throw error;
    }
  }

  /**
   * Test CrewAI connectivity
   */
  async testCrewAIConnectivity() {
    console.log('🧪 Testing CrewAI cloud connectivity...');
    
    try {
      const testResult = await this.crewAIService.processChat('Test connection');
      if (testResult.success) {
        console.log('✅ CrewAI cloud connectivity verified');
      } else {
        throw new Error('CrewAI test failed');
      }
    } catch (error) {
      console.error('❌ CrewAI connectivity test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      platform: 'CrewAI Cloud',
      uptime: this.startTime ? Date.now() - this.startTime : 0,
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

    console.log('💬 Handling customer interaction via CrewAI...');
    
    try {
      const result = await this.crewAIService.processChat(interaction.query, interaction.context);

      return {
        success: result.success,
        response: result.response,
        platform: 'CrewAI Cloud',
        processingTime: result.responseTime || 0
      };
      
    } catch (error) {
      console.error('❌ Customer interaction handling failed:', error.message);
      
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

    console.log(`🔄 Processing business workflow via CrewAI: ${workflowType}`);
    
    try {
      let result;
      
      switch (workflowType) {
        case 'lead_analysis':
          result = await this.crewAIService.analyzeLead(data);
          break;
        case 'quotation_generation':
          result = await this.crewAIService.generateQuotation(data);
          break;
        case 'company_research':
          result = await this.crewAIService.researchCompany(data);
          break;
        default:
          result = await this.crewAIService.processChat(`Process ${workflowType} workflow`, data);
      }

      return {
        success: result.success,
        workflowResult: result,
        platform: 'CrewAI Cloud',
        processingTime: result.responseTime || 0
      };
      
    } catch (error) {
      console.error(`❌ Workflow processing failed for ${workflowType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    if (!this.isInitialized) {
      return { error: 'System not initialized' };
    }

    return {
      system: this.getSystemStatus(),
      platform: 'CrewAI Cloud',
      service: this.crewAIService.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup (minimal for cloud service)
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI system...');
    this.isInitialized = false;
    console.log('✅ AI system cleanup completed');
  }

  /**
   * Restart the system
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
