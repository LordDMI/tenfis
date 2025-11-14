import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/utils/supabaseClient';
import { useRouter, usePathname } from 'expo-router';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [booting, setBooting] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const hasNavigated = useRef(false);

    // Publicly accessible screens - check multiple pathname formats
    const isPublicRoute = (path: string) => {
        const publicPaths = [
            '/Screens/login',
            '/Screens/signup',
            '/Screens/patient/ptsignup',
            '/Screens/psychologue/psysignup',
            '/(root)/Screens/login',
            '/(root)/Screens/signup',
            '/(root)/Screens/patient/ptsignup',
            '/(root)/Screens/psychologue/psysignup',
        ];
        return publicPaths.some(p => path.includes(p) || path.endsWith(p));
    };

    // Authenticated routes that users can access
    const isAuthenticatedRoute = (path: string) => {
        const authRoutes = [
            'feed',
            'search',
            'appointments',
            'chat',
            'rating',
            'profile',
            'admin',
            'admin-dashboard',
            'Mainpt',
            'Mainps',
        ];
        return authRoutes.some(route => path.includes(route));
    };

    const handleRouting = useCallback(async () => {
        let isHandling = false;

        // Prevent concurrent executions
        if (isHandling) return;
        isHandling = true;

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                setBooting(false);
                isHandling = false;
                return;
            }

            // No session → allow public pages, redirect others
            if (!session) {
                if (!isPublicRoute(pathname)) {
                    if (!hasNavigated.current) {
                        hasNavigated.current = true;
                        router.replace('/(root)/Screens/login');
                    }
                }
                setBooting(false);
                isHandling = false;
                return;
            }

            // Session exists → fetch role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            // User is authenticated - allow access to authenticated routes
            const currentPath = pathname || '';
            
            // If user is on an authenticated route, allow it
            if (isAuthenticatedRoute(currentPath)) {
                setBooting(false);
                isHandling = false;
                return;
            }

            // If profile doesn't exist or has no role, redirect to default
            if (profileError || !profile?.role) {
                if (!hasNavigated.current) {
                    hasNavigated.current = true;
                    router.replace('/(root)/Screens/patient/Mainpt');
                }
            } else {
                // Redirect based on role only if not on an authenticated route
                let targetPath = '/(root)/Screens/patient/Mainpt';
                
                if (profile.role === 'admin') {
                    targetPath = '/(root)/Screens/admin-dashboard';
                } else if (profile.role === 'psychologue') {
                    targetPath = '/(root)/Screens/psychologue/Mainps';
                }
                
                // Only redirect if not already on a valid authenticated route
                if (!isAuthenticatedRoute(currentPath) && !hasNavigated.current) {
                    hasNavigated.current = true;
                    router.replace(targetPath);
                }
            }

            setBooting(false);
        } catch (error) {
            console.error('Routing error:', error);
            setBooting(false);
        } finally {
            isHandling = false;
        }
    }, [pathname, router]);

    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout;

        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
            if (mounted && booting) {
                console.warn('Routing timeout, allowing access');
                setBooting(false);
            }
        }, 3000);

        // Reset navigation flag when pathname changes (navigation completed)
        hasNavigated.current = false;
        handleRouting();

        // Listen to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
                hasNavigated.current = false;
                handleRouting();
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [pathname, handleRouting, booting]);

    if (booting) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
}
