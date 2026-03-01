import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Import React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Tạo instance client (Cái kho chứa cache)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Nếu lỗi mạng, thử lại 1 lần thôi (mặc định là 3)
      refetchOnWindowFocus: false, // Không tự fetch lại khi user bấm qua tab khác rồi quay lại (đỡ lag dev)
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Bọc App bằng Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)