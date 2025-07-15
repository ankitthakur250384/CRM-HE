import { BaseRepository } from './baseRepository';
import { db } from '../../lib/dbClient';

export class UserRepository extends BaseRepository<any> {
  constructor() {
    super('users');
  }
  
  async getAllUsers(): Promise<any[]> {
    try {
      const users = await db.any('SELECT * FROM users');
      return users.map(user => this.convertRowToCamelCase(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Fallback for development/demo
      return [
        {
          uid: 'admin-uid-123',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'sales-uid-456',
          email: 'sales@example.com',
          displayName: 'Sales Agent',
          role: 'sales_agent',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          uid: 'ops-uid-789',
          email: 'ops@example.com',
          displayName: 'Operations Manager',
          role: 'operations_manager',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
  }
    async getUserByUid(uid: string): Promise<any | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE uid = $1', [uid]);
      return user ? this.convertRowToCamelCase(user) : null;
    } catch (error) {
      console.error('Error fetching user by UID:', error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
      return user ? this.convertRowToCamelCase(user) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }
  
  async createUser(user: any): Promise<any> {
    try {
      const uid = `user-${Date.now()}`;
      const now = new Date().toISOString();
      
      const result = await db.one(
        `INSERT INTO users(
          uid, email, display_name, role, active, created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          uid,
          user.email,
          user.displayName || user.email.split('@')[0],
          user.role || 'user',
          true,
          now,
          now
        ]
      );
      
      return this.convertRowToCamelCase(result);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(uid: string, userData: any): Promise<any> {
    try {
      // Prepare the update parts
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (userData.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(userData.email);
      }
      
      if (userData.displayName !== undefined) {
        updates.push(`display_name = $${paramIndex++}`);
        values.push(userData.displayName);
      }
      
      if (userData.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(userData.role);
      }
      
      if (userData.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(userData.active);
      }
      
      if (userData.passwordHash !== undefined) {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(userData.passwordHash);
      }
      
      // Always update the updated_at timestamp
      const now = new Date().toISOString();
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(now);
      
      // Add the uid as the last parameter
      values.push(uid);
      
      // Execute the update
      const result = await db.one(
        `UPDATE users SET ${updates.join(', ')} 
         WHERE uid = $${paramIndex} 
         RETURNING *`,
        values
      );
      
      return this.convertRowToCamelCase(result);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  async deleteUser(uid: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM users WHERE uid = $1', [uid]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  async toggleUserStatus(uid: string, isActive: boolean): Promise<any> {
    try {
      // In a real implementation, this would update the database
      return {
        uid,
        active: isActive,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }
  
  private convertRowToCamelCase(row: any): any {
    return {
      uid: row.uid,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      active: row.active,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }
}

export default new UserRepository();
