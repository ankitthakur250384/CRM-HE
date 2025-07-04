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

interface SiteAssessmentRow {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  job_id?: string;
  location: string;
  constraints: string[];
  notes: string;
  images: string[];
  videos: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class SiteAssessmentRepository extends BaseRepository<SiteAssessment> {
  constructor() {
    super('site_assessments');
  }

  async getSiteAssessments(): Promise<SiteAssessment[]> {
    try {
      const assessments = await db.any<SiteAssessmentRow>('SELECT * FROM site_assessments ORDER BY created_at DESC');
      return assessments.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        customerId: assessment.customer_id,
        jobId: assessment.job_id,
        location: assessment.location,
        constraints: Array.isArray(assessment.constraints) ? assessment.constraints : [],
        notes: assessment.notes,
        images: Array.isArray(assessment.images) ? assessment.images : [],
        videos: Array.isArray(assessment.videos) ? assessment.videos : [],
        createdBy: assessment.created_by,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at
      }));
    } catch (error) {
      console.error('Error fetching site assessments:', error);
      throw new Error(`Database error: ${(error as Error).message}`);
    }
  }

  async getSiteAssessmentById(id: string): Promise<SiteAssessment | null> {
    try {
      const assessment = await db.oneOrNone<SiteAssessmentRow>('SELECT * FROM site_assessments WHERE id = $1', [id]);
      
      if (!assessment) {
        return null;
      }
      
      return {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        customerId: assessment.customer_id,
        jobId: assessment.job_id,
        location: assessment.location,
        constraints: Array.isArray(assessment.constraints) ? assessment.constraints : [],
        notes: assessment.notes,
        images: Array.isArray(assessment.images) ? assessment.images : [],
        videos: Array.isArray(assessment.videos) ? assessment.videos : [],
        createdBy: assessment.created_by,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at
      };
    } catch (error) {
      console.error('Error fetching site assessment by ID:', error);
      throw new Error(`Database error: ${(error as Error).message}`);
    }
  }

  async createSiteAssessment(assessment: Omit<SiteAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteAssessment> {
    try {
      const now = new Date().toISOString();
      const newId = uuidv4();
      
      const result = await db.one<SiteAssessmentRow>(`
        INSERT INTO site_assessments (
          id, 
          title, 
          description, 
          customer_id, 
          job_id, 
          location, 
          constraints, 
          notes, 
          images, 
          videos, 
          created_by, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        newId,
        assessment.title,
        assessment.description,
        assessment.customerId,
        assessment.jobId || null,
        assessment.location,
        assessment.constraints,
        assessment.notes,
        assessment.images,
        assessment.videos,
        assessment.createdBy,
        now,
        now
      ]);
      
      return {
        id: result.id,
        title: result.title,
        description: result.description,
        customerId: result.customer_id,
        jobId: result.job_id,
        location: result.location,
        constraints: Array.isArray(result.constraints) ? result.constraints : [],
        notes: result.notes,
        images: Array.isArray(result.images) ? result.images : [],
        videos: Array.isArray(result.videos) ? result.videos : [],
        createdBy: result.created_by,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error creating site assessment:', error);
      throw new Error(`Database error: ${(error as Error).message}`);
    }
  }

  async updateSiteAssessment(id: string, assessment: Partial<SiteAssessment>): Promise<SiteAssessment | null> {
    try {
      // First check if the assessment exists
      const exists = await this.getSiteAssessmentById(id);
      if (!exists) {
        return null;
      }
      
      // Build the update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCounter = 1;
      
      if (assessment.title !== undefined) {
        updateFields.push(`title = $${paramCounter++}`);
        updateValues.push(assessment.title);
      }
      
      if (assessment.description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        updateValues.push(assessment.description);
      }
      
      if (assessment.customerId !== undefined) {
        updateFields.push(`customer_id = $${paramCounter++}`);
        updateValues.push(assessment.customerId);
      }
      
      if (assessment.jobId !== undefined) {
        updateFields.push(`job_id = $${paramCounter++}`);
        updateValues.push(assessment.jobId);
      }
      
      if (assessment.location !== undefined) {
        updateFields.push(`location = $${paramCounter++}`);
        updateValues.push(assessment.location);
      }
      
      if (assessment.constraints !== undefined) {
        updateFields.push(`constraints = $${paramCounter++}`);
        updateValues.push(assessment.constraints);
      }
      
      if (assessment.notes !== undefined) {
        updateFields.push(`notes = $${paramCounter++}`);
        updateValues.push(assessment.notes);
      }
      
      if (assessment.images !== undefined) {
        updateFields.push(`images = $${paramCounter++}`);
        updateValues.push(assessment.images);
      }
      
      if (assessment.videos !== undefined) {
        updateFields.push(`videos = $${paramCounter++}`);
        updateValues.push(assessment.videos);
      }
      
      if (assessment.createdBy !== undefined) {
        updateFields.push(`created_by = $${paramCounter++}`);
        updateValues.push(assessment.createdBy);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = $${paramCounter++}`);
      updateValues.push(new Date().toISOString());
      
      // Add ID as the last parameter
      updateValues.push(id);
      
      // Execute the update query
      const result = await db.oneOrNone<SiteAssessmentRow>(`
        UPDATE site_assessments
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, updateValues);
      
      if (!result) {
        return null;
      }
      
      return {
        id: result.id,
        title: result.title,
        description: result.description,
        customerId: result.customer_id,
        jobId: result.job_id,
        location: result.location,
        constraints: Array.isArray(result.constraints) ? result.constraints : [],
        notes: result.notes,
        images: Array.isArray(result.images) ? result.images : [],
        videos: Array.isArray(result.videos) ? result.videos : [],
        createdBy: result.created_by,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error updating site assessment:', error);
      throw new Error(`Database error: ${(error as Error).message}`);
    }
  }

  async deleteSiteAssessment(id: string): Promise<boolean> {
    try {
      const result = await db.query('DELETE FROM site_assessments WHERE id = $1', [id]);
      // Check if a row was deleted
      return result && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting site assessment:', error);
      throw new Error(`Database error: ${(error as Error).message}`);
    }
  }
}

const siteAssessmentRepository = new SiteAssessmentRepository();
export default siteAssessmentRepository;
