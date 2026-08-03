const fs = require('fs');

const path = 'app/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const servStart = lines.findIndex(l => l.includes('<section id="servicios"'));
const servEnd = lines.findIndex((l, i) => i > servStart && l.includes('</section>'));

const habStart = lines.findIndex((l, i) => i > servEnd && l.includes('<section id="habitaciones"'));
const habEnd = lines.findIndex((l, i) => i > habStart && l.includes('</section>'));

if (servStart !== -1 && servEnd !== -1 && habStart !== -1 && habEnd !== -1) {
    const servicios = lines.slice(servStart, servEnd + 1);
    const inBetween = lines.slice(servEnd + 1, habStart); // empty lines or comments
    const habitaciones = lines.slice(habStart, habEnd + 1);
    
    const before = lines.slice(0, servStart);
    const after = lines.slice(habEnd + 1);
    
    // Assemble new order: before -> habitaciones -> inBetween -> servicios -> after
    const newLines = [...before, ...habitaciones, ...inBetween, ...servicios, ...after];
    
    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log('Swapped successfully!');
} else {
    console.log('Error finding sections');
}
