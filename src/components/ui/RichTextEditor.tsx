import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Code, Loader2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
    onBlur?: () => void;
}

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = 'Write something...',
    editable = true,
    onBlur
}: RichTextEditorProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            Image,
        ],
        content: value,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onBlur: ({ editor }) => {
            onBlur?.();
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px] text-gray-300 text-sm leading-relaxed',
            },
        },
    });
    useEffect(() => {
        if (!editor) return;

        // Nếu nội dung mới khác với nội dung hiện tại trong editor thì mới update
        // (Để tránh việc con trỏ bị nhảy lung tung khi đang gõ)
        if (editor.getHTML() !== value) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // Hàm xử lý upload ảnh
    const handleImageUpload = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
                // 1. Upload lên Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('task-assets')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Lấy Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('task-assets')
                    .getPublicUrl(filePath);

                // 3. Chèn ảnh vào Editor
                editor?.chain().focus().setImage({ src: publicUrl }).run();

            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image');
            } finally {
                setIsUploading(false);
            }
        };
        input.click();
    };

    if (!editor) return null;

    return (
        <div className="border border-white/10 rounded-md bg-[#1e2029] overflow-hidden">
            {/* Toolbar - Chỉ hiện khi đang edit */}
            {editable && (
                <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<Bold size={14} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<Italic size={14} />}
                    />
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button
                        onClick={handleImageUpload}
                        disabled={isUploading}
                        className={`p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400`}
                        type="button"
                        title="Upload Image"
                    >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    </button>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<List size={14} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={<ListOrdered size={14} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        isActive={editor.isActive('codeBlock')}
                        icon={<Code size={14} />}
                    />
                </div>
            )}

            {/* Editor Content Area */}
            <div className="p-3">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

// Helper Component cho nút bấm
const ToolbarBtn = ({ onClick, isActive, icon }: any) => (
    <button
        onClick={onClick}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
        type="button"
    >
        {icon}
    </button>
);