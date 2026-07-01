'use client';

/**
 * Client-side re-export barrel for Phosphor icons.
 *
 * Phosphor's package barrel evaluates `createContext` (IconContext) at import
 * time and ships no `'use client'` directive, so importing it from a Server
 * Component throws "createContext only works in Client Components". Routing every
 * icon import through this `'use client'` module pushes that evaluation into the
 * client boundary, while keeping the global duotone IconContext working.
 *
 * Global weight (duotone) is set once via <IconContext.Provider> in app-providers.
 */
export {
  ArrowsLeftRight,
  ArrowsOut,
  ArrowRight,
  ArrowUpRight,
  AppleLogo,
  Bell,
  Broadcast,
  CalendarDots,
  Camera,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  Coins,
  Crown,
  DeviceMobile,
  Envelope,
  Flag,
  GameController,
  Gift,
  Globe,
  Hash,
  Image,
  Info,
  Package,
  PaperPlaneTilt,
  Pause,
  Pencil,
  Percent,
  Play,
  Plus,
  Pulse,
  Rectangle,
  Scan,
  ShoppingCart,
  SoccerBall,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
  Sword,
  Target,
  Ticket,
  TrendUp,
  Trophy,
  Users,
  Wallet,
  Warning,
  WarningOctagon,
  X,
  IconContext,
} from '@phosphor-icons/react';

export type { Icon, IconProps } from '@phosphor-icons/react';
