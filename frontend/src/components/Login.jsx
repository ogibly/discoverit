import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateForm, FIELD_VALIDATIONS } from '../utils/validation';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { login } = useAuth();

  // Clear field error when user starts typing
  const handleUsernameChange = (value) => {
    setUsername(value);
    if (formErrors.username) {
      setFormErrors({ ...formErrors, username: null });
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (formErrors.password) {
      setFormErrors({ ...formErrors, password: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const loginValidations = {
      username: FIELD_VALIDATIONS.username,
      password: [FIELD_VALIDATIONS.required]
    };
    
    const { isValid, errors } = validateForm({ username, password }, loginValidations);
    setFormErrors(errors);
    
    if (!isValid) {
      setError('Please fix the validation errors before submitting.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Sophisticated Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">DiscoverIT</h1>
          <p className="text-muted-foreground">Network Scanning & Asset Management</p>
        </div>

        {/* Elegant Login Form */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${formErrors.username ? 'border-red-500' : 'border-border'}`}
                placeholder="Enter your username"
              />
              {formErrors.username && (
                <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${formErrors.password ? 'border-red-500' : 'border-border'}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 text-center">
          <div className="bg-muted/30 border border-border rounded-md p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Demo Credentials</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>User:</strong> user / user</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;