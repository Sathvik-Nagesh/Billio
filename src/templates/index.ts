import { MinimalModern } from './MinimalModern';
import { PremiumCorporate } from './PremiumCorporate';
import { TraditionalIndian } from './TraditionalIndian';
import { PublicationFocus } from './PublicationFocus';
import { ElegantSerif } from './ElegantSerif';
import { BoldContemporary } from './BoldContemporary';
import type { TemplateProps } from './types';
import type React from 'react';

export const TEMPLATE_REGISTRY: Record<string, React.ComponentType<TemplateProps>> = {
  'minimal-modern': MinimalModern,
  'premium-corporate': PremiumCorporate,
  'traditional-indian': TraditionalIndian,
  'publication-focus': PublicationFocus,
  'elegant-serif': ElegantSerif,
  'bold-contemporary': BoldContemporary,
};

export const TEMPLATE_LIST = [
  { id: 'minimal-modern', name: 'Minimal Modern', description: 'Clean, lots of whitespace, modern sans-serif' },
  { id: 'premium-corporate', name: 'Premium Corporate', description: 'Bold gradient header, professional grid layout' },
  { id: 'traditional-indian', name: 'Traditional Indian', description: 'Classic Indian invoice style with bordered table' },
  { id: 'publication-focus', name: 'Publication Focus', description: 'Designed for book businesses with ISBN prominence' },
  { id: 'elegant-serif', name: 'Elegant Serif', description: 'Serif typography, refined spacing, upscale aesthetic' },
  { id: 'bold-contemporary', name: 'Bold Contemporary', description: 'Dark theme, strong color blocks, modern and striking' },
];

export { MinimalModern, PremiumCorporate, TraditionalIndian, PublicationFocus, ElegantSerif, BoldContemporary };
export type { TemplateProps };
