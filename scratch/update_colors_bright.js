const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('app');
let count = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    // Convert previous dark colors to the new bright pink-red
    const r1 = /#88193c/gi;
    if (r1.test(content)) {
        content = content.replace(r1, '#e3004f');
        changed = true;
    }
    
    const r2 = /#3e0a15/gi;
    if (r2.test(content)) {
        content = content.replace(r2, '#8a0030');
        changed = true;
    }
    
    const r3 = /#26050b/gi;
    if (r3.test(content)) {
        content = content.replace(r3, '#4a001a');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Updated', f);
        count++;
    }
});
console.log('Total files updated:', count);
