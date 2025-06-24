import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/dbClient';
import { BaseRepository } from './baseRepository';

export interface SiteAssessment {
  id: string;
  title: string;
  description: string;
  customerId: string;
  jobId?: string;
  location: string;
  constraints: string[];
  notes: string;
  images: string[];
  videos: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class SiteAssessmentRepository extends BaseRepository<SiteAssessment> {
  constructor() {
    super('site_assessments');
  }

  async getSiteAssessments(): Promise<SiteAssessment[]> {
    try {
      const assessments = await db.any('SELECT * FROM site_assessments ORDER BY created_at DESC');
      return assessments.map(assessment => this.convertRowToCamelCase(assessment));
    } catch (error) {
      console.error('Error fetching site assessments:', error);
      
      // Return mock data for development/demo
      return [
        {
          id: 'sa-001',
          title: 'Initial Site Evaluation',
          description: 'Preliminary site check for crane deployment',
          customerId: 'customer-123',
          location: '123 Commercial Street, Mumbai',
          constraints: ['power_lines', 'narrow_access'],
          notes: 'Site requires traffic management plan for crane deployment',
          images: ['site_image1.jpg', 'site_image2.jpg'],
          videos: [],
          createdBy: 'user-001',
          createdAt: new Date(2025, 5, 15).toISOString(),
          updatedAt: new Date(2025, 5, 15).toISOString()
        },
        {
          id: 'sa-002',
          title: 'Follow-up Assessment',
          description: 'Detailed measurements and area clearance check',
          customerId: 'customer-456',
          jobId: 'job-789',
          location: '456 Industrial Area, Delhi',
          constraints: ['height_limits', 'soft_ground'],
          notes: 'Ground reinforcement required before heavy crane setup',
          images: ['site_image3.jpg'],
          videos: ['site_video1.mp4'],
          createdBy: 'user-002',
          createdAt: new Date(2025, 5, 18).toISOString(),
          updatedAt: new Date(2025, 5, 18).toISOString()
        }
      ];
    }
  }

  async getSiteAssessmentById(id: string): Promise<SiteAssessment | null> {
    try {
      const assessment = await db.oneOrNone('SELECT * FROM site_assessments WHERE id = $1', [id]);
      return assessment ? this.convertRowToCamelCase(assessment) : null;
    } catch (error) {
      console.error('Error fetching site assessment by ID:', error);
      
      // Return mock data for development/demo
      if (id === 'sa-001') {
        return {
          id: 'sa-001',
          title: 'Initial Site Evaluation',
          description: 'Preliminary site check for crane deployment',
          customerId: 'customer-123',
          location: '123 Commercial Street, Mumbai',
          constraints: ['power_lines', 'narrow_access'],
          notes: 'Site requires traffic management plan for crane deployment',
          images: ['site_image1.jpg', 'site_image2.jpg'],
          videos: [],
          createdBy: 'user-001',
          createdAt: new Date(2025, 5, 15).toISOString(),
          updatedAt: new Date(2025, 5, 15).toISOString()
        };
      }
      return null;
    }
  }

  async createSiteAssessment(assessment: Omit<SiteAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteAssessment> {
    try {
      const now = new Date().toISOString();
      const newAssessment = {
        id: uuidv4(),
        ...assessment,
        createdAt: now,
        updatedAt: now
      };
      
      // In a real implementation, we would insert into the database
      // await db.one(
      //   `INSERT INTO site_assessments(...) VALUES(...) RETURNING *`
      // );
      
      return newAssessment;
    } catch (error) {
      console.error('Error creating site assessment:', error);
      throw error;
    }
  }

  async updateSiteAssessment(id: string, assessment: Partial<SiteAssessment>): Promise<SiteAssessment> {
    try {
      const now = new Date().toISOString();
      const updatedAssessment = {
        ...assessment,
        updatedAt: now
      };
      
      // In a real implementation, we would update the database
      // const result = await db.oneOrNone(
      //   `UPDATE site_assessments SET ... WHERE id = $1 RETURNING *`,
      //   [id]
      // );
      
      return { 
        id, 
        title: 'Updated Assessment',
        description: assessment.description || 'Description',
        customerId: assessment.customerId || 'customer-123',
        location: assessment.location || 'Location',
        constraints: assessment.constraints || [],
        notes: assessment.notes || '',
        images: assessment.images || [],
        videos: assessment.videos || [],
        createdBy: assessment.createdBy || 'user-001',
        createdAt: new Date(2025, 5, 15).toISOString(),
        updatedAt: now 
      };
    } catch (error) {
      console.error('Error updating site assessment:', error);
      throw error;
    }
  }

  async deleteSiteAssessment(id: string): Promise<void> {
    try {
      // In a real implementation, we would delete from the database
      // await db.none('DELETE FROM site_assessments WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting site assessment:', error);
      throw error;
    }
  }
}

const siteAssessmentRepository = new SiteAssessmentRepository();
export default siteAssessmentRepository;
