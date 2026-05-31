const fs = require('fs');
let content = fs.readFileSync('src/lib/utils/format.ts', 'utf8');

content = content.replace(/PADEL: "[^"]+",/g, 'PADEL: "🎾",');
content = content.replace(/BADMINTON: "[^"]+",/g, 'BADMINTON: "🏸",');
content = content.replace(/TENNIS: "[^"]+",/g, 'TENNIS: "🎾",');
content = content.replace(/TABLE_TENNIS: "[^"]+",/g, 'TABLE_TENNIS: "🏓",');

content = content.replace(/\?"/g, '-');

fs.writeFileSync('src/lib/utils/format.ts', content, 'utf8');
