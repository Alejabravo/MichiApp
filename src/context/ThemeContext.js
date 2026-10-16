import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightColors, darkColors } from '../theme/colors';

const THEME_KEY = '@michiapp_theme';

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar preferencia guardada
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved !== null) {
        setIsDark(saved === 'dark');
      }
    } catch (error) {
      console.log('Error cargando tema:', error);
    }
    setLoading(false);
  };

  const setDarkMode = async (value) => {
    try {
      setIsDark(value);
      await AsyncStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    } catch (error) {
      console.log('Error guardando tema:', error);
    }
  };

  const toggleTheme = () => setDarkMode(!isDark);

  const value = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme,
    setDarkMode,
  };

  // Mientras carga, mostramos el tema claro por defecto
  if (loading) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}