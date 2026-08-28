/**
 * Vercel Speed Insights Integration
 * This module initializes Vercel Speed Insights for performance monitoring.
 */
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights with default configuration
injectSpeedInsights({
  debug: false, // Set to true for debugging in development
});
