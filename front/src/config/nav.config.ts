import { Gamepad2, ShoppingCart, type LucideIcon } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navLinks: NavLink[] = [
  { label: 'Games', href: '/', icon: Gamepad2 },
  { label: 'Store', href: '/store', icon: ShoppingCart },
];
