
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Subscription, AppNotification, Role, SubRole, SubscriptionStatus } from '@/lib/types';
import { mockUsers, mockSubscriptions, mockNotifications } from '@/lib/data';
import { add, formatISO } from 'date-fns';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch, Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

interface AppState {
  users: User[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  currentUser: User | null;
  isSyncing: boolean;
  hasFetchedFromFirestore: boolean;
  register: (user: Omit<User, 'id' | 'googleUid'>) => void;
  registerWithGoogle: () => Promise<User | null>;
  registerWithMicrosoft: () => Promise<User | null>;
  login: (email: string, password: string, role: Role, subrole?: SubRole) => User | null;
  loginWithGoogle: (role: Role, subrole?: SubRole) => Promise<User | null>;
  loginWithMicrosoft: (role: Role, subrole?: SubRole) => Promise<User | null>;
  logout: () => void;
  addSubscriptionRequest: (request: Omit<Subscription, 'id' | 'status' | 'requestDate' | 'requestedBy'>) => void;
  renewSubscription: (subscriptionId: string, renewalDuration: number, updatedCost: number, remarks: string, alertDays: number) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: SubscriptionStatus, reason?: string) => void;
  forwardToAM: (subscriptionId: string, apaForwarderId: string) => void;
  submitAMLog: (subscriptionId: string, amLogData: Omit<Subscription['finance']['amLog'], 'by' | 'at'>) => void;
  markAsPaid: (subscriptionId: string, apaExecutorId: string, executionData: Omit<Subscription['finance']['apaExecution'], 'by' | 'at'>) => void;
  addNotification: (userId: string, message: string) => void;
  readNotification: (notificationId: string) => void;
  triggerRenewalAlert: (subscriptionId: string) => void;
  updateSubscriptionDetails: (subscriptionId: string, updatedDetails: Partial<Subscription>) => void;
  syncFromFirestore: () => Promise<void>;
}

const generateId = () => `id-${new Date().getTime()}`;

const COLLECTIONS = {
  users: 'users',
  subscriptions: 'subscriptions',
  notifications: 'notifications',
} as const;

const getFirestoreInstance = () => {
  try {
    return initializeFirebase().firestore;
  } catch (error) {
    console.error('Failed to initialize Firebase services', error);
    return null;
  }
};

const getAuthInstance = () => {
  try {
    return initializeFirebase().auth;
  } catch (error) {
    console.error('Failed to get Firebase Auth instance', error);
    return null;
  }
};

// Helper to wait for authentication to be ready
async function waitForAuth(maxWaitMs = 5000): Promise<boolean> {
  const auth = getAuthInstance();
  if (!auth) {
    console.error('❌ Auth instance not available');
    return false;
  }

  // If already authenticated, return immediately
  if (auth.currentUser) {
    console.log('✅ Already authenticated:', auth.currentUser.uid);
    return true;
  }

  console.log('⏳ No user authenticated, attempting anonymous sign-in...');

  // Try to sign in anonymously
  try {
    const { signInAnonymously } = await import('firebase/auth');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
    return true;
  } catch (error: any) {
    console.error('❌ Anonymous sign-in failed:', error.code, error.message);
    
    // If anonymous auth is not enabled, provide helpful message
    if (error.code === 'auth/operation-not-allowed') {
      console.error('🔥 CRITICAL: Anonymous Authentication is not enabled in Firebase Console!');
      console.error('👉 Enable it at: https://console.firebase.google.com/project/studio-1932959431-4b486/authentication/providers');
    }
    
    return false;
  }
}

async function persistCollection<T extends { id: string }>(collectionName: string, data: T[]) {
  const firestore = getFirestoreInstance();
  if (!firestore || data.length === 0) return;

  // Wait for authentication before attempting to write
  const isAuthenticated = await waitForAuth();
  if (!isAuthenticated) {
    console.warn(`Skipping persist to ${collectionName}: User not authenticated`);
    return;
  }

  try {
    const batch = writeBatch(firestore);
    const colRef = collection(firestore, collectionName);

    data.forEach((item) => {
      batch.set(doc(colRef, item.id), item);
    });

    await batch.commit();
    console.log(`Successfully persisted ${data.length} items to ${collectionName}`);
  } catch (error) {
    console.error(`Failed to persist collection ${collectionName}`, error);
  }
}

