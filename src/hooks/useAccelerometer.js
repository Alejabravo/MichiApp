import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

// Hook personalizado para el acelerometro
export default function useAccelerometer(updateInterval = 50) {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let subscription;

    Accelerometer.isAvailableAsync().then((isAvailable) => {
      setAvailable(isAvailable);

      if (isAvailable) {
        Accelerometer.setUpdateInterval(updateInterval);

        subscription = Accelerometer.addListener((accelerometerData) => {
          setData(accelerometerData);
        });
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  return { data, available };
}