const fs = require('fs');
const path = require('path');

const dir = 'c:/wamp64/www/wed-dt/frontend/src/pages/admin';

const replacements = [
    // Handle combined className and style on same element FIRST
    { regex: /className=(["'])([^"']*)["']\s+style=\{\{\s*color:\s*['"]#A67B5B['"]\s*\}\}/g, replace: 'className=$1$2 text-[#A67B5B]$1' },
    { regex: /className=(["'])([^"']*)["']\s+style=\{\{\s*color:\s*['"]#4A3F35['"]\s*\}\}/g, replace: 'className=$1$2 text-[#4A3F35]$1' },
    { regex: /className=(["'])([^"']*)["']\s+style=\{\{\s*color:\s*['"]#6B5D52['"]\s*\}\}/g, replace: 'className=$1$2 text-[#6B5D52]$1' },
    { regex: /className=(["'])([^"']*)["']\s+style=\{\{\s*color:\s*['"]#8B7B6B['"]\s*\}\}/g, replace: 'className=$1$2 text-[#8B7B6B]$1' },

    // Special case for AdminDashboard fonts combined with color
    { regex: /className=(["'])([^"']*)["']\s+style=\{\{\s*color:\s*['"]#4A3F35['"],\s*fontFamily:\s*['"]'Cormorant Garamond', serif['"]\s*\}\}/g, replace: 'className=$1$2 text-[#4A3F35] font-serif$1' },
    { regex: /style=\{\{\s*color:\s*['"]#4A3F35['"],\s*fontFamily:\s*['"]'Cormorant Garamond', serif['"]\s*\}\}/g, replace: 'className="text-[#4A3F35] font-serif"' },

    // Single cases
    { regex: /style=\{\{\s*color:\s*['"]#A67B5B['"]\s*\}\}/g, replace: 'className="text-[#A67B5B]"' },
    { regex: /style=\{\{\s*color:\s*['"]#4A3F35['"]\s*\}\}/g, replace: 'className="text-[#4A3F35]"' },
    { regex: /style=\{\{\s*color:\s*['"]#6B5D52['"]\s*\}\}/g, replace: 'className="text-[#6B5D52]"' },
    { regex: /style=\{\{\s*color:\s*['"]#8B7B6B['"]\s*\}\}/g, replace: 'className="text-[#8B7B6B]"' },
];

function walk(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let initialContent = content;

            replacements.forEach(({ regex, replace }) => {
                content = content.replace(regex, replace);
            });

            if (content !== initialContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

walk(dir);
