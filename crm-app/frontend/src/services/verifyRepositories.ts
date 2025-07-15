/**
 * Repository Verification Utility
 * 
 * This utility verifies that all repositories are properly connected to the PostgreSQL
 * database and not falling back to mock data in production mode.
 */

import { verifyDatabaseConnection } from './productionUtil';
import * as equipmentRepository from '../services/postgres/equipmentRepository.new';
import * as userRepository from '../services/postgres/userRepository';
import * as customerRepository from '../services/postgres/customerRepository';
import * as leadRepository from '../services/postgres/leadRepository';
import * as dealRepository from '../services/postgres/dealRepository';
import * as jobRepository from '../services/postgres/jobRepository';
import * as operatorRepository from '../services/postgres/operatorRepository';
import * as serviceRepository from '../services/postgres/serviceRepository';
import * as siteAssessmentRepository from '../services/postgres/siteAssessmentRepository';
import * as quotationRepository from '../services/postgres/quotationRepository';
import * as templateRepository from '../services/postgres/templateRepository';

type RepositoryVerification = {
  name: string;
  status: 'ok' | 'failed';
  error?: string;
}

/**
 * Verifies that a single repository is working correctly
 */
const verifyRepository = async (
  name: string,
  verifyFn: () => Promise<any>
): Promise<RepositoryVerification> => {
  try {
    await verifyFn();
    return { name, status: 'ok' };
  } catch (error) {
    return { 
      name, 
      status: 'failed', 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Verifies all repositories are correctly connected to the database
 */
export const verifyAllRepositories = async (): Promise<{
  databaseConnection: boolean;
  repositories: RepositoryVerification[];
}> => {
  // First verify database connection
  const dbConnection = await verifyDatabaseConnection();
  
  // If database connection is down, don't bother checking repositories
  if (!dbConnection) {
    return {
      databaseConnection: false,
      repositories: [],
    };
  }
  
  // Check all repositories
  const results = await Promise.all([
    verifyRepository('Equipment', () => equipmentRepository.getEquipment()),
    verifyRepository('User', () => userRepository.getAllUsers()),
    verifyRepository('Customer', () => customerRepository.getCustomers()),
    verifyRepository('Lead', () => leadRepository.getLeads()),
    verifyRepository('Deal', () => dealRepository.getDeals()),
    verifyRepository('Job', () => jobRepository.getJobs()),
    verifyRepository('Operator', () => operatorRepository.getOperators()),
    verifyRepository('Service', () => serviceRepository.getServices()),
    verifyRepository('SiteAssessment', () => siteAssessmentRepository.getAllSiteAssessments()),
    verifyRepository('Quotation', () => quotationRepository.getQuotations()),
    verifyRepository('Template', () => templateRepository.getTemplates()),
  ]);
  
  return {
    databaseConnection: true,
    repositories: results,
  };
};

/**
 * Gets a report of repository health
 */
export const getRepositoryHealthReport = async (): Promise<string> => {
  const verification = await verifyAllRepositories();
  
  if (!verification.databaseConnection) {
    return 'DATABASE CONNECTION FAILED: Unable to connect to PostgreSQL database';
  }
  
  const failedRepos = verification.repositories.filter(repo => repo.status === 'failed');
  
  if (failedRepos.length === 0) {
    return 'All repositories are correctly connected to the database';
  }
  
  return `The following repositories failed verification:
${failedRepos.map(repo => `- ${repo.name}: ${repo.error}`).join('\n')}`;
};
