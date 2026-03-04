import { GoogleLogin } from '@react-oauth/google';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    onLogin: (token: string, user: any) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('--- CLIENT DEBUG: Auth Result ---');
                console.log('Backend response OK. User authenticated:', data.user?.email);

                onLogin(data.token, data.user);
            } else {
                console.error('--- CLIENT DEBUG: Auth Failed ---');
                console.error('Backend returned error:', data.error);
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="bg-indigo-600/10 p-6 rounded-3xl mb-8 border border-indigo-500/20 shadow-2xl">
                <LogIn className="w-16 h-16 text-indigo-400 mb-4 mx-auto" />
                <h2 className="text-3xl font-extrabold text-white mb-2">Welcome to NAMIR</h2>
                <p className="text-neutral-400 max-w-sm">
                    Please sign in with your Google account to access your library.
                </p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => setError('Google Sign-In failed')}
                        theme="filled_black"
                        shape="pill"
                        useOneTap
                    />
                </div>
            </div>

            {isLoading && (
                <p className="mt-4 text-neutral-500 animate-pulse text-sm">Verifying account...</p>
            )}

            {error && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <p className="mt-12 text-xs text-neutral-600 font-mono">
                Authorized access only. Whitelist system active.
            </p>
        </div>
    );
};
