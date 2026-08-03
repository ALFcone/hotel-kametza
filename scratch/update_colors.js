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
    
    const r1 = /#700824/gi;
    if (r1.test(content)) {
        content = content.replace(r1, '#88193c');
        changed = true;
    }
    
    const r2 = /#3B020F/gi;
    if (r2.test(content)) {
        content = content.replace(r2, '#3e0a15');
        changed = true;
    }
    
    const r3 = /#2C010A/gi;
    if (r3.test(content)) {
        content = content.replace(r3, '#26050b');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Updated', f);
        count++;
    }
});
console.log('Total files updated:', count);
