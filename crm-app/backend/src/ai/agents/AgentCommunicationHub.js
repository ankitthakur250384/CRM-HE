/**
 * Agent Communication Hub - Central coordinator for ASP Cranes CRM Multi-Agent Network
 * Implements hub-and-spoke architecture for agent discovery, routing, and health monitoring
 */
import EventEmitter from 'events';

export class AgentCommunicationHub extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    
    console.log('🏗️ Agent Communication Hub initialized');
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Register an agent in the hub
   */
  registerAgent(agentConfig) {
    const agentId = agentConfig.agent_id || agentConfig.name;
    
    const registryEntry = {
      agent_id: agentId,
      agent_name: agentConfig.name,
      role: agentConfig.role,
      capabilities: agentConfig.capabilities || [],
      specializations: agentConfig.specializations || [],
      status: 'active',
      last_heartbeat: new Date().toISOString(),
      performance_metrics: {
        success_rate: 100,
        avg_response_time: 0,
        total_requests: 0
      },
      tools: agentConfig.tools || [],
      endpoint_compatibility: agentConfig.endpoint_compatibility || [],
      agent_instance: agentConfig.agent_instance
    };

    this.agents.set(agentId, registryEntry);
    console.log(`✅ Agent registered: ${agentConfig.name} (${agentId})`);
    
    this.emit('agentRegistered', registryEntry);
    return agentId;
  }

  /**
   * Discover agents by capability
   */
  discoverAgents(capability) {
    const availableAgents = [];
    
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'active' && 
          (agent.capabilities.includes(capability) || 
           agent.specializations.includes(capability))) {
        availableAgents.push(agent);
      }
    }
    
    // Sort by performance metrics (success rate and response time)
    availableAgents.sort((a, b) => {
      const scoreA = a.performance_metrics.success_rate - (a.performance_metrics.avg_response_time / 1000);
      const scoreB = b.performance_metrics.success_rate - (b.performance_metrics.avg_response_time / 1000);
      return scoreB - scoreA;
    });
    
    console.log(`🔍 Discovered ${availableAgents.length} agents for capability: ${capability}`);
    return availableAgents;
  }

  /**
   * Route request to appropriate agent
   */
  async routeRequest(capability, request, timeout = 30000) {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;
    
    try {
      console.log(`🚀 Routing request for capability: ${capability}`);
      
      const availableAgents = this.discoverAgents(capability);
      
      if (availableAgents.length === 0) {
        throw new Error(`No agents available for capability: ${capability}`);
      }
      
      // Use the best performing agent
      const selectedAgent = availableAgents[0];
      console.log(`📍 Selected agent: ${selectedAgent.agent_name}`);
      
      // Update agent status
      this.updateAgentStatus(selectedAgent.agent_id, 'busy');
      
      // Execute request with timeout
      const response = await Promise.race([
        this.executeAgentRequest(selectedAgent, request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
      
      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updateAgentPerformance(selectedAgent.agent_id, true, responseTime);
      this.updateAgentStatus(selectedAgent.agent_id, 'active');
      
      this.performanceMetrics.successfulRequests++;
      this.updateAverageResponseTime(responseTime);
      
      console.log(`✅ Request completed successfully in ${responseTime}ms`);
      return response;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Request failed after ${responseTime}ms:`, error.message);
      
      this.performanceMetrics.failedRequests++;
      this.emit('requestFailed', { capability, error: error.message, responseTime });
      
      throw error;
    }
  }

  /**
   * Execute request on specific agent
   */
  async executeAgentRequest(agent, request) {
    console.log(`⚡ Executing request on agent: ${agent.agent_name}`);
    
    if (!agent.agent_instance || typeof agent.agent_instance.execute !== 'function') {
      throw new Error(`Agent ${agent.agent_name} does not have a valid execute method`);
    }
    
    try {
      const response = await agent.agent_instance.execute(request);
      return response;
    } catch (error) {
      this.updateAgentPerformance(agent.agent_id, false, 0);
      this.updateAgentStatus(agent.agent_id, 'error');
      throw error;
    }
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId, status) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.last_heartbeat = new Date().toISOString();
      this.agents.set(agentId, agent);
      
      this.emit('agentStatusChanged', { agentId, status });
    }
  }

  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(agentId, success, responseTime) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.performance_metrics.total_requests++;
      
      if (success) {
        const successfulRequests = agent.performance_metrics.total_requests * 
          (agent.performance_metrics.success_rate / 100);
        agent.performance_metrics.success_rate = 
          ((successfulRequests + 1) / agent.performance_metrics.total_requests) * 100;
      } else {
        const successfulRequests = agent.performance_metrics.total_requests * 
          (agent.performance_metrics.success_rate / 100);
        agent.performance_metrics.success_rate = 
          (successfulRequests / agent.performance_metrics.total_requests) * 100;
      }
      
      // Update average response time
      const currentAvg = agent.performance_metrics.avg_response_time;
      const totalRequests = agent.performance_metrics.total_requests;
      agent.performance_metrics.avg_response_time = 
        ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
      
      this.agents.set(agentId, agent);
    }
  }

  /**
   * Update hub average response time
   */
  updateAverageResponseTime(responseTime) {
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalRequests = this.performanceMetrics.totalRequests;
    this.performanceMetrics.averageResponseTime = 
      ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Get agent registry
   */
  getAgentRegistry() {
    return Array.from(this.agents.values()).map(agent => ({
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      role: agent.role,
      capabilities: agent.capabilities,
      specializations: agent.specializations,
      status: agent.status,
      last_heartbeat: agent.last_heartbeat,
      performance_metrics: agent.performance_metrics,
      tools: agent.tools,
      endpoint_compatibility: agent.endpoint_compatibility
    }));
  }

  /**
   * Get hub performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      success_rate: this.performanceMetrics.totalRequests > 0 ? 
        (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests) * 100 : 0,
      active_agents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
      total_agents: this.agents.size
    };
  }

  /**
   * Health monitoring for agents
   */
  startHealthMonitoring() {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes
      
      for (const [agentId, agent] of this.agents) {
        const lastHeartbeat = new Date(agent.last_heartbeat).getTime();
        
        if (now - lastHeartbeat > staleThreshold && agent.status === 'active') {
          console.warn(`⚠️ Agent ${agent.agent_name} appears stale, marking as inactive`);
          this.updateAgentStatus(agentId, 'inactive');
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Broadcast message to all agents with specific capability
   */
  async broadcastToCapability(capability, message) {
    const agents = this.discoverAgents(capability);
    const results = [];
    
    for (const agent of agents) {
      try {
        const result = await this.executeAgentRequest(agent, message);
        results.push({ agentId: agent.agent_id, success: true, result });
      } catch (error) {
        results.push({ agentId: agent.agent_id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId) {
    if (this.agents.has(agentId)) {
      const agent = this.agents.get(agentId);
      this.agents.delete(agentId);
      console.log(`🗑️ Agent unregistered: ${agent.agent_name}`);
      this.emit('agentUnregistered', { agentId, agent });
      return true;
    }
    return false;
  }
}

// Singleton instance
export const agentHub = new AgentCommunicationHub();
