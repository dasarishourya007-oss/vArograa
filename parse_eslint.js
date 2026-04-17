const fs = require('fs');
const data = JSON.parse(fs.readFileSync('format_eslint_src.json', 'utf8'));
let totalErrors = 0;
data.forEach(file => {
    if (file.errorCount > 0 || file.warningCount > 0) {
        const relPath = file.filePath.split('healthlink\\\\')[1] || file.filePath.split('healthlink/')[1] || file.filePath;
        console.log(`\n--- ${relPath} ---`);
        file.messages.forEach(msg => {
            console.log(`Line ${msg.line}: [${msg.severity === 2 ? 'Error' : 'Warning'}] ${msg.message} (${msg.ruleId})`);
        });
        totalErrors += file.errorCount;
    }
});
console.log(`\nTotal Errors: ${totalErrors}`);
