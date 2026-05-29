const fs = require('fs');
const path = require('path');

const ICON_MAP = {
  'ArrowLeft': 'IconArrowLeft',
  'Minus': 'IconMinus',
  'CheckCircle2': 'IconCircleCheckFilled',
  'AlertTriangle': 'IconAlertTriangle',
  'Pencil': 'IconPencil',
  'LayoutDashboard': 'IconLayoutDashboard',
  'BarChart3': 'IconChartBar',
  'LogOut': 'IconLogout',
  'UserCircle': 'IconUserCircle',
  'ChevronDown': 'IconChevronDown',
  'Download': 'IconDownload',
  'Moon': 'IconMoon',
  'Sun': 'IconSun',
  'Mail': 'IconMail',
  'Lock': 'IconLock',
  'Eye': 'IconEye',
  'EyeOff': 'IconEyeOff',
  'Loader2': 'IconLoader2',
  'User': 'IconUser',
  'Camera': 'IconCamera',
  'Check': 'IconCheck',
  'Shield': 'IconShield',
  'Trash2': 'IconTrash',
  'ChevronRight': 'IconChevronRight',
  'Share': 'IconShare',
  'Plus': 'IconPlus',
  'X': 'IconX',
  'Trophy': 'IconTrophy',
  'Monitor': 'IconDeviceDesktop',
  'RefreshCcw': 'IconRefresh',
  'Settings': 'IconSettings',
  'Search': 'IconSearch',
  'Menu': 'IconMenu2',
  'MoreVertical': 'IconDotsVertical',
  'Users': 'IconUsers',
  'Calendar': 'IconCalendar',
  'Clock': 'IconClock',
  'MapPin': 'IconMapPin',
  'Play': 'IconPlayerPlay',
  'Pause': 'IconPlayerPause',
  'SkipForward': 'IconPlayerSkipForward',
  'Volume2': 'IconVolume',
  'VolumeX': 'IconVolume3',
  'Star': 'IconStar',
  'StarOff': 'IconStarOff',
  'Heart': 'IconHeart',
  'MessageSquare': 'IconMessageCircle',
  'Send': 'IconSend',
  'Link': 'IconLink',
  'ExternalLink': 'IconExternalLink',
  'Copy': 'IconCopy',
  'File': 'IconFile',
  'FileText': 'IconFileText',
  'Image': 'IconPhoto',
  'Video': 'IconVideo',
  'Music': 'IconMusic',
  'Folder': 'IconFolder',
  'Info': 'IconInfoCircle',
  'HelpCircle': 'IconHelpCircle',
  'AlertCircle': 'IconAlertCircle',
  'CheckCircle': 'IconCircleCheck',
  'XCircle': 'IconCircleX',
  'Activity': 'IconActivity',
  'Zap': 'IconBolt',
  'TrendingUp': 'IconTrendingUp',
  'TrendingDown': 'IconTrendingDown',
  'Wifi': 'IconWifi',
  'WifiOff': 'IconWifiOff',
  'Battery': 'IconBattery',
  'BatteryCharging': 'IconBatteryCharging',
  'Bluetooth': 'IconBluetooth',
  'Cast': 'IconCast',
  'Cpu': 'IconCpu',
  'Database': 'IconDatabase',
  'HardDrive': 'IconDeviceFloppy',
  'Server': 'IconServer',
  'Smartphone': 'IconDeviceMobile',
  'Tablet': 'IconDeviceTablet',
  'Tv': 'IconDeviceTv',
  'Watch': 'IconDeviceWatch',
  'Gift': 'IconGift',
  'ShoppingBag': 'IconShoppingBag',
  'ShoppingCart': 'IconShoppingCart',
  'CreditCard': 'IconCreditCard',
  'DollarSign': 'IconCurrencyDollar',
  'Percent': 'IconPercentage',
  'Tag': 'IconTag',
  'Award': 'IconAward',
  'Briefcase': 'IconBriefcase',
  'Coffee': 'IconCoffee',
  'Feather': 'IconFeather',
  'Globe': 'IconGlobe',
  'Key': 'IconKey',
  'Umbrella': 'IconUmbrella',
  'Circle': 'IconCircle',
  'Square': 'IconSquare',
  'Triangle': 'IconTriangle',
  'Hexagon': 'IconHexagon',
  'Cloud': 'IconCloud',
  'CloudRain': 'IconCloudRain',
  'CloudSnow': 'IconCloudSnow',
  'CloudLightning': 'IconCloudStorm',
  'Wind': 'IconWind',
  'Droplet': 'IconDroplet',
  'Thermometer': 'IconThermometer',
  'Compass': 'IconCompass',
  'Map': 'IconMap',
  'Navigation': 'IconNavigation',
  'Target': 'IconTarget',
  'Crosshair': 'IconCrosshair',
  'EyeOff': 'IconEyeOff',
  'Filter': 'IconFilter',
  'Sliders': 'IconAdjustmentsHorizontal',
  'Unlock': 'IconLockOpen',
  'Github': 'IconBrandGithub',
  'Twitter': 'IconBrandTwitter',
  'Facebook': 'IconBrandFacebook',
  'Instagram': 'IconBrandInstagram',
  'Linkedin': 'IconBrandLinkedin',
  'Youtube': 'IconBrandYoutube',
  'Twitch': 'IconBrandTwitch',
  'Dribbble': 'IconBrandDribbble',
  'Figma': 'IconBrandFigma',
  'Framer': 'IconBrandFramer',
  'Slack': 'IconBrandSlack',
  'Trello': 'IconBrandTrello',
  'ChevronUp': 'IconChevronUp',
  'ChevronLeft': 'IconChevronLeft',
  'ChevronsUp': 'IconChevronsUp',
  'ChevronsDown': 'IconChevronsDown',
  'ChevronsLeft': 'IconChevronsLeft',
  'ChevronsRight': 'IconChevronsRight',
  'ArrowUp': 'IconArrowUp',
  'ArrowDown': 'IconArrowDown',
  'ArrowRight': 'IconArrowRight',
  'Upload': 'IconUpload',
  'Maximize': 'IconMaximize',
  'Minimize': 'IconMinimize',
  'ZoomIn': 'IconZoomIn',
  'ZoomOut': 'IconZoomOut',
  'MenuSquare': 'IconApps',
  'Grid': 'IconGridDots',
  'List': 'IconList',
  'AlignLeft': 'IconAlignLeft',
  'AlignCenter': 'IconAlignCenter',
  'AlignRight': 'IconAlignRight',
  'AlignJustify': 'IconAlignJustified',
  'Bold': 'IconBold',
  'Italic': 'IconItalic',
  'Underline': 'IconUnderline',
  'StrikeThrough': 'IconStrikethrough',
  'Type': 'IconTypography',
  'Scissors': 'IconCut',
  'Paste': 'IconClipboard',
  'Printer': 'IconPrinter',
  'Save': 'IconDeviceFloppy',
  'FolderPlus': 'IconFolderPlus',
  'FolderMinus': 'IconFolderMinus',
  'FilePlus': 'IconFilePlus',
  'FileMinus': 'IconFileMinus',
  'FileText': 'IconFileText',
  'QrCode': 'IconQrcode',
  'ShieldCheck': 'IconShieldCheck',
  'UsersRound': 'IconUsers',
  'History': 'IconHistory',
  'Medal': 'IconMedal'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it uses lucide-react
    if (content.includes('lucide-react')) {
      console.log(`Processing: ${filePath}`);
      
      // Match the import statement
      let oldToNew = {};
      const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"];?/g;
      
      content = content.replace(importRegex, (match, importsStr) => {
        // Extract icon names
        const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
        
        const newImports = [];
        
        imports.forEach(imp => {
          let oldName = imp;
          let alias = null;
          
          if (imp.includes(' as ')) {
            [oldName, alias] = imp.split(' as ').map(s => s.trim());
          }
          
          let newName = ICON_MAP[oldName];
          if (!newName) {
            console.warn(`WARNING: Mapping not found for ${oldName} in ${filePath}, defaulting to Icon${oldName}`);
            newName = `Icon${oldName}`;
          }
          
          oldToNew[alias || oldName] = newName;
          
          if (alias) {
            newImports.push(`${newName} as ${alias}`);
          } else {
            newImports.push(newName);
          }
        });
        
        // Return the new import statement
        return `import { ${newImports.join(', ')} } from "@tabler/icons-react";`;
      });
      
      // Replace the usages in the file
      Object.keys(oldToNew).forEach(oldIcon => {
        const newIcon = oldToNew[oldIcon];
        // Replace exact word matches that are not part of another word
        // e.g. <User, </User>, icon={User}, etc.
        const wordRegex = new RegExp(`\\b${oldIcon}\\b`, 'g');
        content = content.replace(wordRegex, newIcon);
      });
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log("Migration script finished.");
