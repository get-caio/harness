# React Native / Expo Skill

Patterns for building React Native apps with Expo. Reference this when building mobile features.

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Schedule tab
│   │   ├── plans.tsx      # Plans tab
│   │   ├── stats.tsx      # Stats tab
│   │   └── coach.tsx      # AI Coach tab
│   ├── (auth)/            # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── workout/[id].tsx   # Workout detail
│   └── _layout.tsx        # Root layout
├── components/
│   ├── ui/                # Base components
│   └── features/          # Feature components
├── hooks/
├── lib/
│   ├── api.ts             # API client (tRPC or fetch)
│   ├── auth.ts            # Auth helpers
│   └── storage.ts         # Async storage
├── constants/
└── types/
```

---

## Navigation (Expo Router)

### Tab Layout

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Calendar, Trophy, BarChart, MessageCircle } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <BarChart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

### Stack Navigation

```typescript
// app/workout/[id].tsx
import { useLocalSearchParams, Stack } from 'expo-router'

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  return (
    <>
      <Stack.Screen options={{ title: 'Workout' }} />
      <WorkoutContent id={id} />
    </>
  )
}
```

---

## Styling

### Use StyleSheet (Not Tailwind)

```typescript
import { StyleSheet, View, Text } from 'react-native'

export function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{workout.title}</Text>
      <Text style={styles.subtitle}>{workout.duration} min</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
})
```

### Theming

```typescript
// constants/theme.ts
export const theme = {
  colors: {
    primary: '#0066FF',
    secondary: '#10B981',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#111111',
    textSecondary: '#666666',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
}

// Usage
const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
})
```

---

## Data Fetching

### React Query Setup

```typescript
// lib/api.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
})

// API base
const API_URL = process.env.EXPO_PUBLIC_API_URL

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
```

### Custom Hooks

```typescript
// hooks/use-workouts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useWorkouts(date: string) {
  return useQuery({
    queryKey: ['workouts', date],
    queryFn: () => api<Workout[]>(`/workouts?date=${date}`),
  })
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CompleteWorkoutData) =>
      api('/workouts/complete', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}
```

---

## Local Storage

### Async Storage

```typescript
// lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key)
    return value ? JSON.parse(value) : null
  },
  
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  },
  
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
  },
}

// Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  CACHED_WORKOUTS: 'cached_workouts',
}
```

### Secure Storage (for tokens)

```typescript
// lib/secure-storage.ts
import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key)
  },
  
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value)
  },
  
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key)
  },
}
```

---

## Authentication

### Auth Context

```typescript
// context/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { secureStorage } from '@/lib/secure-storage'

interface AuthContextType {
  user: User | null
  signIn: (token: string, user: User) => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()
  
  // Check auth on mount
  useEffect(() => {
    loadUser()
  }, [])
  
  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return
    
    const inAuthGroup = segments[0] === '(auth)'
    
