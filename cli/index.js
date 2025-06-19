#!/usr/bin/env node
import prompts from "prompts";
import fs from "fs/promises";
import path from "path";

const response = await prompts([
	{
		type: "text",
		name: "projectName",
		message: "What is the name of your project?",
		initial: "backend",
	},
	{
		type: "select",
		name: "language",
		message: "What language do you want to use?",
		choices: [
			{ title: "JavaScript", value: "js" },
			{ title: "TypeScript", value: "ts" },
		],
	},
	{
		type: "select",
		name: "db",
		message: "What database do you want to use?",
		choices: [
			{ title: "MongoDB (Atlas) with Mongoose ODM", value: "mongo" },
			{ title: "Supabase PostgreSQL with Drizzle ORM", value: "pg" },
		],
	},
]);

const createProject = async (choices) => {
	try {
		const templateDir = `templates/${choices.language}-${choices.db}`;
		const targetDir = path.resolve(process.cwd(), choices.projectName);

		await fs.mkdir(targetDir, { recursive: true });
		await fs.cp(templateDir, targetDir, { recursive: true });

		const placeholders = {
			"{{__PROJECT_NAME__}}": choices.projectName,
		};

		const replacePlaceholders = async (dir) => {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					await replacePlaceholders(fullPath);
				} else {
					let content = await fs.readFile(fullPath, "utf-8");
					let updated = content;
					for (const [placeholder, value] of Object.entries(placeholders)) {
						updated = updated.replace(new RegExp(placeholder, "g"), value);
					}
					if (updated !== content) {
						await fs.writeFile(fullPath, updated, "utf-8");
					}
				}
			}
		};

		await replacePlaceholders(targetDir);

		console.log("Installing dependencies...");
		const { exec } = await import("child_process");
		await new Promise((resolve, reject) => {
			exec("npm install", { cwd: targetDir }, (error, stdout, stderr) => {
				if (error) {
					console.error(`npm install failed: ${stderr}`);
					reject(error);
				} else {
					console.log(stdout);
					resolve();
				}
			});
		});
	} catch (error) {
		console.error("Error creating project:", error);
		return;
	}
};
createProject(response);
