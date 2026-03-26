import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

const ALLOWED_DOMAIN = 'rvsofamerica.com';

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [authError, setAuthError]     = useState(null);

  useEffect(() => {
    // Holds the profile onSnapshot unsubscribe so we can tear it down when
    // the user signs out or a different user signs in.
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Always clean up the previous profile listener first.
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

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

      if (!snap.exists()) {
        // First login — create profile and await so it exists before the
        // onSnapshot listener fires and rules can evaluate.
        await setDoc(profileRef, {
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL:    firebaseUser.photoURL,
          role:        null,
          active:      false,
          createdAt:   serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        // Fire-and-forget — lastLoginAt is non-critical, do not block loading.
        setDoc(profileRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      // C5: Live listener so role/active changes by an admin are reflected
      // immediately without requiring the user to sign out and back in.
      profileUnsub = onSnapshot(
        profileRef,
        (profileSnap) => {
          if (profileSnap.exists()) setUserProfile(profileSnap.data());
          setLoading(false);
        },
        (err) => {
          console.error('Profile listener error:', err);
          setLoading(false);
        },
      );
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // L4: useCallback so these stable references can be included in useMemo deps
  // without triggering unnecessary re-renders.
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err.message);
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

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
  }), [user, userProfile, loading, authError, signInWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
