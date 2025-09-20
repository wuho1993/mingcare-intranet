/**
 * Utility to get the correct asset path for GitHub Pages or local development
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  
  // In production (GitHub Pages), use basePath
  if (process.env.NODE_ENV === 'production') {
    return `/mingcare-intranet/${cleanPath}`
  }
  
  // In development, use relative path
  return `/${cleanPath}`
}