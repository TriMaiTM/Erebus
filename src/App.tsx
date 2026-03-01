import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { CreateWorkspacePage } from './features/workspaces/pages/CreateWorkspacePage'; // Import mới
import { AuthProvider } from './features/auth/components/AuthProvider';
import { AuthGuard } from './components/layouts/AuthGuard';
import { workspaceService } from './features/workspaces/api/workspaceService';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from './components/layouts/DashboardLayout'; // Import mới
import { BoardView } from './features/kanban/pages/BoardView';
import { MyIssuesPage } from './pages/MyIssuePage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Inbox } from './features/kanban/pages/Inbox';
import { WorkspaceGuard } from './components/layouts/WorkspaceGuard';
import { Map } from 'lucide-react';
import { JoinPage } from './pages/JoinPage';
import { CommandMenu } from './components/ui/CommandMenu'; // Import

// Component Dashboard giả lập để test
const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>
    <div className="grid grid-cols-3 gap-6">
      <div className="h-32 bg-surface border border-border rounded-lg p-6">
        <p className="text-gray-400 text-sm">Active Issues</p>
        <p className="text-3xl font-bold mt-2">12</p>
      </div>
      <div className="h-32 bg-surface border border-border rounded-lg p-6">
        <p className="text-gray-400 text-sm">Completed this week</p>
        <p className="text-3xl font-bold mt-2 text-green-500">24</p>
      </div>
    </div>
  </div>
);
// Component thông minh: Quyết định user đi đâu
const RootRedirect = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkWorkspace = async () => {
      try {
        const workspaces = await workspaceService.getWorkspaces();
        if (workspaces.length === 0) {
          // Chưa có -> Đi tạo
          navigate('/create-workspace');
        } else {
          // Có rồi -> Vào cái đầu tiên (Sau này sẽ lưu cái last visited vào local storage)
          navigate(`/workspace/${workspaces[0].id}`);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    };
    checkWorkspace();
  }, [navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );
};

// Placeholder cho Workspace Detail (sẽ làm ở Phase sau)
const WorkspaceDashboard = () => <div className="text-white p-10">Workspace Content Here</div>;

function App() {
  return (
    <BrowserRouter>
      <CommandMenu />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join/:workspaceId" element={<JoinPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
          <Route path="/create-workspace" element={<AuthGuard><CreateWorkspacePage /></AuthGuard>} />

          {/* QUAN TRỌNG: Lồng route vào DashboardLayout */}
          <Route path="/workspace/:workspaceId" element={
            <AuthGuard>
              <WorkspaceGuard>
                <DashboardLayout />
              </WorkspaceGuard>
            </AuthGuard>
          }>

            {/* Route con: index sẽ khớp với chính xác /workspace/:id */}
            <Route index element={<DashboardPage />} />
            <Route path="projects/:projectId/board" element={<BoardView />} />
            <Route path="projects/:projectId" element={<Navigate to="board" replace />} />

            {/* Sau này thêm các route khác vào đây */}
            <Route path="my-issues" element={<MyIssuesPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="inbox" element={<Inbox />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;