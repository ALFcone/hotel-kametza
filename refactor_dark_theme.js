const fs = require('fs');

const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Global Backgrounds
content = content.replace(/bg-\[\#FDFBF7\]/g, 'bg-stone-950');
content = content.replace(/bg-white\/90/g, 'bg-stone-950\/90');
content = content.replace(/bg-white\/95/g, 'bg-stone-900\/95');
content = content.replace(/bg-white\/80/g, 'bg-stone-900\/80');
content = content.replace(/bg-white\b/g, 'bg-stone-900');

// General text colors
content = content.replace(/text-stone-800/g, 'text-stone-300');
content = content.replace(/text-stone-900/g, 'text-stone-50');
content = content.replace(/text-stone-700/g, 'text-stone-200');
content = content.replace(/text-stone-600/g, 'text-stone-400');
content = content.replace(/text-rose-950/g, 'text-stone-50');
content = content.replace(/text-rose-900/g, 'text-stone-200');

// Component Backgrounds
content = content.replace(/bg-stone-50\b/g, 'bg-stone-800');
content = content.replace(/bg-rose-50\/80/g, 'bg-stone-800\/80');
content = content.replace(/bg-rose-50\/50/g, 'bg-stone-800\/50');
content = content.replace(/bg-rose-50\b/g, 'bg-stone-800');

// Component Borders
content = content.replace(/border-stone-100\/50/g, 'border-stone-800\/50');
content = content.replace(/border-stone-100\b/g, 'border-stone-800');
content = content.replace(/border-stone-200\b/g, 'border-stone-700');
content = content.replace(/border-rose-100\/50/g, 'border-stone-700\/50');
content = content.replace(/border-rose-200\b/g, 'border-stone-700');
content = content.replace(/border-rose-500\b/g, 'border-amber-500');
content = content.replace(/border-\[\#e3004f\]/g, 'border-amber-500');

// Specific Red replacements
content = content.replace(/text-\[\#e3004f\]/g, 'text-amber-500');
content = content.replace(/bg-\[\#e3004f\]/g, 'bg-amber-600');
content = content.replace(/hover:text-\[\#e3004f\]/g, 'hover:text-amber-400');
content = content.replace(/hover:bg-\[\#e3004f\]/g, 'hover:bg-amber-500');
content = content.replace(/hover:border-\[\#e3004f\]\/30/g, 'hover:border-amber-500\/30');

// Hover states and specific shades
content = content.replace(/hover:bg-rose-100\/50/g, 'hover:bg-stone-700\/50');
content = content.replace(/hover:bg-rose-50/g, 'hover:bg-stone-800');
content = content.replace(/hover:text-rose-600/g, 'hover:text-amber-500');
content = content.replace(/hover:text-rose-700/g, 'hover:text-amber-400');
content = content.replace(/hover:shadow-rose-900\/20/g, 'hover:shadow-amber-900\/20');
content = content.replace(/hover:shadow-rose-900\/40/g, 'hover:shadow-amber-900\/40');
content = content.replace(/shadow-\[0_20px_40px_rgba\(112,8,36,0\.15\)\]/g, 'shadow-[0_20px_40px_rgba(0,0,0,0.5)]');

// Selection highlights
content = content.replace(/selection:bg-rose-200/g, 'selection:bg-amber-900\/50');
content = content.replace(/selection:text-rose-900/g, 'selection:text-amber-100');

// Loading screen text 
// Because the loading screen had text-[#e3004f] replaced with text-amber-500 above, it should be fine.

// Modals and form elements text which might have been flipped wrongly: 
// The input fields had bg-stone-50 which is now bg-stone-800. The text should probably be stone-200.
// placeholder:text-stone-400 is fine.
content = content.replace(/bg-stone-800 rounded-xl text-stone-300 border border-stone-700/g, 'bg-stone-900 rounded-xl text-stone-200 border border-stone-800');

fs.writeFileSync(path, content);
console.log('Main page transformed to dark theme successfully.');
