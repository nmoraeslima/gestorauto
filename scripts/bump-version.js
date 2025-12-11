import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FILES = {
    package: path.resolve(__dirname, '../package.json'),
    versionJson: path.resolve(__dirname, '../public/version.json'),
    versionTs: path.resolve(__dirname, '../src/utils/version.ts'),
    sw: path.resolve(__dirname, '../src/sw.js'),
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function bumpVersion(currentVersion, type = 'patch') {
    const parts = currentVersion.split('.').map(Number);
    if (type === 'major') {
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
    } else if (type === 'minor') {
        parts[1]++;
        parts[2] = 0;
    } else {
        parts[2]++;
    }
    return parts.join('.');
}

function updateFile(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (!regex.test(content)) {
        console.warn(`⚠️ Pattern not found in ${path.basename(filePath)}`);
        return;
    }
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${path.basename(filePath)}`);
}

async function collectReleaseNotes() {
    console.log('\n📝 Vamos criar as notas de release!\n');

    const title = await question('Título da versão (ex: "Melhorias de Performance"): ');
    const description = await question('Descrição breve: ');

    const notes = [];
    let addMore = true;

    console.log('\n📋 Adicione as mudanças (deixe em branco para finalizar):\n');
    console.log('Tipos disponíveis: feat (novo recurso), fix (correção), ui (visual), sec (segurança)\n');

    while (addMore) {
        const type = await question('Tipo (feat/fix/ui/sec) ou Enter para finalizar: ');
        if (!type) {
            addMore = false;
            break;
        }

        const text = await question('Descrição da mudança: ');
        if (text) {
            notes.push({ type, text });
        }
    }

    return { title, description, notes };
}

async function main() {
    const type = process.argv[2] || 'patch';
    const auto = process.argv.includes('--auto');

    // 1. Read package.json
    const packageJson = JSON.parse(fs.readFileSync(FILES.package, 'utf8'));
    const oldVersion = packageJson.version;
    const newVersion = bumpVersion(oldVersion, type);
    const today = new Date().toISOString().split('T')[0];

    console.log(`🚀 Bumping version: ${oldVersion} -> ${newVersion}`);

    // 2. Collect release notes (if not auto mode)
    let releaseInfo;
    if (auto) {
        releaseInfo = {
            title: 'Atualização Automática',
            description: 'Versão atualizada automaticamente',
            notes: []
        };
    } else {
        releaseInfo = await collectReleaseNotes();
    }

    // 3. Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(FILES.package, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json`);

    // 4. Update public/version.json with releases
    const versionData = JSON.parse(fs.readFileSync(FILES.versionJson, 'utf8'));

    const newRelease = {
        version: newVersion,
        date: today,
        title: releaseInfo.title,
        description: releaseInfo.description,
        type: type,
        notes: releaseInfo.notes
    };

    // Add new release to the beginning of the array
    if (!versionData.releases) {
        versionData.releases = [];
    }
    versionData.releases.unshift(newRelease);

    // Update top-level version info
    versionData.version = newVersion;
    versionData.releaseDate = today;

    fs.writeFileSync(FILES.versionJson, JSON.stringify(versionData, null, 2) + '\n');
    console.log(`✅ Updated version.json`);

    // 5. Update src/utils/version.ts
    updateFile(
        FILES.versionTs,
        /export const APP_VERSION = '.*';/,
        `export const APP_VERSION = '${newVersion}';`
    );

    // 6. Update src/sw.js
    updateFile(
        FILES.sw,
        /const CACHE_VERSION = '.*';/,
        `const CACHE_VERSION = 'v${newVersion}';`
    );

    console.log(`\n🎉 Version bumped to ${newVersion} successfully!`);
    console.log(`📋 Release notes added to version.json`);

    rl.close();
}

main();