    if (!user && !inAuthGroup) {
      router.replace('/sign-in')
    } else if (user && inAuthGroup) {
      router.replace('/')
    }
  }, [user, segments, isLoading])
  
  async function loadUser() {
    try {
      const token = await secureStorage.get('auth_token')
      if (token) {
        // Validate token and get user
        const user = await api<User>('/auth/me')
        setUser(user)
      }
    } catch {
      await secureStorage.remove('auth_token')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function signIn(token: string, user: User) {
    await secureStorage.set('auth_token', token)
    setUser(user)
  }
  
  async function signOut() {
    await secureStorage.remove('auth_token')
    setUser(null)
  }
  
  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

---

## Offline Support

### Offline Queue

```typescript
// lib/offline-queue.ts
import NetInfo from '@react-native-community/netinfo'
import { storage, STORAGE_KEYS } from './storage'

interface QueuedAction {
  id: string
  type: 'COMPLETE_WORKOUT' | 'LOG_ACTIVITY' | 'SYNC_DATA'
  payload: unknown
  timestamp: number
}

class OfflineQueue {
  private queue: QueuedAction[] = []
  
  async init() {
    this.queue = await storage.get(STORAGE_KEYS.OFFLINE_QUEUE) ?? []
    
    // Listen for connectivity
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue()
      }
    })
  }
  
  async add(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    
    this.queue.push(queuedAction)
    await this.persist()
    
    // Try to process immediately
    this.processQueue()
  }
  
  private async processQueue() {
    const state = await NetInfo.fetch()
    if (!state.isConnected || this.queue.length === 0) return
    
    const toProcess = [...this.queue]
    
    for (const action of toProcess) {
      try {
        await this.execute(action)
        this.queue = this.queue.filter(a => a.id !== action.id)
      } catch {
        // Keep in queue for retry
        break
      }
    }
    
    await this.persist()
  }
  
  private async execute(action: QueuedAction) {
    switch (action.type) {
      case 'COMPLETE_WORKOUT':
        await api('/workouts/complete', {
          method: 'POST',
          body: JSON.stringify(action.payload),
        })
        break
      // ... other action types
    }
  }
  
  private async persist() {
    await storage.set(STORAGE_KEYS.OFFLINE_QUEUE, this.queue)
  }
}

export const offlineQueue = new OfflineQueue()
```

---

## Push Notifications

### Setup

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') {
    return null
  }
  
  const token = await Notifications.getExpoPushTokenAsync()
  
  // Android channel setup
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('workouts', {
      name: 'Workouts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }
  
  return token.data
}
```

---

## Lists & Performance

### FlashList for Large Lists

```typescript
import { FlashList } from '@shopify/flash-list'

function WorkoutList({ workouts }: { workouts: Workout[] }) {
  return (
    <FlashList
      data={workouts}
      renderItem={({ item }) => <WorkoutCard workout={item} />}
      estimatedItemSize={100}
      keyExtractor={(item) => item.id}
    />
  )
}
```

### Memoization

```typescript
import { memo, useCallback } from 'react'

const WorkoutCard = memo(function WorkoutCard({ 
  workout, 
  onPress 
}: { 
  workout: Workout
  onPress: (id: string) => void 
}) {
  const handlePress = useCallback(() => {
    onPress(workout.id)
  }, [workout.id, onPress])
  
  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <Text>{workout.title}</Text>
    </Pressable>
  )
})
```

---

## Haptics & Audio

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics'

// Light tap for buttons
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// Medium for important actions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

// Success notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

// Error notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
```

### Audio Cues (for workouts)

```typescript
import { Audio } from 'expo-av'

const sounds = {
  intervalStart: require('@/assets/sounds/beep-start.mp3'),
  intervalEnd: require('@/assets/sounds/beep-end.mp3'),
  workoutComplete: require('@/assets/sounds/complete.mp3'),
}

export async function playSound(sound: keyof typeof sounds) {
  const { sound: audioSound } = await Audio.Sound.createAsync(sounds[sound])
  await audioSound.playAsync()
  
  // Unload after playing
  audioSound.setOnPlaybackStatusUpdate(status => {
    if (status.isLoaded && status.didJustFinish) {
      audioSound.unloadAsync()
    }
  })
}
```

---

## Testing

```typescript
// __tests__/WorkoutCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import { WorkoutCard } from '@/components/WorkoutCard'

describe('WorkoutCard', () => {
  const mockWorkout = {
    id: '1',
    title: 'Easy Run',
    duration: 45,
    sport: 'RUNNING',
  }
  
  it('renders workout title', () => {
    render(<WorkoutCard workout={mockWorkout} onPress={() => {}} />)
    expect(screen.getByText('Easy Run')).toBeTruthy()
  })
  
  it('calls onPress with workout id', () => {
    const onPress = jest.fn()
    render(<WorkoutCard workout={mockWorkout} onPress={onPress} />)
    
    fireEvent.press(screen.getByText('Easy Run'))
    expect(onPress).toHaveBeenCalledWith('1')
  })
})
```

---

## Best Practices

1. **Use Expo SDK** when possible — avoid native modules
2. **Optimize images** — Use expo-image, not Image
3. **Minimize re-renders** — Use memo, useCallback
4. **Handle offline** — Queue actions, cache data
5. **Test on device** — Simulators miss performance issues
6. **Use FlashList** for lists over 50 items
7. **Secure sensitive data** — Use SecureStore for tokens
