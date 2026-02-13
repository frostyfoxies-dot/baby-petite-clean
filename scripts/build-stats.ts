/**
 * Build Statistics Script
 * 
 * Analyzes bundle size and generates build reports.
 * Run with: pnpm build:stats
 * 
 * @example
 * pnpm build:stats
 * pnpm build:stats --output json
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

interface BuildStats {
  timestamp: string;
  buildTime: number;
  totalSize: number;
  gzipSize: number;
  chunks: ChunkInfo[];
  warnings: string[];
  errors: string[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzipSize: number;
  modules: string[];
}

interface PackageInfo {
  name: string;
  version: string;
  size: number;
}

// Configuration
const BUILD_DIR = '.next';
const OUTPUT_DIR = 'reports';
const SIZE_LIMIT_MB = 500; // Warn if total build exceeds this

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getBuildTime(): number {
  try {
    const buildStartTime = Date.now();
    console.log('🏗️  Running production build...');
    
    execSync('pnpm build', {
      stdio: 'inherit',
      env: {
        ...process.env,
        ANALYZE: 'true',
      },
    });
    
    return Date.now() - buildStartTime;
  } catch (error) {
    console.error('Build failed:', error);
    throw error;
  }
}

function analyzeChunks(): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const buildManifestPath = join(BUILD_DIR, 'build-manifest.json');
  
  if (!existsSync(buildManifestPath)) {
    console.warn('Build manifest not found. Run build first.');
    return chunks;
  }
  
  try {
    const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));
    
    // Analyze pages
    for (const [page, files] of Object.entries(manifest.pages || {})) {
      const chunk: ChunkInfo = {
        name: page,
        size: 0,
        gzipSize: 0,
        modules: Array.isArray(files) ? files : [],
      };
      chunks.push(chunk);
    }
  } catch (error) {
    console.warn('Error parsing build manifest:', error);
  }
  
  return chunks;
}

function getPackageSizes(): PackageInfo[] {
  const packages: PackageInfo[] = [];
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const dependencies = packageJson.dependencies || {};
    
    for (const [name, version] of Object.entries(dependencies)) {
      packages.push({
        name,
        version: version as string,
        size: 0, // Would need to calculate actual size
      });
    }
  } catch (error) {
    console.warn('Error reading package.json:', error);
  }
  
  return packages;
}

function calculateTotalSize(): { total: number; gzip: number } {
  let total = 0;
  let gzip = 0;
  
  try {
    // Check if build directory exists
    if (!existsSync(BUILD_DIR)) {
      return { total: 0, gzip: 0 };
    }
    
    // Get static chunks
    const staticDir = join(BUILD_DIR, 'static');
    if (existsSync(staticDir)) {
      const result = execSync(
        `find ${staticDir} -type f -name "*.js" -exec du -b {} + 2>/dev/null | awk '{sum+=$1} END {print sum}'`,
        { encoding: 'utf-8' }
      ).trim();
      
      total = parseInt(result) || 0;
    }
  } catch (error) {
    console.warn('Error calculating size:', error);
  }
  
  // Estimate gzip size (typically ~30% of original)
  gzip = Math.floor(total * 0.3);
  
  return { total, gzip };
}

function checkSizeLimits(stats: BuildStats): void {
  const totalMB = stats.totalSize / (1024 * 1024);
  
  if (totalMB > SIZE_LIMIT_MB) {
    console.warn(`⚠️  Warning: Build size (${totalMB.toFixed(2)} MB) exceeds limit of ${SIZE_LIMIT_MB} MB`);
  }
  
  // Check for large chunks
  for (const chunk of stats.chunks) {
    const chunkMB = chunk.size / (1024 * 1024);
    if (chunkMB > 1) {
      console.warn(`⚠️  Large chunk detected: ${chunk.name} (${chunkMB.toFixed(2)} MB)`);
    }
  }
}

function generateReport(stats: BuildStats, format: 'text' | 'json' | 'markdown'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(stats, null, 2);
      
    case 'markdown':
      return `# Build Statistics Report

Generated: ${stats.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Build Time | ${(stats.buildTime / 1000).toFixed(2)}s |
| Total Size | ${formatBytes(stats.totalSize)} |
| Gzip Size | ${formatBytes(stats.gzipSize)} |

## Chunks

| Name | Size | Gzip |
|------|------|------|
${stats.chunks.map(c => `| ${c.name} | ${formatBytes(c.size)} | ${formatBytes(c.gzipSize)} |`).join('\n')}

## Warnings

${stats.warnings.length > 0 ? stats.warnings.map(w => `- ${w}`).join('\n') : 'No warnings'}

## Errors

${stats.errors.length > 0 ? stats.errors.map(e => `- ${e}`).join('\n') : 'No errors'}
`;
      
    default:
      return `
╔════════════════════════════════════════════════════════════╗
║                    BUILD STATISTICS                         ║
╠════════════════════════════════════════════════════════════╣
║  Timestamp:    ${stats.timestamp.padEnd(40)}║
║  Build Time:   ${(stats.buildTime / 1000).toFixed(2) + 's'.padEnd(40)}║
║  Total Size:   ${formatBytes(stats.totalSize).padEnd(40)}║
║  Gzip Size:    ${formatBytes(stats.gzipSize).padEnd(40)}║
╠════════════════════════════════════════════════════════════╣
║                      CHUNKS                                 ║
╠════════════════════════════════════════════════════════════╣
${stats.chunks.map(c => `║  ${c.name.padEnd(20)} ${formatBytes(c.size).padEnd(20)} ${formatBytes(c.gzipSize).padEnd(15)}║`).join('\n')}
╠════════════════════════════════════════════════════════════╣
║                    WARNINGS: ${String(stats.warnings.length).padEnd(28)}║
╚════════════════════════════════════════════════════════════╝
`;
  }
}

function saveReport(report: string, format: string): void {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt';
  const filename = `build-stats-${Date.now()}.${extension}`;
  const filepath = join(OUTPUT_DIR, filename);
  
  writeFileSync(filepath, report);
  console.log(`\n📄 Report saved to: ${filepath}`);
}

function analyzeBundleComposition(): void {
  console.log('\n📊 Bundle Composition Analysis:\n');
  
  try {
    // Check for duplicate dependencies
    const lockFile = existsSync('pnpm-lock.yaml') 
      ? readFileSync('pnpm-lock.yaml', 'utf-8')
      : '';
    
    if (lockFile) {
      console.log('✅ Using pnpm for efficient dependency management');
    }
    
    // Analyze package.json for large dependencies
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = Object.keys(packageJson.dependencies || {});
    
    console.log(`📦 Total dependencies: ${deps.length}`);
    
    // Known large packages
    const largePackages = ['@mui/material', 'antd', 'lodash', 'moment', 'rxjs'];
    const foundLarge = deps.filter(d => largePackages.includes(d));
    
    if (foundLarge.length > 0) {
      console.log(`⚠️  Potentially large packages found: ${foundLarge.join(', ')}`);
    }
    
    // Check for tree-shakeable alternatives
    if (deps.includes('lodash')) {
      console.log('💡 Tip: Consider using lodash-es for better tree-shaking');
    }
    
    if (deps.includes('moment')) {
      console.log('💡 Tip: Consider using date-fns or dayjs for smaller bundle');
    }
  } catch (error) {
    console.warn('Error analyzing bundle composition:', error);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' 
    : args.includes('--markdown') ? 'markdown' 
    : 'text';
  const skipBuild = args.includes('--skip-build');
  
  console.log('📈 Build Statistics Generator\n');
  
  try {
    // Run build or use existing
    const buildTime = skipBuild ? 0 : getBuildTime();
    
    // Analyze
    const sizes = calculateTotalSize();
    const chunks = analyzeChunks();
    const packages = getPackageSizes();
    
    // Build stats object
    const stats: BuildStats = {
      timestamp: new Date().toISOString(),
      buildTime,
      totalSize: sizes.total,
      gzipSize: sizes.gzip,
      chunks,
      warnings: [],
      errors: [],
    };
    
    // Check limits
    checkSizeLimits(stats);
    
    // Analyze composition
    analyzeBundleComposition();
    
    // Generate and output report
    const report = generateReport(stats, format);
    console.log(report);
    
    // Save report
    saveReport(report, format);
    
    // Exit with error if build size is too large
    const totalMB = stats.totalSize / (1024 * 1024);
    if (totalMB > SIZE_LIMIT_MB) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating build stats:', error);
    process.exit(1);
  }
}

main();
