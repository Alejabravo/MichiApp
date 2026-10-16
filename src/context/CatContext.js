import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATS_KEY = '@michiapp_cats';
const ACTIVE_KEY = '@michiapp_active_cat';

const CatContext = createContext(null);

export function CatProvider({ children }) {
  const [cats, setCats] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedCats, savedActive] = await Promise.all([
        AsyncStorage.getItem(CATS_KEY),
        AsyncStorage.getItem(ACTIVE_KEY),
      ]);

      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        setCats(parsed);
        setActiveCatId(savedActive || (parsed[0]?.id ?? null));
      }
    } catch (error) {
      console.log('Error cargando michis:', error);
    }
    setLoading(false);
  };

  const persist = async (newCats, newActiveId) => {
    try {
      await AsyncStorage.setItem(CATS_KEY, JSON.stringify(newCats));
      if (newActiveId !== undefined) {
        await AsyncStorage.setItem(ACTIVE_KEY, newActiveId ?? '');
      }
    } catch (error) {
      console.log('Error guardando michis:', error);
    }
  };

  const addCat = async (cat) => {
    const newCat = {
      id: Date.now().toString(),
      name: 'Nuevo Michi',
      photo: null,
      age: '',
      weight: '',
      breed: '',
      sex: 'Hembra',
      birthdate: '',
      chip: '',
      notes: '',
      ...cat,
    };
    const newCats = [...cats, newCat];
    setCats(newCats);
    if (!activeCatId) setActiveCatId(newCat.id);
    await persist(newCats, activeCatId || newCat.id);
    return newCat;
  };

  const updateCat = async (id, updates) => {
    const newCats = cats.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCats(newCats);
    await persist(newCats);
  };

  const deleteCat = async (id) => {
    const newCats = cats.filter((c) => c.id !== id);
    let newActiveId = activeCatId;
    if (activeCatId === id) {
      newActiveId = newCats[0]?.id ?? null;
    }
    setCats(newCats);
    setActiveCatId(newActiveId);
    await persist(newCats, newActiveId);
  };

  const selectCat = async (id) => {
    setActiveCatId(id);
    await AsyncStorage.setItem(ACTIVE_KEY, id ?? '');
  };

  const activeCat = cats.find((c) => c.id === activeCatId) || null;

  const value = {
    cats,
    activeCat,
    activeCatId,
    loading,
    addCat,
    updateCat,
    deleteCat,
    selectCat,
  };

  if (loading) return null;

  return <CatContext.Provider value={value}>{children}</CatContext.Provider>;
}

export function useCats() {
  const ctx = useContext(CatContext);
  if (!ctx) throw new Error('useCats debe usarse dentro de CatProvider');
  return ctx;
}