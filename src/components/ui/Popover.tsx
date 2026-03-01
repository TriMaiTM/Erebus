import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
    trigger: ReactNode;
    content: ReactNode;
    align?: 'left' | 'right';
}

export const Popover = ({ trigger, content, align = 'left' }: PopoverProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Tính toán vị trí khi mở menu
    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 8, // Cách nút bấm 8px xuống dưới
                left: align === 'left'
                    ? rect.left + window.scrollX
                    : rect.right + window.scrollX - 240 // Nếu align right thì trừ đi width dự kiến
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Lắng nghe scroll hoặc resize để đóng hoặc cập nhật vị trí (tạm thời đóng cho đơn giản)
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, { capture: true });
            window.addEventListener('resize', handleScroll);

            return () => {
                window.removeEventListener('scroll', handleScroll, { capture: true });
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen]);

    // Xử lý click ra ngoài để đóng
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check nếu click vào trigger thì thôi (để sự kiện onClick của trigger xử lý)
            if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                return;
            }
            // Check nếu click vào nội dung popover (đang nằm ở portal)
            const popoverContent = document.getElementById('popover-portal-content');
            if (popoverContent && !popoverContent.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            {/* Nút bấm (Trigger) */}
            <div
                ref={triggerRef}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isOpen) updatePosition();
                    setIsOpen(!isOpen);
                }}
                className="cursor-pointer inline-block w-full"
            >
                {trigger}
            </div>

            {/* Nội dung Popover (Đưa ra ngoài bằng Portal) */}
            {isOpen && createPortal(
                <div
                    id="popover-portal-content"
                    className="fixed z-[9999] min-w-[220px] bg-[#1e2029] border border-white/10 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        // Nếu align right mà tính toán thủ công khó quá, ta có thể dùng transform
                        transform: align === 'right' ? 'translateX(-100%)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()} // Chặn click xuyên thấu
                >
                    <div onClick={() => setIsOpen(false)}>
                        {content}
                    </div>
                </div>,
                document.body // Render thẳng vào body
            )}
        </>
    );
};