import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { api } from '../../lib/api';
import Avatar from '../common/Avatar';
import TrackRow from '../session/TrackRow';
import ChatPanel from '../session/ChatPanel';
import { useSessionStore } from '../../stores/sessionStore';

interface Invitation {
  id: string;
  projectName: string;
  inviterName: string;
}

function ProjectListSidebar({
  projects,
  selectedId,
  onSelect,
  onCreate,
}: {
  projects: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-ghost-border flex items-center justify-between">
        <span className="text-xs font-bold text-ghost-text-secondary uppercase tracking-wider">
          Projects
        </span>
        <button
          onClick={onCreate}
          className="w-6 h-6 flex items-center justify-center rounded bg-ghost-green/10 text-ghost-green text-sm font-bold hover:bg-ghost-green/20"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left px-3 py-2.5 text-sm border-b border-ghost-border/50 transition-colors ${
              selectedId === p.id
                ? 'bg-ghost-green/10 text-ghost-green font-semibold'
                : 'text-ghost-text-secondary hover:bg-ghost-surface-light'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollaboratorPanel({ members }: { members: { userId: string; displayName: string; role: string; avatarUrl?: string | null }[] }) {
  return (
    <div className="border-t border-ghost-border">
      <div className="p-3 border-b border-ghost-border">
        <span className="text-xs font-bold text-ghost-text-secondary uppercase tracking-wider">
          Collaborators
        </span>
      </div>
      <div className="p-2 space-y-1">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-ghost-surface-light">
            <Avatar name={m.displayName} src={m.avatarUrl} size="sm" colour={m.role === 'owner' ? '#FFD700' : '#00FFC8'} />
            <span className="text-xs text-ghost-text-primary flex-1 truncate">{m.displayName}</span>
            {m.role === 'owner' && (
              <span className="text-[8px] font-bold text-ghost-host-gold bg-ghost-host-gold/10 px-1.5 py-0.5 rounded">HOST</span>
            )}
            <span className="w-2 h-2 rounded-full bg-ghost-green" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPopup({ user, onSignOut, onClose }: { user: any; onSignOut: () => void; onClose: () => void }) {
  return (
    <div className="absolute right-2 top-12 w-52 bg-ghost-surface border border-ghost-border rounded-lg shadow-xl z-50 p-3">
      <div className="text-[10px] font-bold text-ghost-text-secondary uppercase tracking-wider mb-2">Account</div>
      <div className="border-t border-ghost-border pt-2 mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={user?.displayName || '?'} size="md" colour="#00FFC8" />
          <div>
            <p className="text-sm font-bold text-ghost-text-primary">{user?.displayName || 'Unknown'}</p>
            <p className="text-[10px] text-ghost-text-muted">{user?.email || ''}</p>
          </div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="w-full px-3 py-2 text-xs font-semibold bg-ghost-surface-light border border-ghost-border rounded text-ghost-text-secondary hover:text-ghost-error-red hover:border-ghost-error-red transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

function NotificationPopup({ invitations, onAccept, onDecline }: { invitations: Invitation[]; onAccept: (id: string) => void; onDecline: (id: string) => void }) {
  return (
    <div className="absolute right-14 top-12 w-72 bg-ghost-surface border border-ghost-border rounded-lg shadow-xl z-50">
      <div className="p-3 border-b border-ghost-border">
        <span className="text-[10px] font-bold text-ghost-text-secondary uppercase tracking-wider">Invitations</span>
      </div>
      {invitations.length === 0 ? (
        <div className="p-4 text-center text-xs text-ghost-text-muted italic">No pending invitations</div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {invitations.map((inv) => (
            <div key={inv.id} className="p-3 border-b border-ghost-border/50">
              <p className="text-xs font-bold text-ghost-green">{inv.inviterName}</p>
              <p className="text-[10px] text-ghost-text-muted mt-0.5">invited you to <span className="text-ghost-text-secondary">{inv.projectName}</span></p>
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => onAccept(inv.id)} className="px-3 py-1 text-[10px] font-semibold bg-ghost-green/10 text-ghost-green border border-ghost-green/30 rounded hover:bg-ghost-green/20">Accept</button>
                <button onClick={() => onDecline(inv.id)} className="px-2 py-1 text-[10px] font-semibold text-ghost-text-muted hover:text-ghost-error-red">X</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BellIcon({ count }: { count: number }) {
  return (
    <div className="relative">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}

function InviteModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  if (!open) return null;

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      await api.inviteMember(projectId, email.trim());
      setStatus('Invited!');
      setEmail('');
      setTimeout(() => { setStatus(''); onClose(); }, 1000);
    } catch (err: any) {
      setStatus(err.message || 'Invite failed');
    }
  };

  return (
    <div className="absolute right-2 top-12 w-72 bg-ghost-surface border border-ghost-border rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-ghost-text-secondary uppercase tracking-wider">Invite Collaborator</span>
        <button onClick={onClose} className="text-ghost-text-muted hover:text-ghost-text-primary text-sm">X</button>
      </div>
      <input
        className="ghost-input w-full text-sm mb-2"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
      />
      <button onClick={handleInvite} className="w-full px-3 py-2 text-xs font-semibold bg-ghost-purple text-white rounded hover:bg-ghost-purple/80">
        Send Invite
      </button>
      {status && <p className={`text-xs mt-2 ${status === 'Invited!' ? 'text-ghost-green' : 'text-ghost-error-red'}`}>{status}</p>}
    </div>
  );
}

export default function PluginLayout() {
  const { user, logout } = useAuthStore();
  const { projects, currentProject, fetchProjects, fetchProject, createProject, addTrack, updateTrack, deleteTrack } = useProjectStore();
  const { join, leave } = useSessionStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      selectProject(projects[0].id);
    }
  }, [projects]);

  const selectProject = (id: string) => {
    if (selectedProjectId) leave();
    setSelectedProjectId(id);
    fetchProject(id);
    join(id);
  };

  const handleCreate = async () => {
    const p = await createProject({ name: 'New Project', tempo: 140, key: 'C' });
    await fetchProjects();
    selectProject(p.id);
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') + '/invitations',
        { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } }
      );
      const json = await res.json();
      if (json.data) setInvitations(json.data);
    } catch {}
  };

  const acceptInvite = async (id: string) => {
    try {
      await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') + `/invitations/${id}/accept`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token}` }, body: '{}' }
      );
      fetchInvitations();
      fetchProjects();
    } catch {}
  };

  const declineInvite = async (id: string) => {
    try {
      await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') + `/invitations/${id}/decline`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token}` }, body: '{}' }
      );
      fetchInvitations();
    } catch {}
  };

  const members = currentProject?.members || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ghost-bg relative">
      {/* Left sidebar: project list + collaborators */}
      <div className="w-[200px] shrink-0 bg-ghost-surface border-r border-ghost-border flex flex-col">
        <div className="flex-1 min-h-0">
          <ProjectListSidebar
            projects={projects}
            selectedId={selectedProjectId}
            onSelect={selectProject}
            onCreate={handleCreate}
          />
        </div>
        <div className="h-[200px] shrink-0 overflow-y-auto">
          <CollaboratorPanel members={members as any} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="h-11 bg-ghost-surface border-b border-ghost-border flex items-center px-4 shrink-0">
          {currentProject ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="text-sm font-bold text-ghost-text-primary truncate">{currentProject.name}</h2>
              <span className="text-xs text-ghost-text-muted">
                {currentProject.tempo} BPM | {currentProject.key}
              </span>
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="ml-auto mr-20 px-3 py-1 text-[10px] font-semibold bg-ghost-purple/10 text-ghost-purple border border-ghost-purple/30 rounded hover:bg-ghost-purple/20"
              >
                + Invite
              </button>
            </div>
          ) : (
            <span className="text-sm text-ghost-text-muted italic">Select a project</span>
          )}

          {/* Bell icon */}
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowSettings(false); }}
            className="text-ghost-text-secondary hover:text-ghost-purple transition-colors mr-2"
          >
            <BellIcon count={invitations.length} />
          </button>

          {/* Settings gear */}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowNotifs(false); }}
            className="text-ghost-text-secondary hover:text-ghost-purple transition-colors text-lg"
          >
            ⚙
          </button>
        </div>

        {/* Popups */}
        {showSettings && (
          <SettingsPopup
            user={user}
            onSignOut={() => { setShowSettings(false); logout(); }}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showNotifs && (
          <NotificationPopup
            invitations={invitations}
            onAccept={(id) => { acceptInvite(id); }}
            onDecline={(id) => { declineInvite(id); }}
          />
        )}
        {showInvite && selectedProjectId && (
          <InviteModal open={showInvite} onClose={() => setShowInvite(false)} projectId={selectedProjectId} />
        )}

        {/* Project content */}
        <div className="flex-1 flex min-h-0">
          {currentProject ? (
            <>
              {/* Stems area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {currentProject.tracks.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-ghost-text-muted text-sm italic">
                    Drop audio files here or add a track
                  </div>
                ) : (
                  currentProject.tracks.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t as any}
                      onMute={(tid, m) => updateTrack(selectedProjectId!, tid, { muted: m })}
                      onSolo={(tid, s) => updateTrack(selectedProjectId!, tid, { soloed: s })}
                      onDelete={(tid) => deleteTrack(selectedProjectId!, tid)}
                    />
                  ))
                )}
              </div>

              {/* Right chat panel */}
              <div className="w-56 shrink-0 border-l border-ghost-border">
                <ChatPanel />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ghost-text-muted text-sm italic">
              Select a project or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