async function fetchCollectionDocs<T>(collectionName: string): Promise<(T & { id: string })[]> {
  const firestore = getFirestoreInstance();
  if (!firestore) return [];

  try {
    const snapshot = await getDocs(collection(firestore, collectionName));
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as T),
    }));
  } catch (error) {
    console.error(`Failed to fetch collection ${collectionName}`, error);
    return [];
  }
}

async function seedFirestoreData(firestore: Firestore) {
  const batch = writeBatch(firestore);

  const usersCol = collection(firestore, COLLECTIONS.users);
  mockUsers.forEach((user) => {
    batch.set(doc(usersCol, user.id), user);
  });

  const subscriptionsCol = collection(firestore, COLLECTIONS.subscriptions);
  mockSubscriptions.forEach((subscription) => {
    batch.set(doc(subscriptionsCol, subscription.id), subscription);
  });

  const notificationsCol = collection(firestore, COLLECTIONS.notifications);
  mockNotifications.forEach((notification) => {
    batch.set(doc(notificationsCol, notification.id), notification);
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error('Failed to seed Firestore data', error);
  }
}

const persistUsers = (users: User[]) => persistCollection<User>(COLLECTIONS.users, users);
const persistSubscriptions = (subscriptions: Subscription[]) =>
  persistCollection<Subscription>(COLLECTIONS.subscriptions, subscriptions);
const persistNotifications = (notifications: AppNotification[]) =>
  persistCollection<AppNotification>(COLLECTIONS.notifications, notifications);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      subscriptions: mockSubscriptions,
      notifications: mockNotifications,
      currentUser: null,
      isSyncing: false,
      hasFetchedFromFirestore: false,

      register: (userData) => {
        const { users } = get();
        console.log('📝 Registration attempt:', { email: userData.email, role: userData.role, name: userData.name, subrole: userData.subrole });
        
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
          console.error('❌ Registration failed: Email already exists');
          throw new Error('An account with this email already exists.');
        }

        const newUser: User = {
          ...userData,
          id: generateId(),
          subrole: userData.subrole || null, // Use provided subrole or null
        };

        console.log('✅ Creating new user:', { id: newUser.id, email: newUser.email, role: newUser.role, subrole: newUser.subrole });

        set(state => {
          const updatedUsers = [...state.users, newUser];
          void persistUsers(updatedUsers);
          console.log('💾 Persisting user to Firestore...');
          return { users: updatedUsers };
        });
        
        console.log('✨ User registered successfully!');
      },

      login: (email, password, role, subrole = null) => {
        const allUsers = get().users;
        console.log('🔐 Login attempt:', { email, role, subrole, totalUsers: allUsers.length });
        
        // Log available users for debugging
        console.log('📋 Available users:', allUsers.map(u => ({ 
          email: u.email, 
          role: u.role, 
          subrole: u.subrole,
          hasPassword: !!u.password 
        })));
        
        const user = allUsers.find(
          (u) =>
            u.email === email &&
            u.password === password &&
            u.role === role &&
            (role !== 'finance' || u.subrole === subrole)
        );

        if (user) {
          console.log('✅ Login successful for:', user.email);
          set({ currentUser: user });
          get().addNotification(user.id, `Welcome back, ${user.name}! You've successfully logged in.`);
          return user;
        }
        
        // Check if email exists but password/role is wrong
        const userWithEmail = allUsers.find(u => u.email === email);
        if (userWithEmail) {
          console.error('❌ Login failed: Email found but credentials mismatch', {
            providedPassword: password,
            providedRole: role,
            userRole: userWithEmail.role,
            passwordMatch: userWithEmail.password === password
          });
          throw new Error("Invalid credentials. Please check your password and portal.");
        } else {
          console.error('❌ Login failed: Email not found in database');
          throw new Error("Account not found. Please register first.");
        }
      },

      loginWithGoogle: async (role, subrole = null) => {
        const { auth } = initializeFirebase();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            if (!googleUser.email) {
                throw new Error("Could not retrieve email from Google account.");
            }

            const appUser = get().users.find(u => u.email === googleUser.email);
            
            if (!appUser) {
                throw new Error("You are not registered. Please create an account or contact an administrator.");
            }

            const isRoleMatch = appUser.role === role;
            const isSubRoleMatch = role !== 'finance' || appUser.subrole === subrole;

            if (isRoleMatch && isSubRoleMatch) {
                const updatedUser: User = { ...appUser, googleUid: googleUser.uid };
                 set(state => {
                    const updatedUsers = state.users.map(u => u.id === appUser.id ? updatedUser : u);
                    void persistUsers(updatedUsers);
                    return {
                      users: updatedUsers,
                      currentUser: updatedUser
                    };
                });
                get().addNotification(updatedUser.id, `Welcome back, ${updatedUser.name}! You've successfully logged in with Google.`);
                return updatedUser;
            } else {
                 throw new Error("Access Denied: Your Google account does not match this portal's role.");
            }
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                 throw new Error("Login cancelled. Please try again.");
            }
            // Re-throw other errors to be caught by the UI
            throw error;
        }
      },

      loginWithMicrosoft: async (role, subrole = null) => {
        const { auth } = initializeFirebase();
        const provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await signInWithPopup(auth, provider);
            const microsoftUser = result.user;

            if (!microsoftUser.email) {
                throw new Error("Could not retrieve email from Microsoft account.");
            }

            const appUser = get().users.find(u => u.email === microsoftUser.email);
            
            if (!appUser) {
                throw new Error("You are not registered. Please create an account or contact an administrator.");
            }

            const isRoleMatch = appUser.role === role;
            const isSubRoleMatch = role !== 'finance' || appUser.subrole === subrole;

            if (isRoleMatch && isSubRoleMatch) {
                const updatedUser: User = { ...appUser, microsoftUid: microsoftUser.uid };
                set(state => {
                  const updatedUsers = state.users.map(u => u.id === appUser.id ? updatedUser : u);
                  void persistUsers(updatedUsers);
                  return {
                    users: updatedUsers,
                    currentUser: updatedUser
                  };
                });
                get().addNotification(updatedUser.id, `Welcome back, ${updatedUser.name}! You've successfully logged in with Microsoft.`);
                return updatedUser;
            } else {
                 throw new Error("Access Denied: Your Microsoft account does not match this portal's role.");
            }
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                 throw new Error("Login cancelled. Please try again.");
            }
            throw error;
        }
      },

      logout: async () => {
        const { auth } = initializeFirebase();
        await auth.signOut();
        set({ currentUser: null });
      },

      registerWithGoogle: async () => {
        const { auth } = initializeFirebase();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            if (!googleUser.email) {
                throw new Error("Could not retrieve email from Google account.");
            }

            // Check if user already exists
            const existingUser = get().users.find(u => u.email === googleUser.email);
            if (existingUser) {
                throw new Error("An account with this email already exists. Please login instead.");
            }

            // Create new user with Google account
            const newUser: User = {
                id: generateId(),
                name: googleUser.displayName || 'Google User',
                email: googleUser.email,
                password: '', // No password for OAuth users
                role: 'employee', // Default role, can be changed later
                subrole: null,
                department: '', // Will be filled in profile completion
                googleUid: googleUser.uid,
            };

            set(state => {
                const updatedUsers = [...state.users, newUser];
                void persistUsers(updatedUsers);
                return {
                    users: updatedUsers,
                    currentUser: newUser
                };
            });

            get().addNotification(newUser.id, `Welcome, ${newUser.name}! Your Google account has been registered successfully.`);
            return newUser;
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error("Registration cancelled. Please try again.");
            }
            if (error.code === 'auth/account-exists-with-different-credential') {
                throw new Error("An account already exists with this email using a different sign-in method.");
            }
            throw error;
        }
      },

      registerWithMicrosoft: async () => {
        const { auth } = initializeFirebase();
        const provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await signInWithPopup(auth, provider);
            const microsoftUser = result.user;

            if (!microsoftUser.email) {
                throw new Error("Could not retrieve email from Microsoft account.");
            }

            // Check if user already exists
            const existingUser = get().users.find(u => u.email === microsoftUser.email);
            if (existingUser) {
                throw new Error("An account with this email already exists. Please login instead.");
            }

            // Create new user with Microsoft account
            const newUser: User = {
                id: generateId(),
                name: microsoftUser.displayName || 'Microsoft User',
                email: microsoftUser.email,
                password: '', // No password for OAuth users
                role: 'employee', // Default role, can be changed later
                subrole: null,
                department: '', // Will be filled in profile completion
                microsoftUid: microsoftUser.uid,
            };

            set(state => {
                const updatedUsers = [...state.users, newUser];
                void persistUsers(updatedUsers);
                return {
                    users: updatedUsers,
                    currentUser: newUser
                };
            });

            get().addNotification(newUser.id, `Welcome, ${newUser.name}! Your Microsoft account has been registered successfully.`);
            return newUser;
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error("Registration cancelled. Please try again.");
            }
            if (error.code === 'auth/account-exists-with-different-credential') {
                throw new Error("An account already exists with this email using a different sign-in method.");
            }
            if (error.code === 'auth/operation-not-allowed') {
                throw new Error("Microsoft authentication is not enabled. Please contact support.");
            }
            throw error;
        }
      },
      
      addSubscriptionRequest: (request) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const hod = get().users.find(u => u.isHOD && u.department === request.department);
        if (!hod) {
            throw new Error(`HOD for department ${request.department} not found.`);
        }

        const newSubscription: Subscription = {
          ...request,
          id: generateId(),
          status: 'Pending',
          requestDate: formatISO(new Date()),
          requestedBy: currentUser.id,
          hodId: hod.id,
        };

        set((state) => {
          const updatedSubscriptions = [...state.subscriptions, newSubscription];
          void persistSubscriptions(updatedSubscriptions);
          return { subscriptions: updatedSubscriptions };
        });

        // Notify requester and HOD
        get().addNotification(currentUser.id, `Your request for ${request.toolName} has been submitted.`);
        get().addNotification(hod.id, `New subscription request for ${request.toolName} from ${currentUser.name}.`);
      },

      renewSubscription: (subscriptionId, renewalDuration, updatedCost, remarks, alertDays) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        set(state => {
            const updatedSubscriptions = state.subscriptions.map(sub => {
                if (sub.id === subscriptionId) {
                    const hod = get().users.find(u => u.isHOD && u.department === sub.department);
                    if (hod) {
                        get().addNotification(hod.id, `A renewal request for ${sub.toolName} from ${currentUser.name} is pending approval.`);
                    }
                    get().addNotification(currentUser.id, `Your renewal request for ${sub.toolName} has been submitted.`);
                    
                    return {
                        ...sub,
                        status: 'Pending',
                        duration: renewalDuration,
                        cost: updatedCost,
                        remarks,
                        alertDays,
                        requestDate: formatISO(new Date()),
                        renewedOn: formatISO(new Date()),
                        hodId: hod?.id, // Re-assign HOD for the new request
                        // Reset approval/payment info for the renewal cycle
                        approvedBy: undefined,
                        approvalDate: undefined,
                        paidBy: undefined,
                        paymentDate: undefined,
                        finance: undefined,
                    };
                }
                return sub;
            });
            void persistSubscriptions(updatedSubscriptions);
            return { subscriptions: updatedSubscriptions };
        });
      },
      
      updateSubscriptionStatus: (subscriptionId, status, reason) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        set((state) => {
          const updatedSubscriptions = state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              const requester = get().users.find(u => u.id === sub.requestedBy);
              
              if (status === 'Approved') {
                if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been approved by HOD.`);
                const financeUsers = get().users.filter(u => u.role === 'finance' && u.subrole === 'apa');
                financeUsers.forEach(fu => get().addNotification(fu.id, `Subscription for ${sub.toolName} is approved and awaiting APA verification.`));
                return { ...sub, status: 'Approved', approvedBy: currentUser.id, approvalDate: formatISO(new Date()), remarks: `HOD Note: ${reason}` };
              }
              if (status === 'Declined') {
                 if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been declined. Reason: ${reason}`);
                return { ...sub, status, remarks: reason, approvalDate: formatISO(new Date()), approvedBy: currentUser.id };
              }
              return { ...sub, status };
            }
            return sub;
          });
          void persistSubscriptions(updatedSubscriptions);
          return { subscriptions: updatedSubscriptions };
        });
      },

      forwardToAM: (subscriptionId, apaForwarderId) => {
        set(state => {
            const updatedSubscriptions = state.subscriptions.map(sub => {
                if (sub.id === subscriptionId) {
                    const amUsers = state.users.filter(u => u.role === 'finance' && u.subrole === 'am');
                    amUsers.forEach(am => {
                        get().addNotification(am.id, `Request for ${sub.toolName} has been forwarded to you for payment verification.`);
                    });
                    return { ...sub, status: 'ForwardedToAM', apaApproverId: apaForwarderId, finance: { ...sub.finance, apaQueueAddedAt: formatISO(new Date()) } };
                }
                return sub;
            });
            void persistSubscriptions(updatedSubscriptions);
            return { subscriptions: updatedSubscriptions };
        });
      },

      submitAMLog: (subscriptionId, amLogData) => {
         const currentUser = get().currentUser;
         if (!currentUser || currentUser.subrole !== 'am') return;

        set(state => {
            const updatedSubscriptions = state.subscriptions.map(sub => {
                 if (sub.id === subscriptionId) {
                    const apaUsers = state.users.filter(u => u.role === 'finance' && u.subrole === 'apa');
                    apaUsers.forEach(apa => {
                        get().addNotification(apa.id, `${currentUser.name} has submitted payment verification for ${sub.toolName}. It is now pending your execution.`);
                    });
                    return { ...sub, status: 'VerifiedByAM', finance: { ...sub.finance, amLog: { ...amLogData, by: currentUser.id, at: formatISO(new Date()), plannedDate: formatISO(amLogData.plannedDate) } } };
                 }
                 return sub;
            });
            void persistSubscriptions(updatedSubscriptions);
            return { subscriptions: updatedSubscriptions };
        });
      },
      
      markAsPaid: (subscriptionId, apaExecutorId, executionData) => {
        set((state) => {
          const updatedSubscriptions = state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
               const requester = get().users.find(u => u.id === sub.requestedBy);
               if(requester) get().addNotification(requester.id, `Payment for ${sub.toolName} has been completed. Your subscription is now active.`);
                
               const hod = get().users.find(u => u.id === sub.hodId);
               if (hod) get().addNotification(hod.id, `Subscription for ${sub.toolName} in your department has been paid and is now active.`);

              return {
                ...sub,
                status: 'PaymentCompleted',
                paidBy: apaExecutorId,
                paymentDate: formatISO(new Date()),
                expiryDate: formatISO(add(new Date(), { months: sub.duration })),
                finance: {
                  ...sub.finance,
                  apaExecution: {
                    ...executionData,
                    receiptUrl: 'dummy-url', // Placeholder for file upload
                    by: apaExecutorId,
                    at: formatISO(new Date()),
                  }
                },
                // Legacy fields for simpler history views
                paymentMode: executionData.paymentType,
                transactionId: executionData.transactionId,
                invoiceNumber: executionData.invoiceNumber,
              };
            }
            return sub;
          });
          void persistSubscriptions(updatedSubscriptions);
          return { subscriptions: updatedSubscriptions };
        });
      },

      addNotification: (userId, message) => {
        const newNotification: AppNotification = {
          id: generateId(),
          userId,
          message,
          isRead: false,
          createdAt: formatISO(new Date()),
        };
        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications];
          void persistNotifications(updatedNotifications);
          return { notifications: updatedNotifications };
        });
      },

      readNotification: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          void persistNotifications(updatedNotifications);
          return { notifications: updatedNotifications };
        });
      },

      triggerRenewalAlert: (subscriptionId) => {
        set(state => {
            const updatedSubscriptions = state.subscriptions.map(sub => {
                if (sub.id === subscriptionId) {
                    const todayStr = formatISO(new Date(), { representation: 'date' });
                    const lastTriggeredStr = sub.lastAlertTriggered ? formatISO(new Date(sub.lastAlertTriggered), { representation: 'date' }) : null;

                    if (lastTriggeredStr !== todayStr) {
                        return { ...sub, lastAlertTriggered: formatISO(new Date()) };
                    }
                }
                return sub;
            });
            void persistSubscriptions(updatedSubscriptions);
            return { subscriptions: updatedSubscriptions };
        });
      },

      updateSubscriptionDetails: (subscriptionId, updatedDetails) => {
        set((state) => {
            const updatedSubscriptions = state.subscriptions.map((sub) =>
                sub.id === subscriptionId ? { ...sub, ...updatedDetails } : sub
            );
            void persistSubscriptions(updatedSubscriptions);
            return { subscriptions: updatedSubscriptions };
        });
      },

      syncFromFirestore: async () => {
        const { isSyncing, hasFetchedFromFirestore } = get();
        if (isSyncing || hasFetchedFromFirestore) {
          return;
        }

        set({ isSyncing: true });

        const firestore = getFirestoreInstance();
        if (!firestore) {
          // If Firestore isn't available (e.g. missing/invalid config),
          // avoid permanently blocking the UI. Mark fetch as completed
          // so components depending on `isStoreReady` can proceed using
          // the local mock data.
          set({ isSyncing: false, hasFetchedFromFirestore: true });
          return;
        }

        try {
          const usersSnapshot = await getDocs(collection(firestore, COLLECTIONS.users));
          if (usersSnapshot.empty) {
            console.log('📦 Firestore is empty, seeding with mock data...');
            await seedFirestoreData(firestore);
          }

          console.log('🔄 Fetching data from Firestore...');
          const [users, subscriptions, notifications] = await Promise.all([
            fetchCollectionDocs<User>(COLLECTIONS.users),
            fetchCollectionDocs<Subscription>(COLLECTIONS.subscriptions),
            fetchCollectionDocs<AppNotification>(COLLECTIONS.notifications),
          ]);

          console.log('📊 Firestore data fetched:', {
            users: users.length,
            subscriptions: subscriptions.length,
            notifications: notifications.length
          });
          
          // Log user emails for debugging
          if (users.length > 0) {
            console.log('👥 Users in Firestore:', users.map(u => ({
              email: u.email,
              role: u.role,
              name: u.name
            })));
          }

          set({
            users: users.length ? users : mockUsers,
            subscriptions: subscriptions.length ? subscriptions : mockSubscriptions,
            notifications: notifications.length ? notifications : mockNotifications,
            isSyncing: false,
            hasFetchedFromFirestore: true,
          });
        } catch (error) {
          console.error('Failed to sync data from Firestore', error);
          // Allow the app to continue in local/mock mode if sync fails.
          set({ isSyncing: false, hasFetchedFromFirestore: true });
        }
      },
    }),
    {
      name: 'autotrack-pro-storage',
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistent auth across sessions
    }
  )
);

    