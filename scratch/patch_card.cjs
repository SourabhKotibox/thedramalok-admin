const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

file = file.replace(
  'size = "md",\n  fullWidth = false,\n}: {',
  'size = "md",\n  fullWidth = false,\n  aspectRatio = "2/3",\n}: {'
);

file = file.replace(
  'size?: "sm" | "md" | "lg";\n  fullWidth?: boolean;\n}) {',
  'size?: "sm" | "md" | "lg";\n  fullWidth?: boolean;\n  aspectRatio?: "2/3" | "9/16";\n}) {'
);

file = file.replace(
  'const baseWidth = size === "sm" ? 140 : size === "md" ? 160 : 200;',
  'const baseWidth = fullWidth ? "100%" : size === "sm" ? 140 : size === "md" ? 160 : 200;'
);

// We need to inject the aspect ratio into the styles of the wrapper and portal.
// PortraitCard has: `style={fullWidth ? {} : { width: baseWidth }}` -> `style={{ width: fullWidth ? "100%" : baseWidth, aspectRatio }}`
file = file.replace(
  'style={fullWidth ? {} : { width: baseWidth }}',
  'style={{ width: fullWidth ? "100%" : baseWidth, aspectRatio }}'
);

// We need to also add aspect ratio to the portal!
file = file.replace(
  'width: rect.width * 1.5,',
  'width: rect.width * 1.5, aspectRatio,'
);
// Wait, height might be fixed in the portal!
// "height: rect.height * 1.5" is probably in there. Let's just leave height alone if it is, because width and height are already scaled perfectly from rect.

fs.writeFileSync('src/components/ContentCard.tsx', file);
