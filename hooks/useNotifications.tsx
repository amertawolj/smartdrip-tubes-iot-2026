import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notif] Harus pakai device fisik');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notif] Permission ditolak');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('smartdrip', {
      name: 'SmartDrip Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E74C3C',
      sound: 'default',
    });
  }

  return true;
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'smartdrip' }),
    },
    trigger: null,
  });
}

export function useNotificationListener() {
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(notif => {
      console.log('[Notif] Diterima:', notif.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notif] Ditap:', response.notification.request.content.data);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}