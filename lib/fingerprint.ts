/**
 for this only works cross tabs within a browser ill study 
 about it and try ti implement something that works across 
 browsers without going the jwt auth or other routes to make 
 it seamless and not require an account
* */

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes GPU renderer strings across Chrome, Edge, Firefox, Brave, etc.
 * Example inputs:
 *  - Chrome: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"
 *  - Firefox: "Direct3D11 vs_5_0 ps_5_0 - NVIDIA GeForce RTX 3060"
 *  - Output: "nvidia geforce rtx 3060"
 */
export function normalizeGpu(renderer: string): string {
  if (!renderer || renderer === 'unknown' || renderer === 'none' || renderer === 'error') {
    return 'generic-gpu';
  }

  let s = renderer.toLowerCase();

  // Strip ANGLE wrapper syntax
  s = s.replace(/angle\s*\(/g, ' ');
  // Strip graphics driver / API keywords
  s = s.replace(/direct3d\d*/g, ' ');
  s = s.replace(/vs_\d+_\d+/g, ' ');
  s = s.replace(/ps_\d+_\d+/g, ' ');
  s = s.replace(/d3d\d*/g, ' ');
  s = s.replace(/opengl[\s\d.]*/g, ' ');
  s = s.replace(/vulkan[\s\d.]*/g, ' ');
  s = s.replace(/metal[\s\d.]*/g, ' ');
  s = s.replace(/webgl/g, ' ');
  // Strip corporate / wrapper terms
  s = s.replace(/google\s+inc\.?/g, ' ');
  s = s.replace(/corporation/g, ' ');
  s = s.replace(/corp\.?/g, ' ');
  s = s.replace(/inc\.?/g, ' ');
  s = s.replace(/company/g, ' ');
  // Strip PCI / device IDs like (0x00002860) or hex codes
  s = s.replace(/\(0x[0-9a-f]+\)/gi, ' ');
  s = s.replace(/0x[0-9a-f]+/gi, ' ');
  // Strip punctuation and brackets
  s = s.replace(/[\(\)\[\],;_\-–]/g, ' ');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Deduplicate consecutive or repeated words (e.g. "nvidia nvidia geforce" -> "nvidia geforce")
  const words = s.split(' ');
  const uniqueWords: string[] = [];
  for (const w of words) {
    if (w && !uniqueWords.includes(w)) {
      uniqueWords.push(w);
    }
  }

  return uniqueWords.join(' ') || 'generic-gpu';
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'none';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return gl.getParameter(gl.RENDERER) || 'unknown';
    }

    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
  } catch {
    return 'error';
  }
}

function getNormalizedOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  if (platform.includes('win') || ua.includes('windows')) return 'windows';
  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) return 'macos';
  if (platform.includes('linux') || ua.includes('linux')) return 'linux';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  return 'other';
}

export interface HardwareProfile {
  gpu: string;
  screen: string;
  cores: number;
  timezone: string;
  os: string;
}

export async function getDeviceFingerprint(): Promise<{
  deviceId: string;
  hardwareSummary: HardwareProfile;
}> {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server-side',
      hardwareSummary: { gpu: '', screen: '', cores: 0, timezone: '', os: '' }
    };
  }

  // 1. GPU (normalized across Chrome, Firefox, Edge, Brave, etc.)
  const rawRenderer = getWebGLRenderer();
  const cleanGpu = normalizeGpu(rawRenderer);

  // 2. Screen Dimensions (OS resolution — identical across all browsers)
  const screenResolution = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth || 24}`;

  // 3. CPU Logical Cores (identical across all browsers)
  const cores = navigator.hardwareConcurrency || 4;

  // 4. System Timezone (identical across all browsers)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // 5. Operating System (normalized: windows, macos, linux, etc.)
  const os = getNormalizedOS();

  // Invariant hardware signature: completely free of browser-specific font/audio engine variances
  const hardwareSignature = [
    `gpu:${cleanGpu}`,
    `screen:${screenResolution}`,
    `cores:${cores}`,
    `tz:${timezone}`,
    `os:${os}`
  ].join('|');

  const deviceId = await sha256(hardwareSignature);

  return {
    deviceId,
    hardwareSummary: {
      gpu: cleanGpu,
      screen: screenResolution,
      cores,
      timezone,
      os
    }
  };
}
