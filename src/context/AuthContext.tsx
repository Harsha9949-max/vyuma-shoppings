import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { Address, UserProfile } from '../types';
import {
  subscribeToUserAddresses,
  saveUserAddressToFirestore,
  deleteUserAddressFromFirestore,
} from '../firebase/services';

export const MASTER_ADMIN_EMAIL = 'marateyh@gmail.com';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isGoogleAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addresses: Address[];
  addAddress: (addr: Omit<Address, 'id'>) => Promise<void>;
  removeAddress: (addrId: string) => Promise<void>;
  selectedAddress: Address | null;
  setSelectedAddress: (addr: Address | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Check if authentication provider is Google
        const hasGoogleProvider = fbUser.providerData.some(
          (p) => p.providerId === 'google.com'
        );
        setIsGoogleAuth(hasGoogleProvider);

        const isMaster =
          hasGoogleProvider &&
          fbUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

        let userRole: 'customer' | 'admin' = isMaster ? 'admin' : 'customer';

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            userRole = isMaster ? 'admin' : (data.role || 'customer');
          } else {
            await setDoc(userDocRef, {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              role: userRole,
              provider: hasGoogleProvider ? 'google' : 'password',
              createdAt: Date.now(),
            });
          }
        } catch (e) {
          console.warn('Firestore user profile sync notice:', e);
        }

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Vyuma Shopper',
          photoURL: fbUser.photoURL,
          role: userRole,
        };

        setUser(profile);
      } else {
        setUser(null);
        setIsGoogleAuth(false);
        setAddresses([]);
        setSelectedAddress(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Real User Addresses from Firestore
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToUserAddresses(user.uid, (list) => {
        setAddresses(list);
        if (list.length > 0 && !selectedAddress) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddress(defaultAddr);
        }
      });
      return () => unsub();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  }, [user?.uid]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });

      try {
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          email: res.user.email,
          displayName: name,
          role: 'customer',
          provider: 'password',
          createdAt: Date.now(),
        });
      } catch (err) {
        console.warn('Could not write user profile doc:', err);
      }

      setUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: name,
        photoURL: null,
        role: 'customer',
      });
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUser(null);
    setIsGoogleAuth(false);
    setAddresses([]);
    setSelectedAddress(null);
  };

  // Add Address directly to Firestore
  const addAddress = async (addrData: Omit<Address, 'id'>) => {
    const newAddr: Address = {
      ...addrData,
      id: `addr-${Date.now()}`,
    };

    if (user?.uid) {
      await saveUserAddressToFirestore(user.uid, newAddr);
    } else {
      // Local session if guest
      setAddresses((prev) => [newAddr, ...prev]);
    }
    setSelectedAddress(newAddr);
  };

  const removeAddress = async (addrId: string) => {
    if (user?.uid) {
      await deleteUserAddressFromFirestore(user.uid, addrId);
    }
    setAddresses((prev) => prev.filter((a) => a.id !== addrId));
    if (selectedAddress?.id === addrId) {
      setSelectedAddress(null);
    }
  };

  // Admin access is strictly via Google Auth for marateyh@gmail.com
  const isAdmin = Boolean(
    isGoogleAuth && user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isGoogleAuth,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        addresses,
        addAddress,
        removeAddress,
        selectedAddress,
        setSelectedAddress,
        authModalOpen,
        setAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
