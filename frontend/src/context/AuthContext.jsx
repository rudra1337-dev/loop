import { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, login as loginThunk, signup as signupThunk, logout as logoutThunk, loginWithGoogle as googleLoginAction } from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const fetchMeSession = () => {
    dispatch(fetchMe());
  };

  useEffect(() => {
    fetchMeSession();
  }, [dispatch]);

  // Login
  const login = async (email, password) => {
    const resultAction = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Login failed');
    }
  };

  // SignUp
  const signup = async (payload) => {
    const resultAction = await dispatch(signupThunk(payload));
    if (signupThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Signup failed');
    }
  };

  // Logout
  const logout = async () => {
    const resultAction = await dispatch(logoutThunk());
    if (logoutThunk.fulfilled.match(resultAction)) {
      return null;
    } else {
      throw new Error(resultAction.payload || 'Logout failed');
    }
  };

  // Login with Google
  const loginWithGoogle = () => {
    dispatch(googleLoginAction());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, refetch: fetchMeSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);