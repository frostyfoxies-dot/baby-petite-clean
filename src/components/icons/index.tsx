/**
 * Icons - Lucide React exports
 * 
 * This file exports all icons from lucide-react for easy importing.
 * 
 * @example
 * ```tsx
 * import { Search, ShoppingCart, User } from '@/components/icons';
 * ```
 */

// Re-export all icons from lucide-react
export * from 'lucide-react';

// Common icon groups for convenience
export const Icons = {
  // Navigation
  Home: 'Home',
  Menu: 'Menu',
  Search: 'Search',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  ArrowRight: 'ArrowRight',
  ArrowLeft: 'ArrowLeft',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  
  // User & Account
  User: 'User',
  UserCircle: 'UserCircle',
  Settings: 'Settings',
  LogOut: 'LogOut',
  LogIn: 'LogIn',
  Heart: 'Heart',
  Bookmark: 'Bookmark',
  
  // Shopping & Cart
  ShoppingCart: 'ShoppingCart',
  ShoppingBag: 'ShoppingBag',
  Package: 'Package',
  CreditCard: 'CreditCard',
  Truck: 'Truck',
  Tag: 'Tag',
  Percent: 'Percent',
  
  // Actions
  Plus: 'Plus',
  Minus: 'Minus',
  X: 'X',
  Check: 'Check',
  Filter: 'Filter',
  SlidersHorizontal: 'SlidersHorizontal',
  SortAsc: 'SortAsc',
  SortDesc: 'SortDesc',
  RefreshCw: 'RefreshCw',
  Download: 'Download',
  Upload: 'Upload',
  Share: 'Share',
  Copy: 'Copy',
  Link: 'Link',
  ExternalLink: 'ExternalLink',
  
  // Communication
  Mail: 'Mail',
  Phone: 'Phone',
  MessageCircle: 'MessageCircle',
  Send: 'Send',
  Bell: 'Bell',
  
  // Location
  MapPin: 'MapPin',
  Globe: 'Globe',
  Navigation: 'Navigation',
  
  // Media
  Image: 'Image',
  Video: 'Video',
  Camera: 'Camera',
  Mic: 'Mic',
  Play: 'Play',
  Pause: 'Pause',
  Volume2: 'Volume2',
  VolumeX: 'VolumeX',
  
  // Files & Documents
  File: 'File',
  FileText: 'FileText',
  DownloadCloud: 'DownloadCloud',
  UploadCloud: 'UploadCloud',
  Folder: 'Folder',
  FolderOpen: 'FolderOpen',
  
  // Status & Feedback
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
  AlertCircle: 'AlertCircle',
  AlertTriangle: 'AlertTriangle',
  Info: 'Info',
  Loader2: 'Loader2',
  Clock: 'Clock',
  Calendar: 'Calendar',
  Star: 'Star',
  StarHalf: 'StarHalf',
  StarOff: 'StarOff',
  ThumbsUp: 'ThumbsUp',
  ThumbsDown: 'ThumbsDown',
  
  // UI Elements
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  Lock: 'Lock',
  Unlock: 'Unlock',
  Shield: 'Shield',
  Key: 'Key',
  Edit: 'Edit',
  Trash2: 'Trash2',
  MoreHorizontal: 'MoreHorizontal',
  MoreVertical: 'MoreVertical',
  Grid: 'Grid',
  List: 'List',
  Layout: 'Layout',
  Columns: 'Columns',
  Maximize: 'Maximize',
  Minimize: 'Minimize',
  XCircle: 'XCircle',
  PlusCircle: 'PlusCircle',
  MinusCircle: 'MinusCircle',
  
  // Social
  Facebook: 'Facebook',
  Twitter: 'Twitter',
  Instagram: 'Instagram',
  Youtube: 'Youtube',
  Linkedin: 'Linkedin',
  Pinterest: 'Pinterest',
  TikTok: 'TikTok',
  
  // Misc
  Zap: 'Zap',
  Sun: 'Sun',
  Moon: 'Moon',
  Cloud: 'Cloud',
  CloudRain: 'CloudRain',
  CloudSnow: 'CloudSnow',
  Wind: 'Wind',
  Thermometer: 'Thermometer',
  Droplet: 'Droplet',
  Flame: 'Flame',
  Gift: 'Gift',
  Award: 'Award',
  Trophy: 'Trophy',
  Target: 'Target',
  Flag: 'Flag',
  Bookmark: 'Bookmark',
  Heart: 'Heart',
  Smile: 'Smile',
  Frown: 'Frown',
  Meh: 'Meh',
} as const;

export type IconName = typeof Icons[keyof typeof Icons];
