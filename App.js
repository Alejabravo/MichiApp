import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { CatProvider } from './src/context/CatContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CatProvider>
          <AppContent />
        </CatProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}