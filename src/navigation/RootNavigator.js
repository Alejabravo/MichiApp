import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import EditCatScreen from '../screens/Home/EditCatScreen';
import RecipesScreen from '../screens/Home/RecipesScreen';
import SpyScreen from '../screens/Play/SpyScreen';
import MazeScreen from '../screens/Play/MazeScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="EditCat" component={EditCatScreen} />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="Spy" component={SpyScreen} />
      <Stack.Screen name="Maze" component={MazeScreen} />
    </Stack.Navigator>
  );
}