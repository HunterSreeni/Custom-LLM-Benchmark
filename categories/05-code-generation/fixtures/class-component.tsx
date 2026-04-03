import React, { Component, createRef } from 'react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  lastActive: string;
}

interface ProfileEditorProps {
  userId: string;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
  apiBaseUrl: string;
}

interface ProfileEditorState {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
  autoSaveTimer: NodeJS.Timeout | null;
}

class ProfileEditor extends Component<ProfileEditorProps, ProfileEditorState> {
  private nameInputRef = createRef<HTMLInputElement>();
  private abortController: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private containerRef = createRef<HTMLDivElement>();

  state: ProfileEditorState = {
    profile: null,
    isLoading: true,
    isSaving: false,
    error: null,
    isDirty: false,
    autoSaveTimer: null,
  };

  componentDidMount() {
    this.fetchProfile();
    this.nameInputRef.current?.focus();

    window.addEventListener('beforeunload', this.handleBeforeUnload);

    if (this.containerRef.current) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          console.log('Container resized:', entry.contentRect.width);
        }
      });
      this.resizeObserver.observe(this.containerRef.current);
    }
  }

  componentDidUpdate(prevProps: ProfileEditorProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchProfile();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.state.autoSaveTimer) {
      clearTimeout(this.state.autoSaveTimer);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (this.state.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  async fetchProfile() {
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.setState({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `${this.props.apiBaseUrl}/users/${this.props.userId}`,
        { signal: this.abortController.signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const profile = await res.json();
      this.setState({ profile, isLoading: false });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.setState({ error: err.message, isLoading: false });
      }
    }
  }

  handleFieldChange = (field: keyof UserProfile, value: string) => {
    this.setState((prev) => {
      if (!prev.profile) return null;

      if (prev.autoSaveTimer) {
        clearTimeout(prev.autoSaveTimer);
      }

      const autoSaveTimer = setTimeout(() => {
        this.handleAutoSave();
      }, 5000);

      return {
        profile: { ...prev.profile, [field]: value },
        isDirty: true,
        autoSaveTimer,
      };
    });
  };

  handleAutoSave = async () => {
    if (!this.state.profile || !this.state.isDirty) return;
    await this.saveProfile(this.state.profile);
  };

  saveProfile = async (profile: UserProfile) => {
    this.setState({ isSaving: true, error: null });
    try {
      const res = await fetch(
        `${this.props.apiBaseUrl}/users/${this.props.userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      this.setState({ profile: saved, isSaving: false, isDirty: false });
      this.props.onSave(saved);
    } catch (err: any) {
      this.setState({ error: err.message, isSaving: false });
    }
  };

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (this.state.profile) {
      this.saveProfile(this.state.profile);
    }
  };

  render() {
    const { profile, isLoading, isSaving, error, isDirty } = this.state;

    if (isLoading) {
      return <div className="animate-pulse p-4">Loading profile...</div>;
    }

    if (error && !profile) {
      return <div className="text-red-500 p-4">Error: {error}</div>;
    }

    if (!profile) return null;

    return (
      <div ref={this.containerRef} className="max-w-2xl mx-auto p-6">
        <form onSubmit={this.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              ref={this.nameInputRef}
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => this.handleFieldChange('name', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => this.handleFieldChange('email', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => this.handleFieldChange('bio', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={this.props.onCancel}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>

          {isDirty && (
            <p className="text-yellow-600 text-sm mt-2">
              You have unsaved changes
            </p>
          )}
        </form>
      </div>
    );
  }
}

export default ProfileEditor;
