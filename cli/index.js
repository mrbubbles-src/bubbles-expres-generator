#!/usr/bin/env node
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { argv } from 'process';

const args = argv.slice(2);

const isDot = args.includes('.') || args[0] === '.';

const flags = {
  useCurrentDir: isDot,
  projectName: isDot ? '.' : args.find((arg) => !arg.startsWith('--')) || null,
  language: args.includes('--ts') ? 'ts' : args.includes('--js') ? 'js' : null,
  db: args.includes('--mongo') ? 'mongo' : args.includes('--pg') ? 'pg' : null,
};

const isTestMode = process.env.NODE_ENV === 'test';

const mockResponses = isTestMode
  ? {
      projectName: flags.projectName ?? 'test-app',
      language: flags.language ?? 'js',
      db: flags.db ?? 'mongo',
    }
  : null;

const promptQuestions = [];

if (!flags.projectName || flags.projectName.trim() === '') {
  promptQuestions.push({
    type: 'text',
    name: 'projectName',
    message: 'What is the name of your project?',
    initial: 'backend',
  });
}

if (!flags.language) {
  promptQuestions.push({
    type: 'select',
    name: 'language',
    message: 'What language do you want to use?',
    choices: [
      { title: 'JavaScript', value: 'js' },
      { title: 'TypeScript', value: 'ts' },
    ],
  });
}

if (!flags.db) {
  promptQuestions.push({
    type: 'select',
    name: 'db',
    message: 'What database do you want to use?',
    choices: [
      { title: 'MongoDB (Atlas) with Mongoose ODM', value: 'mongo' },
      { title: 'Supabase PostgreSQL with Drizzle ORM', value: 'pg' },
    ],
  });
}

let response;

if (isTestMode) {
  response = mockResponses;
} else {
  response = await prompts(promptQuestions);
}

response.projectName = flags.projectName ?? response.projectName;
response.language = flags.language ?? response.language;
response.db = flags.db ?? response.db;

const createProject = async (choices) => {
  try {
    if (!choices.language || !choices.db) {
      const moreChoices = await prompts([
        {
          type: 'select',
          name: 'language',
          message: 'What language do you want to use?',
          choices: [
            { title: 'JavaScript', value: 'js' },
            { title: 'TypeScript', value: 'ts' },
          ],
        },
        {
          type: 'select',
          name: 'db',
          message: 'What database do you want to use?',
          choices: [
            { title: 'MongoDB (Atlas) with Mongoose ODM', value: 'mongo' },
            { title: 'Supabase PostgreSQL with Drizzle ORM', value: 'pg' },
          ],
        },
      ]);
      Object.assign(choices, moreChoices);
    }

    const templateDir = path.resolve(
      __dirname,
      '..',
      `templates/${choices.language}-${choices.db}`,
    );
    const targetDir = path.resolve(
      process.cwd(),
      choices.projectName === '.' ? '.' : choices.projectName,
    );

    await fs.mkdir(targetDir, { recursive: true });
    await fs.cp(templateDir, targetDir, { recursive: true });

    const placeholders = {
      '{{__PROJECT_NAME__}}': path.basename(targetDir),
    };

    const replacePlaceholders = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await replacePlaceholders(fullPath);
        } else {
          let content = await fs.readFile(fullPath, 'utf-8');
          let updated = content;
          for (const [placeholder, value] of Object.entries(placeholders)) {
            updated = updated.replace(new RegExp(placeholder, 'g'), value);
          }
          if (updated !== content) {
            await fs.writeFile(fullPath, updated, 'utf-8');
          }
        }
      }
    };

    await replacePlaceholders(targetDir);

    console.log('Installing dependencies...');
    const { exec } = await import('child_process');
    await new Promise((resolve, reject) => {
      exec('npm install', { cwd: targetDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`npm install failed: ${stderr}`);
          reject(error);
        } else {
          console.log(stdout);
          resolve();
        }
      });
    });
    console.log('✅ Project created successfully.');
  } catch (error) {
    console.error('Error creating project:', error);
    return;
  }
};
createProject(response);
