import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

const ALLOWED_DOMAIN = 'rvsofamerica.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const domain = firebaseUser.email.split('@')[1];
        if (domain !== ALLOWED_DOMAIN) {
          await signOut(auth);
          setAuthError('Access restricted to rvsofamerica.com accounts.');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);

        // Load or create user profile in Firestore
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          // Update last login
          await setDoc(profileRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          setUserProfile(snap.data());
        } else {
          // First login — create profile with no role (pending admin approval)
          const profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: null,           // admin must assign role
            active: false,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          await setDoc(profileRef, profile);
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signInWithGoogle,
    logout,
    isAdmin: userProfile?.role === 'admin',
    isServiceWriter: userProfile?.role === 'service_writer',
    isTechnician: userProfile?.role === 'technician',
    isActive: userProfile?.active === true,
    hasRole: (roles) => roles.includes(userProfile?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
