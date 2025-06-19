import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../cli/index.js');
const TEST_PROJECTS_DIR = path.resolve(__dirname, 'test-projects');

const runCLI = async (args = [], cwd = TEST_PROJECTS_DIR) => {
  return await execa('node', [CLI_PATH, ...args], {
    cwd,
    env: { FORCE_COLOR: '0' },
    stdin: 'ignore',
  });
};

const projectExists = async (dir) => {
  const fullPath = path.join(TEST_PROJECTS_DIR, dir);
  return await fs.pathExists(path.join(fullPath, 'package.json'));
};

describe('bubbles-express CLI', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_PROJECTS_DIR);
  });

  afterEach(async () => {
    await fs.emptyDir(TEST_PROJECTS_DIR);
  });

  // Dynamically generate tests for all template directories
  const templatesRoot = path.resolve(__dirname, '../templates');
  let templateDirs = [];
  try {
    templateDirs = fs.readdirSync(templatesRoot).filter((dir) => {
      const fullPath = path.join(templatesRoot, dir);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch (err) {
    // If templates/ doesn't exist, skip tests
    templateDirs = [];
  }

  // Extract language and db combos from template dirs like js-mongo, ts-pg, etc
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
    // 1. Test creation in current directory with "."
    it(`creates project in current directory with "." and no flags [${language}-${db}]`, async () => {
      const testDir = path.join(
        TEST_PROJECTS_DIR,
        `${language}-${db}-dot-no-flags`,
      );
      await fs.ensureDir(testDir);
      const result = await runCLI(['.'], testDir);
      const exists = await projectExists(`${language}-${db}-dot-no-flags`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created/i);
      expect(exists).toBe(true);
    });

    // 2. Test creation with custom name, no flags
    it(`creates project with name and no flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-testbackend-no-flags`;
      const result = await runCLI([customName]);
      const exists = await projectExists(customName);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created/i);
      expect(exists).toBe(true);
    });

    // 3. Test flag-based invocation with custom name
    it(`creates project with name and flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-testbackend-flags`;
      const langFlag = `--${language}`;
      const dbFlag = db === 'mongo' ? '--mongo' : '--pg';
      const result = await runCLI([customName, langFlag, dbFlag]);
      const exists = await projectExists(customName);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created/i);
      expect(exists).toBe(true);
    });

    // 4. Test flag-based invocation in current directory
    it(`creates project in current directory with "." and flags [${language}-${db}]`, async () => {
      const testDir = path.join(
        TEST_PROJECTS_DIR,
        `${language}-${db}-dot-flags`,
      );
      await fs.ensureDir(testDir);
      const langFlag = `--${language}`;
      const dbFlag = db === 'mongo' ? '--mongo' : '--pg';
      const result = await runCLI(['.', langFlag, dbFlag], testDir);
      const exists = await projectExists(`${language}-${db}-dot-flags`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created/i);
      expect(exists).toBe(true);
    });
  });
});
