/** Midlertidig i utviklingsfasen. Sett VITE_PROTOTYPE_ROLE_SWITCHER=false i Vercel før ekte innlogging. */
export const prototypeRoleSwitcherEnabled =
  import.meta.env.DEV || import.meta.env.VITE_PROTOTYPE_ROLE_SWITCHER !== 'false';
