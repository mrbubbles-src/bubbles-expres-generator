#!/usr/bin/env node
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import kleur from 'kleur';
import boxen from 'boxen';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { argv } from 'process';

const args = argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(
    boxen(
      [
        kleur.magenta().bold("🧰 Bubbles' Express Generator — Help"),
        '',
        kleur.white('Usage:'),
        '  npx bubbles-express [project-name|.] [flags]',
        '',
        kleur.white('Flags:'),
        '  --ts       Use TypeScript',
        '  --js       Use JavaScript',
        '  --mongo    Use MongoDB (Mongoose)',
        '  --pg       Use PostgreSQL (Supabase + Drizzle)',
        '  -h, --help Show this help message',
        '',
        kleur.gray('Example:'),
        '  npx bubbles-express my-api --ts --mongo',
        '  npx bubbles-express . --js --pg',
      ].join('\n'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'classic',
        borderColor: 'magenta',
        title: 'Help',
        titleAlignment: 'center',
      },
    ),
  );
  process.exit(0);
}

const isDot = args.includes('.') || args[0] === '.';

const flags = {
  useCurrentDir: isDot,
  projectName: isDot ? '.' : args.find((arg) => !arg.startsWith('--')) || null,
  language: args.includes('--ts') ? 'ts' : args.includes('--js') ? 'js' : null,
  db: args.includes('--mongo') ? 'mongo' : args.includes('--pg') ? 'pg' : null,
};

const isTestMode = process.env.NODE_ENV === 'test';

if (!isTestMode) {
  const hasFlags = flags.language && flags.db;
  const introMessage = hasFlags
    ? `${kleur
        .green()
        .bold('🚀 Oh, I see you know what you want — let’s get started!')}

${kleur.dim(
  `> npx bubbles-express ${flags.projectName} --${flags.language} --${flags.db}`,
)}

${kleur.gray(
  `project: ${flags.projectName} | language: ${flags.language} | database: ${flags.db}`,
)}`
    : `${kleur.magenta().bold("👋 Welcome to Bubbles' Express Generator!")}

${kleur.white("Answer a few questions and we'll get you set up quickly.")}

💡 ${kleur.italic('Need help? Stop and run')} ${kleur.bold(
        'npx bubbles-express -h',
      )}
`;

  console.log(
    boxen(introMessage, {
      padding: 1,
      margin: 1,
      borderStyle: 'classic',
      borderColor: hasFlags ? 'green' : 'magenta',
      title: hasFlags ? 'Auto Setup' : "Let's get started",
      titleAlignment: 'center',
      textAlignment: 'left',
    }),
  );
}

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

    const existingFiles = await fs.readdir(targetDir).catch(() => []);
    if (existingFiles.length > 0) {
      const overwrite =
        isTestMode && process.env.MOCK_OVERWRITE !== undefined
          ? process.env.MOCK_OVERWRITE === '1'
          : (
              await prompts({
                type: 'confirm',
                name: 'overwrite',
                message: `The directory "${path.basename(
                  targetDir,
                )}" is not empty. Overwrite?`,
                initial: false,
              })
            ).overwrite;

      if (!overwrite) {
        const newName =
          isTestMode && process.env.MOCK_RENAME
            ? process.env.MOCK_RENAME
            : (
                await prompts({
                  type: 'text',
                  name: 'newName',
                  message: 'Choose a new name for your project:',
                  initial: `${choices.projectName}-new`,
                })
              ).newName;
        choices.projectName = newName;
        return await createProject(choices);
      } else {
        await fs.rm(targetDir, { recursive: true, force: true });
      }
    }

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

    const spinner = ora('📦 Installing dependencies...').start();
    const { exec } = await import('child_process');
    await new Promise((resolve, reject) => {
      exec('npm install', { cwd: targetDir }, (error, stdout, stderr) => {
        if (error) {
          spinner.fail(kleur.red('❌ npm install failed'));
          console.error(kleur.red(stderr));
          reject(error);
        } else {
          spinner.succeed(kleur.green('✅ Dependencies installed'));
          console.log(kleur.gray(stdout));
          resolve();
        }
      });
    });
    const summaryBox = boxen(
      [
        `🎉 ${kleur.bold('Project created successfully!')}`,
        `${kleur.gray(
          `> npx bubbles-express ${choices.projectName} --${choices.language} --${choices.db}`,
        )}`,
        '',
        `${kleur.bold('📂 Project Folder:')} ${kleur.green(
          path.basename(targetDir),
        )}`,
        `${kleur.bold('🛠️  Language:')}       ${kleur.yellow(
          choices.language,
        )}`,
        `${kleur.bold('🗃️  Database:')}       ${kleur.cyan(choices.db)}`,
        '',
        kleur.italic('Happy coding! 🚀'),
        '',
        kleur.bold('👉 Next steps:'),
        `  ${kleur.dim(`cd ${path.basename(targetDir)}`)}`,
        `  ${kleur.dim('npm run dev')}`,
      ].join('\n'),
      {
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: 1,
        borderStyle: 'classic',
        borderColor: 'green',
        title: 'Setup Complete',
        titleAlignment: 'center',
        textAlignment: 'left',
        align: 'left',
      },
    );

    console.log(summaryBox);
  } catch (error) {
    console.error('Error creating project:', error);
    return;
  }
};

createProject(response);
