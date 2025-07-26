import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isLoading: false,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  isLoading: true,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Axios instance with interceptors
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      if (state.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (state.tokens?.refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: state.tokens.refreshToken
            });

            const { tokens, user } = response.data;
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, tokens }
            });

            // Store tokens in localStorage
            localStorage.setItem('imageflow_tokens', JSON.stringify(tokens));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return api(originalRequest);

          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        } else {
          logout();
        }
      }

      return Promise.reject(error);
    }
  );

  // Load stored tokens and verify on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedTokens = localStorage.getItem('imageflow_tokens');
      
      if (storedTokens) {
        try {
          const tokens = JSON.parse(storedTokens);
          
          // Verify token with backend
          const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
          });

          const { user } = response.data;
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, tokens }
          });

        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('imageflow_tokens');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      const { user, tokens } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('imageflow_tokens', JSON.stringify(tokens));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens }
      });

      toast.success(`Welcome back, ${user.displayName}!`);
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { user, tokens } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('imageflow_tokens', JSON.stringify(tokens));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens }
      });

      toast.success(`Welcome to ImageFlow, ${user.displayName}!`);
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.tokens?.refreshToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refreshToken: state.tokens.refreshToken
        }, {
          headers: { Authorization: `Bearer ${state.tokens.accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('imageflow_tokens');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      const { user } = response.data;

      dispatch({ type: 'UPDATE_USER', payload: user });
      toast.success('Profile updated successfully');
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    // State
    ...state,
    
    // Functions
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    // API instance
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};