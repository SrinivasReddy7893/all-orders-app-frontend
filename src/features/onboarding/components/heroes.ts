import { InboxHero } from './InboxHero';
import { JourneyHero } from './JourneyHero';

/** Welcome-screen hero variants under review; one will be kept. */
export const HEROES = {
  route: InboxHero,
  journey: JourneyHero,
} as const;

export type HeroVariant = keyof typeof HEROES;

export const ACTIVE_HERO: HeroVariant = 'journey';
