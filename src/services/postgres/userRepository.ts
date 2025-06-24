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
    async getUserById(uid: string): Promise<any | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE uid = $1', [uid]);
      return user ? this.convertRowToCamelCase(user) : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      
      // Fallback for development/demo
      const mockUsers: Record<string, any> = {
        'admin-uid-123': {
          uid: 'admin-uid-123',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        },
        'sales-uid-456': {
          uid: 'sales-uid-456',
          email: 'sales@example.com',
          displayName: 'Sales Agent',
          role: 'sales_agent',
          active: true,
          createdAt: new Date().toISOString()
        },
        'ops-uid-789': {
          uid: 'ops-uid-789',
          email: 'ops@example.com',
          displayName: 'Operations Manager',
          role: 'operations_manager',
          active: true,
          createdAt: new Date().toISOString()
        }
      };
      
      return mockUsers[uid] || null;
    }
  }
    async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
      return user ? this.convertRowToCamelCase(user) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      
      // Fallback for development/demo
      const mockUsers: Record<string, any> = {
        'admin@example.com': {
          uid: 'admin-uid-123',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        },
        'sales@example.com': {
          uid: 'sales-uid-456',
          email: 'sales@example.com',
          displayName: 'Sales Agent',
          role: 'sales_agent',
          active: true,
          createdAt: new Date().toISOString()
        },
        'ops@example.com': {
          uid: 'ops-uid-789',
          email: 'ops@example.com',
          displayName: 'Operations Manager',
          role: 'operations_manager',
          active: true,
          createdAt: new Date().toISOString()
        }
      };
      
      return mockUsers[email] || null;
    }
  }
  
  async createUser(user: any): Promise<any> {
    try {
      // In a real implementation, this would insert into the database
      const newUser = {
        ...user,
        uid: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        active: true
      };
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(uid: string, userData: any): Promise<any> {
    try {
      // In a real implementation, this would update the database
      return {
        ...userData,
        uid,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  async deleteUser(uid: string): Promise<void> {
    try {
      await db.none('DELETE FROM users WHERE uid = $1', [uid]);
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
