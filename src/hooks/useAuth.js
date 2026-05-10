import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export default function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (store.token && !store.user) {
      store.fetchProfile();
    }
  }, [store.token]);

  return store;
}
