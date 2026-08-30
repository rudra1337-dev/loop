import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as workspaceService from '../../services/workspaceService';

export const fetchWorkspaceData = createAsyncThunk(
  'workspace/fetchWorkspaceData',
  async (_, { rejectWithValue }) => {
    try {
      const [workspaceRes, membersRes, invitesRes] = await Promise.all([
        workspaceService.getWorkspace(),
        workspaceService.getMembers(),
        workspaceService.listInvites(),
      ]);
      return {
        workspace: workspaceRes.data.workspace,
        members: membersRes.data.members,
        invites: invitesRes.data.invites,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load workspace data');
    }
  }
);

export const renameWorkspaceThunk = createAsyncThunk(
  'workspace/rename',
  async (name, { dispatch, rejectWithValue }) => {
    try {
      const res = await workspaceService.renameWorkspace(name);
      // Re-fetch workspace data after rename
      await dispatch(fetchWorkspaceData());
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to rename workspace');
    }
  }
);

export const updateMemberRoleThunk = createAsyncThunk(
  'workspace/updateMemberRole',
  async ({ userId, role }, { dispatch, rejectWithValue }) => {
    try {
      await workspaceService.updateMemberRole(userId, role);
      await dispatch(fetchWorkspaceData());
      return { userId, role };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update member role');
    }
  }
);

export const removeMemberThunk = createAsyncThunk(
  'workspace/removeMember',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      await workspaceService.removeMember(userId);
      await dispatch(fetchWorkspaceData());
      return userId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to remove member');
    }
  }
);

export const createInviteThunk = createAsyncThunk(
  'workspace/createInvite',
  async (role, { dispatch, rejectWithValue }) => {
    try {
      await workspaceService.createInvite(role);
      await dispatch(fetchWorkspaceData());
      return role;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to generate invite');
    }
  }
);

export const revokeInviteThunk = createAsyncThunk(
  'workspace/revokeInvite',
  async (inviteId, { dispatch, rejectWithValue }) => {
    try {
      await workspaceService.revokeInvite(inviteId);
      await dispatch(fetchWorkspaceData());
      return inviteId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to revoke invite');
    }
  }
);

const initialState = {
  workspace: null,
  members: [],
  invites: [],
  loading: false,
  error: null,
  renameSuccess: false,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    clearWorkspaceError: (state) => {
      state.error = null;
    },
    clearRenameSuccess: (state) => {
      state.renameSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkspaceData
      .addCase(fetchWorkspaceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceData.fulfilled, (state, action) => {
        state.workspace = action.payload.workspace;
        state.members = action.payload.members;
        state.invites = action.payload.invites;
        state.loading = false;
      })
      .addCase(fetchWorkspaceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // renameWorkspaceThunk
      .addCase(renameWorkspaceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.renameSuccess = false;
      })
      .addCase(renameWorkspaceThunk.fulfilled, (state) => {
        state.loading = false;
        state.renameSuccess = true;
      })
      .addCase(renameWorkspaceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.renameSuccess = false;
      })

      // updateMemberRoleThunk
      .addCase(updateMemberRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMemberRoleThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateMemberRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // removeMemberThunk
      .addCase(removeMemberThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeMemberThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createInviteThunk
      .addCase(createInviteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInviteThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createInviteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // revokeInviteThunk
      .addCase(revokeInviteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(revokeInviteThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(revokeInviteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWorkspaceError, clearRenameSuccess } = workspaceSlice.actions;
export default workspaceSlice.reducer;
