import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="student/login" />
      <Stack.Screen name="professor/login" />
    </Stack>
  );
}
