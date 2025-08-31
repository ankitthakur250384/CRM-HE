/**
 * Base Agent Class
 * Provides common functionality for all CRM agents
 */
import { EventEmitter } from 'events';

export class BaseAgent extends EventEmitter {
  constructor(agentId, hub = null) {
    super();
    
    this.agentId = agentId;
    this.hub = hub;
    this.status = 'initialized';
    this.capabilities = [];
    this.specializations = [];
    
    // Performance tracking
    this.metrics = {
      tasksProcessed: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      lastActivity: Date.now()
    };

    // Task queue and management
    this.taskQueue = [];
    this.isProcessing = false;
    this.maxConcurrentTasks = 5;
    this.activeTasks = new Set();

    console.log(`🤖 Base Agent ${agentId} initialized`);
  }

  /**
   * Register with the hub
   */
  async register() {
    if (this.hub) {
      await this.hub.registerAgent(this);
      console.log(`✅ Agent ${this.agentId} registered with hub`);
    }
    this.status = 'ready';
  }

  /**
   * Process incoming request
   */
  async processRequest(action, data, context = {}) {
    const startTime = Date.now();
    const taskId = this.generateTaskId();
    
    console.log(`🔄 Agent ${this.agentId} processing: ${action}`);
    
    try {
      // Add to active tasks
      this.activeTasks.add(taskId);
      this.metrics.tasksProcessed++;
      this.metrics.lastActivity = Date.now();

      // Check if action is supported
      if (!this.supportsAction(action)) {
        throw new Error(`Action '${action}' not supported by agent ${this.agentId}`);
      }

      // Process the action
      let result;
      if (typeof this[action] === 'function') {
        result = await this[action](data, context);
      } else {
        result = await this.handleGenericAction(action, data, context);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      // Remove from active tasks
      this.activeTasks.delete(taskId);

      // Emit success event
      this.emit('task_completed', {
        taskId,
        action,
        success: true,
        responseTime,
        agentId: this.agentId
      });

      return {
        success: true,
        data: result,
        responseTime,
        agentId: this.agentId,
        taskId
      };

    } catch (error) {
      console.error(`❌ Agent ${this.agentId} error in ${action}:`, error.message);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      // Remove from active tasks
      this.activeTasks.delete(taskId);

      // Emit error event
      this.emit('task_failed', {
        taskId,
        action,
        error: error.message,
        responseTime,
        agentId: this.agentId
      });

      return {
        success: false,
        error: error.message,
        responseTime,
        agentId: this.agentId,
        taskId
      };
    }
  }

  /**
   * Check if agent supports specific action
   */
  supportsAction(action) {
    // Check if method exists
    if (typeof this[action] === 'function') {
      return true;
    }

    // Check against capabilities
    const actionCapabilityMap = {
      'handle_query': 'natural_language_processing',
      'create_lead': 'lead_management',
      'update_lead': 'lead_management',
      'create_deal': 'deal_management',
      'update_deal': 'deal_management',
      'calculate_pricing': 'pricing_calculations',
      'generate_quotation': 'quotation_management',
      'research_company': 'company_research',
      'analyze_market': 'market_analysis'
    };

    const requiredCapability = actionCapabilityMap[action];
    return requiredCapability ? this.capabilities.includes(requiredCapability) : false;
  }

  /**
   * Handle generic actions based on capabilities
   */
  async handleGenericAction(action, data, context) {
    throw new Error(`Generic action handling not implemented for '${action}' in agent ${this.agentId}`);
  }

  /**
   * Update performance metrics
   */
  updateMetrics(responseTime, success) {
    if (success) {
      this.metrics.successfulTasks++;
    } else {
      this.metrics.failedTasks++;
    }

    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.tasksProcessed;
  }

  /**
   * Get agent capabilities and status
   */
  getCapabilities() {
    return {
      agentId: this.agentId,
      capabilities: this.capabilities,
      specializations: this.specializations,
      status: this.status,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const successRate = this.metrics.tasksProcessed > 0 ? 
      (this.metrics.successfulTasks / this.metrics.tasksProcessed) * 100 : 0;

    return {
      ...this.metrics,
      successRate,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      lastActivityAgo: Date.now() - this.metrics.lastActivity
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const isHealthy = this.status === 'ready' && this.activeTasks.size < this.maxConcurrentTasks;
    
    return {
      agentId: this.agentId,
      status: this.status,
      healthy: isHealthy,
      capabilities: this.capabilities,
      specializations: this.specializations,
      metrics: this.getMetrics(),
      hubConnected: this.hub ? true : false,
      timestamp: Date.now()
    };
  }

  /**
   * Queue task for processing
   */
  queueTask(action, data, context = {}) {
    const task = {
      id: this.generateTaskId(),
      action,
      data,
      context,
      queuedAt: Date.now()
    };

    this.taskQueue.push(task);
    
    // Process queue if not already processing
    if (!this.isProcessing && this.activeTasks.size < this.maxConcurrentTasks) {
      this.processQueue();
    }

    return task.id;
  }

  /**
   * Process task queue
   */
  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
      const task = this.taskQueue.shift();
      
      // Process task asynchronously
      this.processRequest(task.action, task.data, task.context)
        .catch(error => {
          console.error(`Queue task ${task.id} failed:`, error.message);
        });
    }

    this.isProcessing = false;
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `${this.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send message to another agent through hub
   */
  async sendMessage(targetAgentId, action, data, context = {}) {
    if (!this.hub) {
      throw new Error('No hub available for inter-agent communication');
    }

    return await this.hub.routeRequest(targetAgentId, action, data, {
      ...context,
      sourceAgent: this.agentId
    });
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(action, data, context = {}) {
    if (!this.hub) {
      throw new Error('No hub available for broadcasting');
    }

    return await this.hub.broadcast(action, data, {
      ...context,
      sourceAgent: this.agentId
    });
  }

  /**
   * Log agent activity
   */
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      level,
      message,
      data
    };

    console.log(`[${level.toUpperCase()}] ${this.agentId}: ${message}`, data);
    
    // Emit log event for external logging systems
    this.emit('log', logEntry);
  }

  /**
   * Start agent (override in subclasses if needed)
   */
  async start() {
    this.status = 'starting';
    await this.register();
    this.log('info', 'Agent started successfully');
  }

  /**
   * Stop agent
   */
  async stop() {
    this.status = 'stopping';
    
    // Wait for active tasks to complete or timeout
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeTasks.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.status = 'stopped';
    this.log('info', 'Agent stopped');
  }

  /**
   * Restart agent
   */
  async restart() {
    await this.stop();
    await this.start();
    this.log('info', 'Agent restarted');
  }
}

export default BaseAgent;
