"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { database } from "@/app/lib/firebase";
import { ref, onValue } from "firebase/database";
import { ItemsMap, Pledge } from "@/app/types";

interface RealTimeContextType {
  items: ItemsMap | null;
  pledges: Pledge[];
  loading: boolean;
  refresh: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemsMap | null>(null);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to items config
    const itemsRef = ref(database, "items");
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(data);
      else {
        // Initialize default items if none exist
        const defaultItems: ItemsMap = {
          rice: { required: 500, unit: "kg", pledged: 0 },
          beans: { required: 300, unit: "kg", pledged: 0 },
          maize: { required: 200, unit: "kg", pledged: 0 },
        };
        setItems(defaultItems);
      }
      setLoading(false);
    });

    // Listen to pledges list
    const pledgesRef = ref(database, "pledges");
    const unsubscribePledges = onValue(pledgesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pledgesArray: Pledge[] = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Pledge, "id">),
        }));
        setPledges(pledgesArray);
      } else {
        setPledges([]);
      }
    });

    return () => {
      unsubscribeItems();
      unsubscribePledges();
    };
  }, []);

  const refresh = () => {
    // Manual refresh (listeners already real-time, but this can be used to force re-fetch)
  };

  return (
    <RealTimeContext.Provider value={{ items, pledges, loading, refresh }}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (!context) throw new Error("useRealTime must be used within RealTimeProvider");
  return context;
}