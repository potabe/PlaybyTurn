const fs = require('fs');
let content = fs.readFileSync('StatsClient.tsx', 'utf8');

// 1. Update imports
content = content.replace(
  'import { IconSearch, IconTrophy, IconActivity, IconTrendingUp, IconUsers, IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";',
  'import { IconSearch, IconTrophy, IconActivity, IconTrendingUp, IconUsers, IconChevronDown, IconChevronUp, IconX, IconTarget, IconCheckbox, IconChartLine, IconBolt } from "@tabler/icons-react";'
);

// 2. Update StatPill signature
content = content.replace(
  /function StatPill\(\{[\s\S]*?icon: string;[\s\S]*?\}\) \{[\s\S]*?return \([\s\S]*?<div className=\{`rounded-xl \$\{color\} px-3 py-2 text-center`\}>[\s\S]*?<p className="text-base font-black">\{icon\} \{value\}<\/p>[\s\S]*?<p className="text-xs text-muted-foreground mt-0.5">\{label\}<\/p>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/m,
  `function StatPill({
  icon,
  label,
  value,
  color = "bg-muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className={\`rounded-xl \${color} px-3 py-2 text-center\`}>
      <div className="text-base font-black flex items-center justify-center gap-1.5">{icon} <span>{value}</span></div>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}`
);

// 3. Replace the 6 StatPill usages
const originalPills = `<StatPill icon="🏆" label="Sessions" value={player.sessionsCount} color="bg-primary/5" />
          <StatPill icon="🎯" label="Matches" value={player.matchesPlayed} />
          <StatPill icon="✅" label="Wins" value={player.matchesWon} color="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatPill icon="📈" label="Win Rate" value={\`\${player.winRate}%\`} color={
            player.winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
          } />
          <StatPill icon="⚡" label="Points" value={player.pointsWon} />
          <StatPill icon="±" label="Diff" value={
            player.pointDifferential >= 0
              ? \`+\${player.pointDifferential}\`
              : player.pointDifferential
          } color={player.pointDifferential >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"} />`;

const newPills = `<StatPill icon={<IconTrophy className="w-4 h-4 text-amber-500" />} label="Sessions" value={player.sessionsCount} color="bg-primary/5" />
          <StatPill icon={<IconTarget className="w-4 h-4 text-rose-500" />} label="Matches" value={player.matchesPlayed} />
          <StatPill icon={<IconCheckbox className="w-4 h-4 text-emerald-500" />} label="Wins" value={player.matchesWon} color="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatPill icon={<IconChartLine className="w-4 h-4 text-indigo-500" />} label="Win Rate" value={\`\${player.winRate}%\`} color={
            player.winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
          } />
          <StatPill icon={<IconBolt className="w-4 h-4 text-amber-400" />} label="Points" value={player.pointsWon} />
          <StatPill icon={<span className="font-sans font-bold text-base text-foreground/80">±</span>} label="Diff" value={
            player.pointDifferential >= 0
              ? \`+\${player.pointDifferential}\`
              : player.pointDifferential
          } color={player.pointDifferential >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"} />`;

content = content.replace(originalPills, newPills);

fs.writeFileSync('StatsClient.tsx', content, 'utf8');
