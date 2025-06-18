import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, UserRole } from '../../types/auth';

// Default avatars based on roles
const DEFAULT_AVATARS = {
  admin: 'https://ui-avatars.com/api/?name=Admin&background=2563EB&color=fff',
  sales_agent: 'https://ui-avatars.com/api/?name=Sales&background=10B981&color=fff',
  operations_manager: 'https://ui-avatars.com/api/?name=Manager&background=F59E0B&color=fff',
  operator: 'https://ui-avatars.com/api/?name=Operator&background=8B5CF6&color=fff',
  support: 'https://ui-avatars.com/api/?name=Support&background=EC4899&color=fff',
  default: 'https://ui-avatars.com/api/?name=User&background=6B7280&color=fff',
};

interface ExtendedUser extends User {
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt?: any;
}

/**
 * Fetch all users from Firestore
 */
export const fetchUsers = async (): Promise<ExtendedUser[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data() as ExtendedUser;
      const role = data.role || 'operator';
      
      // Generate avatar URL if one doesn't exist
      let avatarUrl = data.avatar;
      if (!avatarUrl) {
        // If user has a name, generate avatar based on initials
        if (data.name) {
          const nameEncoded = encodeURIComponent(data.name);
          avatarUrl = `https://ui-avatars.com/api/?name=${nameEncoded}&background=${getRoleColor(role)}&color=fff`;
        } else {
          // Otherwise use role-based default
          avatarUrl = DEFAULT_AVATARS[role as keyof typeof DEFAULT_AVATARS] || DEFAULT_AVATARS.default;
        }
      }
      
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: role,
        status: data.status || 'active',
        avatar: avatarUrl
      };
    });
    
    console.log('✅ Fetched users:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Helper function to get color for role-based avatars
 */
function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '2563EB'; // Blue
    case 'sales_agent':
      return '10B981'; // Green
    case 'operations_manager':
      return 'F59E0B'; // Amber
    case 'operator':
      return '8B5CF6'; // Purple
    case 'support':
      return 'EC4899'; // Pink
    default:
      return '6B7280'; // Gray
  }
}

/**
 * Get a single user by ID
 */
export const getUserById = async (userId: string): Promise<ExtendedUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data() as ExtendedUser;
    const role = data.role || 'operator';
    
    // Generate avatar URL if one doesn't exist
    let avatarUrl = data.avatar;
    if (!avatarUrl) {
      // If user has a name, generate avatar based on initials
      if (data.name) {
        const nameEncoded = encodeURIComponent(data.name);
        avatarUrl = `https://ui-avatars.com/api/?name=${nameEncoded}&background=${getRoleColor(role)}&color=fff`;
      } else {
        // Otherwise use role-based default
        avatarUrl = DEFAULT_AVATARS[role as keyof typeof DEFAULT_AVATARS] || DEFAULT_AVATARS.default;
      }
    }
    
    return {
      id: userDoc.id,
      name: data.name || '',
      email: data.email || '',
      role: role,
      status: data.status || 'active',
      avatar: avatarUrl
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Update an existing user in Firestore
 */
export const updateUser = async (userId: string, userData: Partial<ExtendedUser>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ User updated successfully:', userId);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Update a user's status (active/inactive)
 */
export const toggleUserStatus = async (userId: string, newStatus: 'active' | 'inactive'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    console.log(`✅ User ${userId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Delete a user from Firestore (Note: This doesn't delete the Firebase Auth account)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ User deleted successfully:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: UserRole): Promise<ExtendedUser[]> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', role)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as ExtendedUser;
      const userRole = data.role || 'operator';
      
      // Generate avatar URL if one doesn't exist
      let avatarUrl = data.avatar;
      if (!avatarUrl) {
        // If user has a name, generate avatar based on initials
        if (data.name) {
          const nameEncoded = encodeURIComponent(data.name);
          avatarUrl = `https://ui-avatars.com/api/?name=${nameEncoded}&background=${getRoleColor(userRole)}&color=fff`;
        } else {
          // Otherwise use role-based default
          avatarUrl = DEFAULT_AVATARS[userRole as keyof typeof DEFAULT_AVATARS] || DEFAULT_AVATARS.default;
        }
      }
      
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: userRole,
        status: data.status || 'active',
        avatar: avatarUrl
      };
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};
