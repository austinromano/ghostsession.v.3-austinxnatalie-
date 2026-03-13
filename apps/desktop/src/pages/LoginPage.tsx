import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isPlugin } from '../lib/hostContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const { login, register, loading, error } = useAuthStore();
  const navigate = isPlugin ? undefined : useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await register(email, password, displayName);
    } else {
      await login(email, password);
    }
    if (useAuthStore.getState().isAuthenticated && navigate) navigate('/projects');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ghost-bg">
      <div className="ghost-card p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-ghost-green">Ghost</span> Session
          </h1>
          <p className="text-sm text-ghost-text-muted mt-1">{isRegister ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <Input
              label="Producer Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your producer name"
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'Min 8 characters' : 'Enter password'}
            required
          />

          {error && (
            <p className="text-sm text-ghost-error-red">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isRegister ? 'Creating...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <p className="text-center text-sm text-ghost-text-muted mt-6">
          {isRegister ? 'Already have an account? ' : 'No account? '}
          {isPlugin ? (
            <button onClick={() => setIsRegister(!isRegister)} className="text-ghost-green hover:underline">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          ) : (
            <Link to={isRegister ? '/login' : '/register'} className="text-ghost-green hover:underline">
              {isRegister ? 'Sign In' : 'Register'}
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
