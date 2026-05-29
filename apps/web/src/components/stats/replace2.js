const fs = require('fs');
let content = fs.readFileSync('StatsClient.tsx', 'utf8');

// Replace all 6 pills one by one
content = content.replace(/<StatPill icon="[^"]+" label="Sessions" value=\{player.sessionsCount\} color="bg-primary\/5" \/>/, `<StatPill icon={<IconTrophy className="w-4 h-4 text-amber-500" />} label="Sessions" value={player.sessionsCount} color="bg-primary/5 dark:bg-primary/10" />`);

content = content.replace(/<StatPill icon="[^"]+" label="Matches" value=\{player.matchesPlayed\} \/>/, `<StatPill icon={<IconTarget className="w-4 h-4 text-rose-500" />} label="Matches" value={player.matchesPlayed} />`);

content = content.replace(/<StatPill icon="[^"]+" label="Wins" value=\{player.matchesWon\} color="bg-emerald-50 dark:bg-emerald-900\/20" \/>/, `<StatPill icon={<IconCheckbox className="w-4 h-4 text-emerald-500" />} label="Wins" value={player.matchesWon} color="bg-emerald-50 dark:bg-emerald-900/20" />`);

content = content.replace(/<StatPill icon="[^"]+" label="Win Rate" value=\{\`\$\{player.winRate\}%\`\} color=\{[\s\S]*?\} \/>/, `<StatPill icon={<IconChartLine className="w-4 h-4 text-indigo-500" />} label="Win Rate" value={\`\${player.winRate}%\`} color={
            player.winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
          } />`);

content = content.replace(/<StatPill icon="[^"]+" label="Points" value=\{player.pointsWon\} \/>/, `<StatPill icon={<IconBolt className="w-4 h-4 text-amber-400" />} label="Points" value={player.pointsWon} />`);

content = content.replace(/<StatPill icon="[^"]+" label="Diff" value=\{[\s\S]*?\} color=\{player.pointDifferential >= 0 \? "bg-emerald-50 dark:bg-emerald-900\/20" : "bg-rose-50 dark:bg-rose-900\/20"\} \/>/, `<StatPill icon={<span className="font-sans font-bold text-base text-foreground/80">±</span>} label="Diff" value={
            player.pointDifferential >= 0
              ? \`+\${player.pointDifferential}\`
              : player.pointDifferential
          } color={player.pointDifferential >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"} />`);

fs.writeFileSync('StatsClient.tsx', content, 'utf8');
