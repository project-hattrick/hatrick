import { GameController, Sword, ShoppingCart, type Icon } from '@/components/common/icons';

interface NavLink {
  labelKey: 'nav.games' | 'nav.duelists' | 'nav.store';
  href: string;
  icon: Icon;
}

export const navLinks: NavLink[] = [
  { labelKey: 'nav.games', href: '/', icon: GameController },
  { labelKey: 'nav.duelists', href: '/duelists', icon: Sword },
  { labelKey: 'nav.store', href: '/store', icon: ShoppingCart },
];
