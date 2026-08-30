import { useDispatch, useSelector } from 'react-redux';
import { selectUser, selectAuthLoading, selectAuthError } from './selectors/authSelectors';
import { fetchMe, login as loginThunk, signup as signupThunk, logout as logoutThunk, loginWithGoogle as googleLoginAction, clearError } from './slices/authSlice';
import {
  fetchWorkspaceData,
  renameWorkspaceThunk,
  updateMemberRoleThunk,
  removeMemberThunk,
  createInviteThunk,
  revokeInviteThunk,
  clearWorkspaceError,
  clearRenameSuccess
} from './slices/workspaceSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const fetchMeSession = () => {
    dispatch(fetchMe());
  };

  const login = async (email, password) => {
    const resultAction = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Login failed');
    }
  };

  const signup = async (payload) => {
    const resultAction = await dispatch(signupThunk(payload));
    if (signupThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Signup failed');
    }
  };

  const logout = async () => {
    const resultAction = await dispatch(logoutThunk());
    if (logoutThunk.fulfilled.match(resultAction)) {
      return null;
    } else {
      throw new Error(resultAction.payload || 'Logout failed');
    }
  };

  const loginWithGoogle = () => {
    dispatch(googleLoginAction());
  };

  const resetError = () => {
    dispatch(clearError());
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    loginWithGoogle,
    refetch: fetchMeSession,
    clearError: resetError
  };
};

export const useWorkspace = () => {
  const dispatch = useDispatch();

  const workspaceState = useSelector((state) => state.workspace);
  const { workspace, members, invites, loading, error, renameSuccess } = workspaceState;

  const loadWorkspace = () => {
    dispatch(fetchWorkspaceData());
  };

  const rename = async (name) => {
    const resultAction = await dispatch(renameWorkspaceThunk(name));
    if (renameWorkspaceThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to rename workspace');
    }
  };

  const updateRole = async (userId, role) => {
    const resultAction = await dispatch(updateMemberRoleThunk({ userId, role }));
    if (updateMemberRoleThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to update member role');
    }
  };

  const removeMember = async (userId) => {
    const resultAction = await dispatch(removeMemberThunk(userId));
    if (removeMemberThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to remove member');
    }
  };

  const createInvite = async (role) => {
    const resultAction = await dispatch(createInviteThunk(role));
    if (createInviteThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to generate invite');
    }
  };

  const revokeInvite = async (inviteId) => {
    const resultAction = await dispatch(revokeInviteThunk(inviteId));
    if (revokeInviteThunk.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to revoke invite');
    }
  };

  const resetError = () => {
    dispatch(clearWorkspaceError());
  };

  const resetRenameSuccess = () => {
    dispatch(clearRenameSuccess());
  };

  return {
    workspace,
    members,
    invites,
    loading,
    error,
    renameSuccess,
    loadWorkspace,
    rename,
    updateRole,
    removeMember,
    createInvite,
    revokeInvite,
    clearError: resetError,
    clearRenameSuccess: resetRenameSuccess,
  };
};
