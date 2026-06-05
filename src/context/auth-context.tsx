'use client';

import { createClient } from '@/lib/supabase';
import type { User, Business } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface AuthState {
  user: User | null;
  business: Business | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchUser = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setUser(data as User);
      return data as User;
    }
    return null;
  }, [supabase]);

  const fetchBusiness = useCallback(async (userId: string) => {
    const { data: ownedBiz } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (ownedBiz) {
      setBusiness(ownedBiz as Business);
      return;
    }

    const { data: staffOrders } = await supabase
      .from('orders')
      .select('business_id')
      .eq('staff_id', userId)
      .limit(1);

    if (staffOrders && staffOrders.length > 0) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', staffOrders[0].business_id)
        .maybeSingle();
      if (biz) { setBusiness(biz as Business); return; }
    }

    const { data: sb } = await supabase
      .from('staff_business')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1);

    if (sb && sb.length > 0) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', sb[0].business_id)
        .maybeSingle();
      if (biz) { setBusiness(biz as Business); return; }
    }

    const { data: clientOrders } = await supabase
      .from('orders')
      .select('business_id')
      .eq('client_id', userId)
      .limit(1);

    if (clientOrders && clientOrders.length > 0) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', clientOrders[0].business_id)
        .maybeSingle();
      if (biz) setBusiness(biz as Business);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUser(session.user.id);
        if (profile) await fetchBusiness(profile.id);
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user: { id: string } } | null) => {
        if (session?.user) {
          const profile = await fetchUser(session.user.id);
          if (profile) await fetchBusiness(profile.id);
        } else {
          setUser(null);
          setBusiness(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUser, fetchBusiness]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBusiness(null);
    router.push('/');
  }, [supabase, router]);

  const refreshBusiness = useCallback(async () => {
    if (user) await fetchBusiness(user.id);
  }, [user, fetchBusiness]);

  const refreshUser = useCallback(async () => {
    if (user) await fetchUser(user.id);
  }, [user, fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, business, loading, signOut, refreshBusiness, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
