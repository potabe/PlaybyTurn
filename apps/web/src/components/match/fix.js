const fs = require('fs');
let content = fs.readFileSync('temp3.txt', 'utf8');

// Find the second instance of handleSubtractPoint("team2")
let index = content.indexOf('handleSubtractPoint("team2")');
if (index !== -1) {
  index = content.indexOf('handleSubtractPoint("team2")', index + 1);
  if (index !== -1) {
    content = content.substring(0, index) + 'handleSubtractPoint("team1")' + content.substring(index + 'handleSubtractPoint("team2")'.length);
  }
}

fs.writeFileSync('ScoreTrackerClient.tsx', content, 'utf8');
