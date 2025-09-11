import { useEffect, useState } from 'react';
import { colors } from '@/lib/material-ui/theme';

const adjustHexColor = (color: string, percent: number): string => {
  const r = Math.min(255, Math.max(0, parseInt(color.slice(1, 3), 16) + Math.round((255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, parseInt(color.slice(3, 5), 16) + Math.round((255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, parseInt(color.slice(5, 7), 16) + Math.round((255 * percent) / 100)));

  const toHex = (value: number) => value.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const useTheme = () => {
  const [themeColorPrimaryDefault, setThemeColorPrimaryDefault] = useState(colors.primaryDefault); // Use account color or default
  const [themeColorSecondaryDefault, setThemeColorSecondaryDefault] = useState(colors.primaryDefault); // Use account color or default

  const themeColorPrimaryHover = adjustHexColor(themeColorPrimaryDefault, 20);
  const themeColorSecondaryHover = adjustHexColor(themeColorSecondaryDefault, 20);

  useEffect(() => {
    updateTheme();
  }, []);

  const updateTheme = () => {
    setThemeColorPrimaryDefault(colors.primaryDefault);
    setThemeColorSecondaryDefault(colors.primaryDefault);
  };

  return {
    themeColorPrimaryDefault,
    themeColorSecondaryDefault,
    themeColorPrimaryHover,
    themeColorSecondaryHover,
  };
};
