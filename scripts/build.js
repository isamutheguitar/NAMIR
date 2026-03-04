import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '..');

function run(command, cwd) {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { stdio: 'inherit', cwd });
}

try {
    const clientPath = path.join(rootPath, 'client');
    const publicPath = path.join(rootPath, 'public');
    const distPath = path.join(clientPath, 'dist');

    // 1. Install client dependencies
    run('npm install', clientPath);

    // 2. Build client
    run('npm run build', clientPath);

    // 3. Ensure 'public' directory exists
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }

    // 4. Copy 'dist' to 'public'
    console.log(`Copying ${distPath} to ${publicPath}...`);
    // fs.cpSync is available in Node 16.7.0+
    // If we want to copy *contents* of dist, we point to it and it will copy the folder contents.
    // recursive: true copies folders.
    // filter can be used if needed.
    fs.cpSync(distPath, publicPath, { recursive: true });

    console.log('Build and deployment preparation completed successfully.');
} catch (error) {
    console.error('Build process failed:', error);
    process.exit(1);
}
