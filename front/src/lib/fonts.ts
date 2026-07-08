import localFont from 'next/font/local';
import { Saira_Condensed } from 'next/font/google';

/** Display font for card numbers/ratings (single weight — keep font-weight 400). */
export const talero = localFont({ src: '../fonts/talero.otf', variable: '--font-talero' });

/** Sporty condensed display for the store wordmark (TEAM STORE) — no italic face,
 *  the slant comes from CSS `italic` (synthesized oblique, same as the prototype). */
export const sairaCondensed = Saira_Condensed({ weight: '900', subsets: ['latin'] });
