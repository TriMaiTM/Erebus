interface Props {
    users: any[];
}

export const UserAvatars = ({ users }: Props) => {
    // Chỉ hiển thị tối đa 4 người, còn lại hiện số +N
    const uniqueUsers = users.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
    );

    const displayUsers = uniqueUsers.slice(0, 4);
    const remaining = uniqueUsers.length - 4;
    return (
        <div className="flex items-center gap-1 mr-4">
            {displayUsers.map((u) => (
                <div
                    key={u.id || Math.random()}
                    className="relative group cursor-pointer"
                    title={u.full_name} // Hover vào thấy tên
                >
                    <img
                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=random`}
                        alt={u.full_name}
                        className="w-8 h-8 rounded-full border-2 border-[#0F1117] object-cover "
                    />
                    {/* Chấm xanh online */}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-[#0F1117] bg-green-400" />

                    {/* Tooltip tên */}
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {u.full_name}
                    </div>
                </div>
            ))}

            {remaining > 0 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#0F1117] bg-gray-700 text-xs font-medium text-white">
                    +{remaining}
                </div>
            )}
        </div>
    );
};