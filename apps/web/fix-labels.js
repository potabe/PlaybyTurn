const fs = require('fs');
let content = fs.readFileSync('src/lib/utils/format.ts', 'utf8');

content = content.replace(/export const SPORT_LABELS: Record<SportType, string> = \{[\s\S]*?\};/, `export const SPORT_LABELS: Record<SportType, string> = {
  PADEL: "Padel",
  BADMINTON: "Badminton",
  TENNIS: "Tennis",
  TABLE_TENNIS: "Table Tennis",
};`);

fs.writeFileSync('src/lib/utils/format.ts', content, 'utf8');
