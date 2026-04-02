import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadOpenSans } from '@remotion/google-fonts/OpenSans';

export const { fontFamily: montserrat } = loadMontserrat('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const { fontFamily: openSans } = loadOpenSans('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});
