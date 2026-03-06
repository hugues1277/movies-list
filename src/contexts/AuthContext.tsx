import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

export const REGISTRATION_ENABLED = import.meta.env.VITE_ENABLE_REGISTRATION !== 'false';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e.code));
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e.code));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await signOut(auth);
  }, []);

  // Tout utilisateur connecté est considéré admin
  const isAdmin = !!user;

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Email invalide';
    case 'auth/user-disabled': return 'Compte désactivé';
    case 'auth/user-not-found': return 'Aucun compte trouvé';
    case 'auth/wrong-password': return 'Mot de passe incorrect';
    case 'auth/invalid-credential': return 'Identifiants incorrects';
    case 'auth/email-already-in-use': return 'Email déjà utilisé';
    case 'auth/weak-password': return 'Mot de passe trop faible (6 caractères min.)';
    case 'auth/too-many-requests': return 'Trop de tentatives, réessayez plus tard';
    default: return 'Erreur de connexion';
  }
}

export const useAuth = () => useContext(AuthContext);
