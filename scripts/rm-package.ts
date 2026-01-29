#!/usr/bin/env bun

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { getProjectRoot } from './utils';
import { colors } from './utils';

try {
    // Change working directory to the root of the project
    const rootDir = getProjectRoot();
    process.chdir(rootDir);

    // Ask for package name
    let name = prompt(`${colors.blue}Enter package name to remove:${colors.reset} `) ?? "";

    // Make name lowercase, remove non-alphanumeric characters, and replace spaces with hyphens
    name = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!name || name.trim() === '') {
        console.error(`${colors.red}❌ Package name cannot be empty${colors.reset}`);
        process.exit(1);
    }

    const packageName = name.trim();
    const packagePath = join('packages', packageName);

    // Check if directory exists
    if (!existsSync(packagePath)) {
        console.error(`${colors.red}❌ Directory 'packages/${packageName}' does not exist${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.blue}${colors.bold}Removing package ${packageName} from ${packagePath}${colors.reset}`);

    // Check if this is actually a git submodule
    try {
        execSync(`git submodule status ${packagePath}`, { stdio: 'pipe' });
    } catch (error) {
        console.error(`${colors.red}❌ '${packageName}' is not a git submodule${colors.reset}`);
        process.exit(1);
    }

    // Remove the submodule from git
    console.log(`${colors.yellow}🗑️  Removing git submodule...${colors.reset}`);
    execSync(`git submodule deinit -f ${packagePath}`, {
        stdio: 'inherit',
    });

    // Remove the submodule from .git/modules
    console.log(`${colors.yellow}🧹 Cleaning up .git/modules...${colors.reset}`);
    try {
        execSync(`rm -rf .git/modules/${packagePath}`, {
            stdio: 'inherit',
        });
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not remove .git/modules/${packagePath} (may not exist)${colors.reset}`);
    }

    // Remove the submodule from .gitmodules file
    console.log(`${colors.yellow}📝 Updating .gitmodules file...${colors.reset}`);
    try {
        execSync(`git rm --cached ${packagePath}`, {
            stdio: 'inherit',
        });
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not remove from git index (may not be tracked)${colors.reset}`);
    }

    // Remove the package directory
    console.log(`${colors.yellow}🗂️  Removing package directory...${colors.reset}`);
    try {
        rmSync(packagePath, { recursive: true });
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not remove directory, you may need to remove it manually${colors.reset}`);
    }

    // Commit the changes
    console.log(`${colors.yellow}💾 Staging changes...${colors.reset}`);
    try {
        execSync(`git add .gitmodules`, {
            stdio: 'inherit',
        });
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not stage changes automatically${colors.reset}`);
        console.log(`${colors.blue}You may need to stage and commit the changes manually:${colors.reset}`);
        console.log(`${colors.blue}  git add .gitmodules${colors.reset}`);
        console.log(`${colors.blue}  git commit -m "Remove submodule ${packageName}"${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ Package ${packageName} removed successfully!${colors.reset}`);
    console.log(`\n${colors.blue}Note:${colors.reset} The git submodule has been removed and the package directory deleted.`);

} catch (error) {
    console.error(`${colors.red}❌ Error removing package:${colors.reset}`, error instanceof Error ? error.message : String(error));
    process.exit(1);
}