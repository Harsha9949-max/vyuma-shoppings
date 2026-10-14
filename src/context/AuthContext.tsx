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
import { syncUserToBothBackends } from '../services/dualBackendCoordinator';

export const MASTER_ADMIN_EMAIL = 'marateyh@gmail.com';
export const SUPER_ADMIN_EMAILS = [
  'hvrsindustriespvtltd@gmail.com',
  'marateyh@gmail.com',
  'maratayh@gmail.com'
];

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isGoogleAuth: boolean;
  adminPanelOpen: boolean;
  setAdminPanelOpen: (open: boolean) => void;
  triggerAdminPanel: () => void;
  signInWithGoogle: () => Promise<any>;
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
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const emailLower = (fbUser.email || '').trim().toLowerCase();
        const isMaster = SUPER_ADMIN_EMAILS.includes(emailLower);

        // Check if authentication provider is Google
        const hasGoogleProvider =
          fbUser.providerData.some(
            (p) => p.providerId === 'google.com' || p.providerId === 'google'
          ) ||
          fbUser.providerId === 'google.com' ||
          sessionStorage.getItem('vyuma_last_provider') === 'google' ||
          (isMaster && emailLower.endsWith('@gmail.com'));

        setIsGoogleAuth(hasGoogleProvider);

        // Immediate user profile update so UI reflects admin state instantly
        const initialProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (isMaster ? 'Master Admin' : fbUser.email?.split('@')[0] || 'Vyuma Shopper'),
          photoURL: fbUser.photoURL,
          role: isMaster ? 'admin' : 'customer',
        };
        setUser(initialProfile);

        // Automatically trigger Admin Panel if master admin signs in
        if (isMaster) {
          setAdminPanelOpen(true);
        }

        // Perfect Dual-Backend Coordination: Sync user simultaneously to Firestore & Supabase
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          let finalRole: UserProfile['role'] = isMaster ? 'admin' : 'customer';

          if (snap.exists()) {
            const data = snap.data();
            finalRole = isMaster ? 'admin' : (data.role || 'customer');
            setUser((prev) => (prev ? { ...prev, role: finalRole } : initialProfile));
          } else {
            await setDoc(userDocRef, {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              role: finalRole,
              provider: hasGoogleProvider ? 'google' : 'password',
              createdAt: Date.now(),
            });
          }

          // Maintain and increment user across both backends
          syncUserToBothBackends({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || initialProfile.displayName,
            photoURL: fbUser.photoURL,
            role: finalRole,
          }).catch((err) => console.log('Dual-backend user sync deferred:', err?.message));
        } catch (e) {
          console.warn('User profile sync notice:', e);
        }
      } else {
        setUser(null);
        setIsGoogleAuth(false);
        setAddresses([]);
        setSelectedAddress(null);
        setAdminPanelOpen(false);
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
      sessionStorage.setItem('vyuma_last_provider', 'google');
      const res = await signInWithPopup(auth, googleProvider);
      const emailLower = (res.user.email || '').trim().toLowerCase();
      const isMaster = SUPER_ADMIN_EMAILS.includes(emailLower);

      setIsGoogleAuth(true);

      const profile: UserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || (isMaster ? 'Master Admin' : 'Vyuma Shopper'),
        photoURL: res.user.photoURL,
        role: isMaster ? 'admin' : 'customer',
      };
      setUser(profile);
      setAuthModalOpen(false);

      // Trigger admin panel immediately if master admin
      if (isMaster) {
        setAdminPanelOpen(true);
      }
      return res.user;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      sessionStorage.setItem('vyuma_last_provider', 'password');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const emailLower = (res.user.email || '').trim().toLowerCase();
      const isMaster = SUPER_ADMIN_EMAILS.includes(emailLower);

      const profile: UserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || (isMaster ? 'Master Admin' : 'Vyuma Shopper'),
        photoURL: res.user.photoURL,
        role: isMaster ? 'admin' : 'customer',
      };
      setUser(profile);
      setAuthModalOpen(false);

      if (isMaster) {
        setAdminPanelOpen(true);
      }
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
      sessionStorage.setItem('vyuma_last_provider', 'password');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });

      const newProfile: UserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: name,
        photoURL: null,
        role: 'customer',
      };

      // Dual-backend user registration replication
      syncUserToBothBackends(newProfile).catch((err) => {
        console.log('Dual-backend new user sync notice:', err?.message);
      });

      setUser(newProfile);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('vyuma_last_provider');
      sessionStorage.removeItem('vyuma_admin_triggered_session');
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUser(null);
    setIsGoogleAuth(false);
    setAdminPanelOpen(false);
    setAddresses([]);
    setSelectedAddress(null);
  };

  const triggerAdminPanel = () => {
    setAdminPanelOpen(true);
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

  // Admin access is strictly for authorized Super Admins
  const emailLower = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
  const isAdmin = Boolean(
    SUPER_ADMIN_EMAILS.includes(emailLower)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isGoogleAuth,
        adminPanelOpen,
        setAdminPanelOpen,
        triggerAdminPanel,
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
