import type { Project, FileEntry, GitLogEntry, GitStatus } from '../types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Projects ──

export function listProjects(): Promise<Project[]> {
  return request('/projects');
}

export function getProject(id: string): Promise<Project> {
  return request(`/projects/${id}`);
}

export function createProject(name: string, description = ''): Promise<Project> {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return request(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string): Promise<{ ok: boolean }> {
  return request(`/projects/${id}`, { method: 'DELETE' });
}

// ── Files ──

export function getFileTree(projectId: string): Promise<FileEntry[]> {
  return request(`/projects/${projectId}/tree`);
}

export function readFile(projectId: string, path: string): Promise<{ path: string; content: string }> {
  return request(`/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
}

export function writeFile(projectId: string, path: string, content: string): Promise<{ ok: boolean }> {
  return request(`/projects/${projectId}/file`, {
    method: 'PUT',
    body: JSON.stringify({ path, content }),
  });
}

export function createFile(
  projectId: string,
  path: string,
  kind: 'file' | 'folder',
  content = '',
): Promise<{ ok: boolean }> {
  return request(`/projects/${projectId}/file`, {
    method: 'POST',
    body: JSON.stringify({ path, kind, content }),
  });
}

export function deleteFile(projectId: string, path: string): Promise<{ ok: boolean }> {
  return request(`/projects/${projectId}/file?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
  });
}

// ── Git ──

export function gitLog(projectId: string): Promise<GitLogEntry[]> {
  return request(`/projects/${projectId}/git/log`);
}

export function gitStatus(projectId: string): Promise<GitStatus> {
  return request(`/projects/${projectId}/git/status`);
}

export function gitCommit(projectId: string, message?: string): Promise<{ ok: boolean; hash?: string }> {
  return request(`/projects/${projectId}/git/commit`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function gitRevert(projectId: string, hash: string): Promise<{ ok: boolean }> {
  return request(`/projects/${projectId}/git/revert`, {
    method: 'POST',
    body: JSON.stringify({ hash }),
  });
}

// ── Preview URL ──

export function previewUrl(projectId: string, path = ''): string {
  return `${BASE}/projects/${projectId}/preview/${path}`;
}
