/**
 * Visningslinjen (svart) og prototypemodus.
 * Lokalt (DEV) på som standard, og kan slås av med VITE_PROTOTYPE_ROLE_SWITCHER=false.
 * I produksjon er den av, med mindre VITE_PROTOTYPE_ROLE_SWITCHER=true er satt.
 */
export const prototypeRoleSwitcherEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_PROTOTYPE_ROLE_SWITCHER !== 'false'
  : import.meta.env.VITE_PROTOTYPE_ROLE_SWITCHER === 'true';
