import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

vi.mock('update-notifier', () => {
  return () => ({
    notify: () => {},
  });
});

const CLI_PATH = path.resolve(__dirname, '../cli/index.js');
const TEST_PROJECTS_DIR = path.resolve(__dirname, 'test-projects');

const runCLI = async (
  args = [],
  cwd = TEST_PROJECTS_DIR,
  envOverrides = {},
) => {
  return await execa('node', [CLI_PATH, ...args], {
    cwd,
    env: { FORCE_COLOR: '0', ...envOverrides },
    stdin: 'ignore',
  });
};

const projectExists = async (dir) => {
  const fullPath = path.join(TEST_PROJECTS_DIR, dir);
  try {
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

describe('bubbles-express CLI', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_PROJECTS_DIR);
  });

  afterEach(async () => {
    const files = await fs.readdir(TEST_PROJECTS_DIR);
    await Promise.all(
      files.map(async (file) => {
        if (file !== '.gitkeep') {
          await fs.remove(path.join(TEST_PROJECTS_DIR, file));
        }
      }),
    );
  });

  const templatesRoot = path.resolve(__dirname, '../templates');
  let templateDirs = [];
  try {
    templateDirs = fs.readdirSync(templatesRoot).filter((dir) => {
      const fullPath = path.join(templatesRoot, dir);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch (err) {
    templateDirs = [];
  }

  const combos = templateDirs
    .map((dir) => {
      const match = /^([a-z]+)-([a-z]+)/.exec(dir);
      if (match) {
        return { language: match[1], db: match[2] };
      }
      return null;
    })
    .filter(Boolean);

  combos.forEach(({ language, db }) => {
    it(`creates project in current directory with "." and no flags [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-no-flags`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'dummy.txt'), 'placeholder');

      const resultOverwrite = await runCLI(['.'], testDir, {
        NODE_ENV: 'test',
        MOCK_OVERWRITE: '1',
      });
      expect(resultOverwrite.exitCode).toBe(0);
      expect(resultOverwrite.stdout).toMatch(/Project created successfully/i);
      const existsOverwrite = await projectExists(testDirName);
      expect(existsOverwrite).toBe(true);

      const renameDir = `${language}-${db}-renamed`;
      const resultRename = await runCLI(['.'], testDir, {
        NODE_ENV: 'test',
        MOCK_OVERWRITE: '0',
        MOCK_RENAME: renameDir,
      });
      expect(resultRename.stdout).toMatch(/Project created successfully/i);
      const existsRename = await projectExists(
        path.join(testDirName, renameDir),
      );
      expect(existsRename).toBe(true);
    });

    it(`creates project with name and no flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-testbackend-no-flags`;
      const result = await runCLI([customName]);
      const exists = await projectExists(customName);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Setup complete/i);
      expect(exists).toBe(true);
    });

    it(`creates project with name and flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-testbackend-flags`;
      const langFlag = `--${language}`;
      const dbFlag = db === 'mongo' ? '--mongo' : '--pg';
      const result = await runCLI([customName, langFlag, dbFlag]);
      const exists = await projectExists(customName);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Setup complete/i);
      expect(exists).toBe(true);
    });

    it(`creates project in current directory with "." and flags [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-flags`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'dummy.txt'), 'placeholder');

      const langFlag = `--${language}`;
      const dbFlag = db === 'mongo' ? '--mongo' : '--pg';

      const resultOverwrite = await runCLI(['.', langFlag, dbFlag], testDir, {
        NODE_ENV: 'test',
        MOCK_OVERWRITE: '1',
      });
      expect(resultOverwrite.exitCode).toBe(0);
      expect(resultOverwrite.stdout).toMatch(/Project created successfully/i);
      const existsOverwrite = await projectExists(testDirName);
      expect(existsOverwrite).toBe(true);

      const renameDir = `${language}-${db}-renamed`;
      const resultRename = await runCLI(['.', langFlag, dbFlag], testDir, {
        NODE_ENV: 'test',
        MOCK_OVERWRITE: '0',
        MOCK_RENAME: renameDir,
      });
      expect(resultRename.stdout).toMatch(/Project created successfully/i);
      const existsRename = await projectExists(
        path.join(testDirName, renameDir),
      );
      expect(existsRename).toBe(true);
    });
  });

  it('prompts for overwrite and renames if declined', async () => {
    const initialDir = 'ts-mongo-dot-no-flags';
    const renameDir = 'ts-mongo-renamed';

    await fs.ensureDir(path.join(TEST_PROJECTS_DIR, initialDir));
    await fs.writeFile(
      path.join(TEST_PROJECTS_DIR, initialDir, 'dummy.txt'),
      'placeholder',
    );

    const result = await runCLI(
      ['.'],
      path.join(TEST_PROJECTS_DIR, initialDir),
      {
        NODE_ENV: 'test',
        MOCK_OVERWRITE: '0',
        MOCK_RENAME: renameDir,
      },
    );
    const exists = await projectExists(path.join(initialDir, renameDir));
    expect(result.stdout).toMatch(/Project created successfully/i);
    expect(exists).toBe(true);
  });
});
