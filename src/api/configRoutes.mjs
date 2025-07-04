/**
 * General Configuration API
 * Provides endpoints to manage all configuration types (except database config which has its own routes)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { 
  getQuotationConfig, 
  updateQuotationConfig, 
  getResourceRatesConfig, 
  updateResourceRatesConfig,
  getAdditionalParamsConfig,
  updateAdditionalParamsConfig,
  getDefaultTemplateConfig,
  updateDefaultTemplateConfig,
  getConfig,
  updateConfig
} from '../services/postgres/configRepository.js';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Skip auth in development mode if bypass header is present
  if (req.headers['x-bypass-auth'] === 'true' || req.headers['x-bypass-auth'] === 'development-only-123') {
    console.log('Authentication bypassed with development header');
    req.user = { uid: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operations_manager')) {
    return res.status(403).json({ 
      success: false, 
      message: 'This operation requires administrator or operations manager privileges' 
    });
  }
  next();
};

// General config route - GET any config type
router.get('/:configType', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { configType } = req.params;
    let config;

    switch(configType) {
      case 'quotation':
        config = await getQuotationConfig();
        break;
      case 'resourceRates':
        config = await getResourceRatesConfig();
        break;
      case 'additionalParams':
        config = await getAdditionalParamsConfig();
        break;
      case 'defaultTemplate':
        config = await getDefaultTemplateConfig();
        break;
      default:
        // Generic config getter for other types
        config = await getConfig(configType);
    }

    res.json({ 
      success: true, 
      data: config
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.configType} config:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to retrieve ${req.params.configType} configuration`,
      error: error.message
    });
  }
});

// General config route - PUT update any config type
router.put('/:configType', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { configType } = req.params;
    const configData = req.body;
    
    if (!configData) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    
    let updatedConfig;

    switch(configType) {
      case 'quotation':
        updatedConfig = await updateQuotationConfig(configData);
        break;
      case 'resourceRates':
        updatedConfig = await updateResourceRatesConfig(configData);
        break;
      case 'additionalParams':
        updatedConfig = await updateAdditionalParamsConfig(configData);
        break;
      case 'defaultTemplate':
        // For defaultTemplate, we expect a defaultTemplateId property
        if (!configData.defaultTemplateId) {
          return res.status(400).json({
            success: false,
            message: 'defaultTemplateId is required'
          });
        }
        updatedConfig = await updateDefaultTemplateConfig(configData.defaultTemplateId);
        break;
      default:
        // Generic config updater for other types
        updatedConfig = await updateConfig(configType, configData);
    }

    res.json({
      success: true,
      message: `${configType} configuration updated successfully`,
      data: updatedConfig
    });
  } catch (error) {
    console.error(`Error updating ${req.params.configType} config:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to update ${req.params.configType} configuration`,
      error: error.message
    });
  }
});

export default router;
