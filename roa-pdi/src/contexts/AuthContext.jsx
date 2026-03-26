import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [authError, setAuthError]     = useState(null);

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

        const profileRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          // Fire-and-forget — lastLoginAt is non-critical; do not block
          // setLoading(false) on this round-trip. (fix: issue #2)
          setDoc(profileRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          setUserProfile(snap.data());
        } else {
          // First login — create profile (await so doc exists before rules evaluate)
          const profile = {
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL:    firebaseUser.photoURL,
            role:        null,
            active:      false,
            createdAt:   serverTimestamp(),
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

  // useMemo prevents a new value object reference on every render,
  // which would cause all context consumers to re-render unnecessarily. (fix: issue #3)
  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    authError,
    signInWithGoogle,
    logout,
    isAdmin:         userProfile?.role === 'admin',
    isServiceWriter: userProfile?.role === 'service_writer',
    isTechnician:    userProfile?.role === 'technician',
    isActive:        userProfile?.active === true,
    hasRole:         (roles) => roles.includes(userProfile?.role),
  }), [user, userProfile, loading, authError]); // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
