import { GameController, Sword, ShoppingCart, type Icon } from '@/components/common/icons';

interface NavLink {
  label: string;
  href: string;
  icon: Icon;
}

export const navLinks: NavLink[] = [
  { label: 'Games', href: '/', icon: GameController },
  { label: 'Duelists', href: '/duelists', icon: Sword },
  { label: 'Store', href: '/store', icon: ShoppingCart },
];
