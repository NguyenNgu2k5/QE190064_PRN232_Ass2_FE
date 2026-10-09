export type Department = {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
  projects: ProjectSummary[];
};

export type ProjectSummary = { projectId: number; projectName: string; status: number; startDate: string; endDate?: string | null };
export type Project = ProjectSummary & { description?: string | null; departmentId: number; departmentName: string; isActive: boolean; createdDate: string; tasks: TaskSummary[] };
export type TaskSummary = { taskId: number; title: string; status: number; priority: number; dueDate?: string | null };
export type Task = TaskSummary & { description?: string | null; projectId: number; projectName: string; departmentName: string; isActive: boolean; createdDate: string; modifiedDate?: string | null; tags: Tag[] };
export type Tag = { tagId: number; tagName: string; color?: string | null };

export type Account = { accountId: number; fullName: string; email: string; role: 0 | 1; createdDate: string };
