const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /'Clientes Chiquinho'/g, to: "'chiquinho_sorvetes_clientes'" },
    { from: /'Conteúdos Chiquinho Sorvetes'/g, to: "'chiquinho_sorvetes_conteudos'" },
    { from: /'Controle de Postagens - Clientes Chiquinho'/g, to: "'chiquinho_sorvetes_controle_postagens'" },
    
    // Also handle double quotes if any in the SQL files (though API uses single quotes for supabase.from)
    { from: /"Clientes Chiquinho"/g, to: '"chiquinho_sorvetes_clientes"' },
    { from: /"Conteúdos Chiquinho Sorvetes"/g, to: '"chiquinho_sorvetes_conteudos"' },
    { from: /"Controle de Postagens - Clientes Chiquinho"/g, to: '"chiquinho_sorvetes_controle_postagens"' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.sql')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const { from, to } of replacements) {
                content = content.replace(from, to);
            }
            
            if (content !== originalContent) {
                console.log(`Updated ${fullPath}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDirectory('.');
