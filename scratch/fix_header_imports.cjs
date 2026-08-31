const fs = require('fs');
let file = fs.readFileSync('src/components/PublicHeader.tsx', 'utf8');

file = file.replace(
  'import { Play } from "lucide-react";',
  'import { Play, Search, X, Bell, Crown, ChevronDown, User, Check } from "lucide-react";'
);

// We need getImageUrl and useGetPublicNotifications and useSearch from api-client maybe?
// Wait, useSearch is probably a hook from wouter or something?
// Let's check wouter imports
file = file.replace(
  'import { Link, useLocation } from "wouter";',
  'import { Link, useLocation, useSearch } from "wouter";'
);

// Let's check if getImageUrl is imported
if (!file.includes('getImageUrl')) {
  file = file.replace(
    'import { useTheme } from "next-themes";',
    'import { useTheme } from "next-themes";\nimport { getImageUrl, useGetPublicNotifications } from "@/lib/api-client";'
  );
}

// Ensure useRef is imported
file = file.replace(
  'import { useState, useEffect } from "react";',
  'import { useState, useEffect, useRef } from "react";'
);

fs.writeFileSync('src/components/PublicHeader.tsx', file);
