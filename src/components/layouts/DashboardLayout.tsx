import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-background text-text-primary">
            {/* Sidebar cố định bên trái */}
            <Sidebar />

            {/* Main Content Area - Padding bên trái bằng width của sidebar (240px) */}
            <main className="pl-[240px] min-h-screen">
                <div className="max-w-[1600px] mx-auto p-8">
                    {/* <Outlet /> là nơi các route con (Dashboard, IssueList...) sẽ hiển thị */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
