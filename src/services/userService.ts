import userRepository from './postgres/userRepository';
import { User, UserRole } from '../types/auth';

/**
 * Get all users
 */
export const fetchUsers = async (): Promise<User[]> => {
  try {
    return await userRepository.getAllUsers();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    return await userRepository.getUserById(uid);
  } catch (error) {
    console.error(`Error fetching user ${uid}:`, error);
    return null;
  }
};

/**
 * Create a new user (previously signUp)
 */
export const signUp = async (email: string, password: string, displayName: string, role: UserRole): Promise<User | null> => {
  try {
    return await userRepository.createUser({
      email,
      displayName,
      role,
      active: true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user details
 */
export const updateUser = async (uid: string, userData: Partial<User>): Promise<User> => {
  try {
    return await userRepository.updateUser(uid, userData);
  } catch (error) {
    console.error(`Error updating user ${uid}:`, error);
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await userRepository.deleteUser(uid);
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw error;
  }
};

/**
 * Enable or disable a user account
 */
export const toggleUserStatus = async (uid: string, isActive: boolean): Promise<User> => {
  try {
    return await userRepository.toggleUserStatus(uid, isActive);
  } catch (error) {
    console.error(`Error toggling status for user ${uid}:`, error);
    throw error;
  }
};
