import { readFile, writeFile, mkdir, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import simpleGit from 'simple-git';

export class ProjectStore {
  #metaPath;
  #reposDir;
  #projects = [];
  #loaded = false;

  constructor(workspaceDir) {
    this.#metaPath = join(workspaceDir, 'projects.json');
    this.#reposDir = join(workspaceDir, 'repos');
  }

  async load() {
    if (this.#loaded) return;
    await mkdir(this.#reposDir, { recursive: true });
    if (existsSync(this.#metaPath)) {
      const raw = await readFile(this.#metaPath, 'utf-8');
      this.#projects = JSON.parse(raw);
    }
    this.#loaded = true;
  }

  async #save() {
    await writeFile(this.#metaPath, JSON.stringify(this.#projects, null, 2));
  }

  list() {
    return [...this.#projects];
  }

  get(id) {
    return this.#projects.find((p) => p.id === id) ?? null;
  }

  projectDir(id) {
    return join(this.#reposDir, id);
  }

  async createEmpty(name, description = '') {
    const id = randomUUID();
    const dir = this.projectDir(id);
    await mkdir(dir, { recursive: true });

    const project = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.#projects.push(project);
    await this.#save();
    return project;
  }

  async create(name, description = '') {
    const id = randomUUID();
    const dir = this.projectDir(id);
    await mkdir(dir, { recursive: true });

    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>${name}</h1>
        <p>プロジェクトが作成されました。ここから開発を始めましょう。</p>
        <button class="btn" id="main-btn">クリック</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

    const cssContent = `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    background: #0a0a0a;
    color: #ffffff;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    padding: 2rem;
}

h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #00ff88, #00aaff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.1rem;
    margin-bottom: 2rem;
}

.btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px 32px;
    border-radius: 999px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}`;

    const jsContent = `document.getElementById('main-btn').addEventListener('click', () => {
    document.querySelector('h1').textContent = 'こんにちは！';
    document.querySelector('p').textContent = 'ボタンが押されました。';
});`;

    await writeFile(join(dir, 'index.html'), htmlContent);
    await writeFile(join(dir, 'style.css'), cssContent);
    await writeFile(join(dir, 'script.js'), jsContent);

    const git = simpleGit(dir);
    await git.init();
    await git.add('.');
    await git.commit('初期コミット');

    const project = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.#projects.push(project);
    await this.#save();
    return project;
  }

  async update(id, data) {
    const idx = this.#projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    Object.assign(this.#projects[idx], data);
    await this.#save();
    return this.#projects[idx];
  }

  async remove(id) {
    const idx = this.#projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.#projects.splice(idx, 1);
    const dir = this.projectDir(id);
    if (existsSync(dir)) await rm(dir, { recursive: true, force: true });
    await this.#save();
    return true;
  }
}
