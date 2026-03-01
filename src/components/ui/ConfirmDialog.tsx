import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary'; // Để sau này tái sử dụng cho các việc khác
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmDialogProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            {/* Chúng ta để title rỗng ở Modal gốc để tự custom header bên dưới cho giống Linear */}

            <div className="pt-2">
                {/* Header */}
                <h3 className="text-lg font-semibold text-white mb-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    {description}
                </p>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="bg-[#2C2E33] hover:bg-[#3A3D42] text-white border-transparent"
                    >
                        {cancelText}
                    </Button>

                    <Button
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className={variant === 'danger'
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/50 hover:border-red-500"
                            : ""}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};