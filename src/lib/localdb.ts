/**
 * Local-first storage.
 *
 * Everything a student creates — accounts, saved snippets, projects, notes,
 * chat history — lives in this browser. No server, no database, no cloud.
 */

export interface LocalUser {
  id: string;
  username: string;
  salt: string;
  hash: string;
  created_at: string;
}

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  code: string;
  language: string;
  explanation: string;
  level: string;
  mode: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language: string;
  explanation: string | null;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  file_path: string | null;
  content: string;
  created_at: string;
}

export interface ProjectChatMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface DB {
  users: LocalUser[];
  snippets: Snippet[];
  collections: Collection[];
  projects: Project[];
  projectFiles: ProjectFile[];
  projectNotes: ProjectNote[];
  projectChat: ProjectChatMessage[];
}

const DB_KEY = "explyn:db:v1";

const EMPTY_DB: DB = {
  users: [],
  snippets: [],
  collections: [],
  projects: [],
  projectFiles: [],
  projectNotes: [],
  projectChat: [],
};

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function readDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...EMPTY_DB };
    return { ...EMPTY_DB, ...(JSON.parse(raw) as Partial<DB>) };
  } catch {
    return { ...EMPTY_DB };
  }
}

export function writeDB(db: DB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new Error(
      "This browser's local storage is full. Delete an old project or snippet to make room.",
    );
  }
}

function mutate(fn: (db: DB) => void) {
  const db = readDB();
  fn(db);
  writeDB(db);
  return db;
}

/* ---------------- snippets ---------------- */

export function listSnippets(userId: string) {
  return readDB()
    .snippets.filter((s) => s.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getSnippet(id: string) {
  return readDB().snippets.find((s) => s.id === id) || null;
}

export function createSnippet(input: Omit<Snippet, "id" | "created_at">) {
  const snippet: Snippet = { ...input, id: uid(), created_at: new Date().toISOString() };
  mutate((db) => void db.snippets.unshift(snippet));
  return snippet;
}

export function deleteSnippet(id: string) {
  mutate((db) => {
    db.snippets = db.snippets.filter((s) => s.id !== id);
  });
}

/* ---------------- collections ---------------- */

export function listCollections(userId: string) {
  return readDB()
    .collections.filter((c) => c.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createCollection(userId: string, name: string) {
  const collection: Collection = {
    id: uid(),
    user_id: userId,
    name,
    created_at: new Date().toISOString(),
  };
  mutate((db) => void db.collections.unshift(collection));
  return collection;
}

export function deleteCollection(id: string) {
  mutate((db) => {
    db.collections = db.collections.filter((c) => c.id !== id);
  });
}

/* ---------------- projects ---------------- */

export function listProjects(userId: string) {
  return readDB()
    .projects.filter((p) => p.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getProject(id: string) {
  return readDB().projects.find((p) => p.id === id) || null;
}

export function createProject(
  userId: string,
  name: string,
  files: { path: string; content: string; language: string }[],
) {
  const project: Project = {
    id: uid(),
    user_id: userId,
    name,
    created_at: new Date().toISOString(),
  };
  const projectFiles: ProjectFile[] = files.map((f) => ({
    id: uid(),
    project_id: project.id,
    path: f.path,
    content: f.content,
    language: f.language,
    explanation: null,
  }));
  mutate((db) => {
    db.projects.unshift(project);
    db.projectFiles.push(...projectFiles);
  });
  return project;
}

export function deleteProject(id: string) {
  mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.projectFiles = db.projectFiles.filter((f) => f.project_id !== id);
    db.projectNotes = db.projectNotes.filter((n) => n.project_id !== id);
    db.projectChat = db.projectChat.filter((m) => m.project_id !== id);
  });
}

export function listProjectFiles(projectId: string) {
  return readDB().projectFiles.filter((f) => f.project_id === projectId);
}

export function countProjectFiles(projectId: string) {
  return readDB().projectFiles.filter((f) => f.project_id === projectId).length;
}

export function setFileExplanation(fileId: string, explanation: string) {
  mutate((db) => {
    const file = db.projectFiles.find((f) => f.id === fileId);
    if (file) file.explanation = explanation;
  });
}

/* ---------------- notes ---------------- */

export function listNotes(projectId: string) {
  return readDB()
    .projectNotes.filter((n) => n.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createNote(
  projectId: string,
  userId: string,
  filePath: string | null,
  content: string,
) {
  const note: ProjectNote = {
    id: uid(),
    project_id: projectId,
    user_id: userId,
    file_path: filePath,
    content,
    created_at: new Date().toISOString(),
  };
  mutate((db) => void db.projectNotes.unshift(note));
  return note;
}

export function deleteNote(id: string) {
  mutate((db) => {
    db.projectNotes = db.projectNotes.filter((n) => n.id !== id);
  });
}

/* ---------------- project chat ---------------- */

export function listProjectChat(projectId: string) {
  return readDB()
    .projectChat.filter((m) => m.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function appendProjectChat(
  projectId: string,
  role: "user" | "assistant",
  content: string,
) {
  const message: ProjectChatMessage = {
    id: uid(),
    project_id: projectId,
    role,
    content,
    created_at: new Date().toISOString(),
  };
  mutate((db) => void db.projectChat.push(message));
  return message;
}

/* ---------------- users (used by lib/auth) ---------------- */

export function findUser(username: string) {
  const lower = username.trim().toLowerCase();
  return readDB().users.find((u) => u.username.toLowerCase() === lower) || null;
}

export function insertUser(user: LocalUser) {
  mutate((db) => void db.users.push(user));
  return user;
}

export function getUserById(id: string) {
  return readDB().users.find((u) => u.id === id) || null;
}

/* ---------------- export / import ---------------- */

export function exportData() {
  return JSON.stringify(readDB(), null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as Partial<DB>;
  writeDB({ ...EMPTY_DB, ...parsed });
}

export function clearAllData() {
  localStorage.removeItem(DB_KEY);
}
