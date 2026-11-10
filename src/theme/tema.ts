import { DefaultTheme, type Theme } from 'expo-router';

// Paleta de Rumi: morado con blanco, acentos violeta y fondos crema.
export const PALETA = {
  morado: '#6B3FA0',
  moradoOscuro: '#2E1A47',
  violeta: '#8E5BD8',
  moradoProfundo: '#2B0E43', // fondo de los formularios y del logo
  lila: '#B9A3E3', // mitad clara del logo
  lilaClaro: '#EDE5F8',
  crema: '#FBF8F2',
  blanco: '#FFFFFF',
  borde: '#DDD0F0',
  textoSuave: '#6E5E87',
  error: '#C62828',
} as const;

// Tema de React Navigation: todas las pantallas leen estos colores con useTheme().
export const temaRumi: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: PALETA.morado,
    background: PALETA.crema,
    card: PALETA.blanco,
    text: PALETA.moradoOscuro,
    border: PALETA.borde,
    notification: PALETA.violeta,
  },
};
