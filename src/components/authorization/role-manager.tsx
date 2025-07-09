'use client';

import { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RESOURCES } from '@/types/authorization';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface RoleManagerProps {
  users: User[];
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>;
}

const roleLabels = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.MANAGER]: 'Gerente',
  [UserRole.EMPLOYEE]: 'Funcionário',
};

const roleColors = {
  [UserRole.ADMIN]: 'bg-red-100 text-red-800',
  [UserRole.MANAGER]: 'bg-blue-100 text-blue-800',
  [UserRole.EMPLOYEE]: 'bg-green-100 text-green-800',
};

const rolePermissions = {
  [UserRole.ADMIN]: [
    'Acesso total ao sistema',
    'Gerenciar usuários e roles',
    'Visualizar logs de auditoria',
    'Configurações do sistema',
    'Backup e restauração',
  ],
  [UserRole.MANAGER]: [
    'Gerenciar funcionários',
    'Ajustar registros de ponto',
    'Gerar relatórios',
    'Configurações da empresa',
    'Visualizar dados da equipe',
  ],
  [UserRole.EMPLOYEE]: [
    'Registrar ponto',
    'Visualizar próprio perfil',
    'Configurar autenticação 2FA',
    'Configurar NFC e biometria',
    'Visualizar próprios registros',
  ],
};

export function RoleManager({ users, onRoleChange }: RoleManagerProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole | ''>('');
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setIsChangingRole(true);
    try {
      if (onRoleChange) await onRoleChange(selectedUser.id, newRole as UserRole);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Erro ao alterar role:', error);
    } finally {
      setIsChangingRole(false);
    }
  };

  const getUsersByRole = (role: UserRole) => {
    return users.filter(user => user.role === role);
  };

  return (
    <div className="space-y-6">
      {/* Visão geral dos roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(UserRole).map(role => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={roleColors[role]}>
                  {roleLabels[role]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({getUsersByRole(role).length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {rolePermissions[role].map((permission, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                    {permission}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Roles de Usuários</CardTitle>
          <CardDescription>
            Altere as permissões dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      Alterar Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Role do Usuário</DialogTitle>
                      <DialogDescription>
                        Altere as permissões de {user.name || user.email}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role">Nova Role</Label>
                        <Select 
                          value={newRole} 
                          onValueChange={(value) => setNewRole(value as UserRole)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma role" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UserRole).map(role => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Badge className={roleColors[role]} variant="secondary">
                                    {roleLabels[role]}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {newRole && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Permissões da {roleLabels[newRole as UserRole]}:</h4>
                          <ul className="space-y-1 text-sm">
                            {rolePermissions[newRole as UserRole].map((permission, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                {permission}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUser(null);
                            setNewRole('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleRoleChange}
                          disabled={!newRole || isChangingRole}
                        >
                          {isChangingRole ? 'Alterando...' : 'Confirmar Alteração'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matriz de permissões */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>
            Visão detalhada das permissões por role e recurso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Recurso/Ação</th>
                  {Object.values(UserRole).map(role => (
                    <th key={role} className="text-center p-2">
                      <Badge className={roleColors[role]} variant="secondary">
                        {roleLabels[role]}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(RESOURCES).map(([key, resource]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-medium">{resource}</td>
                    {Object.values(UserRole).map(role => {
                      const hasAccess = rolePermissions[role].some(permission => 
                        permission.toLowerCase().includes(resource.toLowerCase())
                      );
                      return (
                        <td key={role} className="text-center p-2">
                          {hasAccess ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 