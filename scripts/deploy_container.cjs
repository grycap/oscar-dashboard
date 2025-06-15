const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'env.ts');

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/"deploy_container"\s*:\s*".*?"/, '"deploy_container" : "true"');

fs.writeFileSync(filePath, content);

console.log('✅ Updated env.ts.');