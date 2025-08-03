import siteAssessmentRepository, { SiteAssessment } from './postgres/siteAssessmentRepository';

/**
 * Get all site assessments
 */
export const getSiteAssessments = async (): Promise<SiteAssessment[]> => {
  try {
    return await siteAssessmentRepository.getSiteAssessments();
  } catch (error) {
    console.error('Error fetching site assessments:', error);
    return [];
  }
};

/**
 * Get site assessment by ID
 */
export const getSiteAssessmentById = async (id: string): Promise<SiteAssessment | null> => {
  try {
    return await siteAssessmentRepository.getSiteAssessmentById(id);
  } catch (error) {
    console.error(`Error fetching site assessment ${id}:`, error);
    return null;
  }
};

/**
 * Create a new site assessment
 */
export const createSiteAssessment = async (assessment: Omit<SiteAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteAssessment> => {
  try {
    return await siteAssessmentRepository.createSiteAssessment(assessment);
  } catch (error) {
    console.error('Error creating site assessment:', error);
    throw error;
  }
};

/**
 * Update site assessment details
 */
export const updateSiteAssessment = async (id: string, data: Partial<SiteAssessment>): Promise<SiteAssessment | null> => {
  try {
    return await siteAssessmentRepository.updateSiteAssessment(id, data);
  } catch (error) {
    console.error(`Error updating site assessment ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a site assessment
 */
export const deleteSiteAssessment = async (id: string): Promise<void> => {
  try {
    await siteAssessmentRepository.deleteSiteAssessment(id);
  } catch (error) {
    console.error(`Error deleting site assessment ${id}:`, error);
    throw error;
  }
};

// Export site assessment interface
export type { SiteAssessment } from './postgres/siteAssessmentRepository';
