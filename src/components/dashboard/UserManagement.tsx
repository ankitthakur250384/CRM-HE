import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical,
  User,
  Mail,
  Phone,
  Shield,
  Edit2,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_agent' | 'operations_manager' | 'operator' | 'support';
  status: 'active' | 'inactive' | 'pending';
  lastActive?: Date;
  phone?: string;
  avatar?: string;
}

interface UserManagementProps {
  users?: User[];
  className?: string;
  onAddUser?: () => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

const getRoleColor = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'sales_agent':
      return 'bg-blue-100 text-blue-800';
    case 'operations_manager':
      return 'bg-green-100 text-green-800';
    case 'operator':
      return 'bg-orange-100 text-orange-800';
    case 'support':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: User['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatRoleDisplay = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'sales_agent':
      return 'Sales Agent';
    case 'operations_manager':
      return 'Operations Manager';
    case 'operator':
      return 'Operator';
    case 'support':
      return 'Support';
    default:
      return role;
  }
};

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@aspcranes.com',
    role: 'admin',
    status: 'active',
    lastActive: new Date(),
    phone: '+91 98765 43210'
  },
  {
    id: '2',
    name: 'John Sales',
    email: 'john.sales@aspcranes.com',
    role: 'sales_agent',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    phone: '+91 98765 43211'
  },
  {
    id: '3',
    name: 'Mike Operations',
    email: 'mike.ops@aspcranes.com',
    role: 'operations_manager',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    phone: '+91 98765 43212'
  },
  {
    id: '4',
    name: 'Sam Operator',
    email: 'sam.operator@aspcranes.com',
    role: 'operator',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    phone: '+91 98765 43213'
  },
  {
    id: '5',
    name: 'New User',
    email: 'new.user@aspcranes.com',
    role: 'operator',
    status: 'pending',
    phone: '+91 98765 43214'
  }
];

export function UserManagement({ 
  users = mockUsers, 
  className,
  onAddUser,
  onEditUser,
  onDeleteUser 
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const formatLastActive = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        </div>
        
        {onAddUser && (
          <Button onClick={onAddUser} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        )}
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <Badge className={getRoleColor(user.role)}>
                      {formatRoleDisplay(user.role)}
                    </Badge>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Last active: {formatLastActive(user.lastActive)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                {onEditUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUser(user)}
                    className="p-2 h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                
                {onDeleteUser && user.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user.id)}
                    className="p-2 h-8 w-8 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      {filteredUsers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all users →
          </button>
        </div>
      )}
    </Card>
  );
}
