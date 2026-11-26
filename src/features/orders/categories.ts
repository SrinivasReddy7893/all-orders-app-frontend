import {
  Flower2,
  Headphones,
  House,
  Package,
  Pill,
  Shirt,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

type CategoryStyle = {
  icon: LucideIcon;
  /** Segment colour on the dark ember header. */
  bar: string;
  /** Tile background and icon colour on white. */
  tint: string;
  ink: string;
};

const STYLES: Record<string, CategoryStyle> = {
  GADGETS: {
    icon: Headphones,
    bar: '#FF8A4C',
    tint: '#FDEDE4',
    ink: '#B23A0E',
  },
  APPAREL: { icon: Shirt, bar: '#FFD2A8', tint: '#FBF0E4', ink: '#8C4A12' },
  HOME: { icon: House, bar: '#F2B544', tint: '#FFF3D6', ink: '#8A5A00' },
  GROCERIES: {
    icon: ShoppingBasket,
    bar: '#7FCB9A',
    tint: '#E9F4EC',
    ink: '#2D6047',
  },
  FOOD: {
    icon: UtensilsCrossed,
    bar: '#FF6B5A',
    tint: '#FDE8E5',
    ink: '#A3271A',
  },
  PERSONAL_CARE: {
    icon: Sparkles,
    bar: '#F7A1B5',
    tint: '#FCEBEF',
    ink: '#9C2F4C',
  },
  FRAGRANCE: { icon: Flower2, bar: '#E9C8A0', tint: '#F6EEE4', ink: '#6E4B26' },
  HEALTH: { icon: Pill, bar: '#8FD0C8', tint: '#E4F3F1', ink: '#1F5F58' },
  OTHER: { icon: Package, bar: '#B9A69B', tint: '#F1ECE8', ink: '#5B4335' },
};

export const categoryStyle = (key: string): CategoryStyle =>
  STYLES[key] ?? STYLES.OTHER;
