
export enum Role {
  Admin = 'Admin',
  DepartmentHead = 'DepartmentHead',
  ProjectManager = 'ProjectManager',
  LeadSupervisor = 'LeadSupervisor',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role | null;
}
