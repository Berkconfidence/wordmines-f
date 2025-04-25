import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GameLayout() {

  return (
      <>
        <StatusBar style="dark" backgroundColor="#fff" />
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#fff',
          }
        }} />
      </>
    );
}
