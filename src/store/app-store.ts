
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Subscription, AppNotification, Role, SubRole, SubscriptionStatus } from '@/lib/types';
import { mockUsers, mockSubscriptions, mockNotifications } from '@/lib/data';
import { add, formatISO } from 'date-fns';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

interface AppState {
  users: User[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  currentUser: User | null;
  register: (user: Omit<User, 'id' | 'subrole' | 'googleUid'>) => void;
  login: (email: string, password: string, role: Role, subrole?: SubRole) => User | null;
  loginWithGoogle: (role: Role, subrole?: SubRole) => Promise<User | null>;
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
}

const generateId = () => `id-${new Date().getTime()}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      subscriptions: mockSubscriptions,
      notifications: mockNotifications,
      currentUser: null,

      register: (userData) => {
        const { users } = get();
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('An account with this email already exists.');
        }

        const newUser: User = {
          ...userData,
          id: generateId(),
          subrole: null, // Subrole can be assigned later if needed
        };

        set(state => ({
          users: [...state.users, newUser],
        }));
      },

      login: (email, password, role, subrole = null) => {
        const user = get().users.find(
          (u) =>
            u.email === email &&
            u.password === password &&
            u.role === role &&
            (role !== 'finance' || u.subrole === subrole)
        );

        if (user) {
          set({ currentUser: user });
          get().addNotification(user.id, `Welcome back, ${user.name}! You've successfully logged in.`);
          return user;
        }
        throw new Error("Invalid credentials or wrong portal.");
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
                 set(state => ({
                    users: state.users.map(u => u.id === appUser.id ? updatedUser : u),
                    currentUser: updatedUser
                }));
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

      logout: async () => {
        const { auth } = initializeFirebase();
        await auth.signOut();
        set({ currentUser: null });
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

        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));

        // Notify requester and HOD
        get().addNotification(currentUser.id, `Your request for ${request.toolName} has been submitted.`);
        get().addNotification(hod.id, `New subscription request for ${request.toolName} from ${currentUser.name}.`);
      },

      renewSubscription: (subscriptionId, renewalDuration, updatedCost, remarks, alertDays) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        set(state => ({
            subscriptions: state.subscriptions.map(sub => {
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
            })
        }));
      },
      
      updateSubscriptionStatus: (subscriptionId, status, reason) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
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
          }),
        }));
      },

      forwardToAM: (subscriptionId, apaForwarderId) => {
        set(state => ({
            subscriptions: state.subscriptions.map(sub => {
                if (sub.id === subscriptionId) {
                    const amUsers = state.users.filter(u => u.role === 'finance' && u.subrole === 'am');
                    amUsers.forEach(am => {
                        get().addNotification(am.id, `Request for ${sub.toolName} has been forwarded to you for payment verification.`);
                    });
                    return { ...sub, status: 'ForwardedToAM', apaApproverId: apaForwarderId, finance: { ...sub.finance, apaQueueAddedAt: formatISO(new Date()) } };
                }
                return sub;
            })
        }));
      },

      submitAMLog: (subscriptionId, amLogData) => {
         const currentUser = get().currentUser;
         if (!currentUser || currentUser.subrole !== 'am') return;

         set(state => ({
             subscriptions: state.subscriptions.map(sub => {
                 if (sub.id === subscriptionId) {
                    const apaUsers = state.users.filter(u => u.role === 'finance' && u.subrole === 'apa');
                    apaUsers.forEach(apa => {
                        get().addNotification(apa.id, `${currentUser.name} has submitted payment verification for ${sub.toolName}. It is now pending your execution.`);
                    });
                    return { ...sub, status: 'VerifiedByAM', finance: { ...sub.finance, amLog: { ...amLogData, by: currentUser.id, at: formatISO(new Date()), plannedDate: formatISO(amLogData.plannedDate) } } };
                 }
                 return sub;
             })
         }));
      },
      
      markAsPaid: (subscriptionId, apaExecutorId, executionData) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
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
          }),
        }));
      },

      addNotification: (userId, message) => {
        const newNotification: AppNotification = {
          id: generateId(),
          userId,
          message,
          isRead: false,
          createdAt: formatISO(new Date()),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      readNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }));
      },

      triggerRenewalAlert: (subscriptionId) => {
        set(state => ({
            subscriptions: state.subscriptions.map(sub => {
                if (sub.id === subscriptionId) {
                    const todayStr = formatISO(new Date(), { representation: 'date' });
                    const lastTriggeredStr = sub.lastAlertTriggered ? formatISO(new Date(sub.lastAlertTriggered), { representation: 'date' }) : null;

                    if (lastTriggeredStr !== todayStr) {
                        return { ...sub, lastAlertTriggered: formatISO(new Date()) };
                    }
                }
                return sub;
            })
        }));
      },

      updateSubscriptionDetails: (subscriptionId, updatedDetails) => {
        set((state) => ({
            subscriptions: state.subscriptions.map((sub) =>
                sub.id === subscriptionId ? { ...sub, ...updatedDetails } : sub
            ),
        }));
      },
    }),
    {
      name: 'autotrack-pro-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for this prototype
    }
  )
);

    