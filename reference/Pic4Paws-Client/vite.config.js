import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    needsInterop: [
      'lottie-react',
      '@mui/icons-material/Add',
      '@mui/icons-material/ArrowBack',
      '@mui/icons-material/ArrowForward',
      '@mui/icons-material/AttachFileOutlined',
      '@mui/icons-material/ChatBubbleOutlineOutlined',
      '@mui/icons-material/Close',
      '@mui/icons-material/DarkMode',
      '@mui/icons-material/DeleteOutlined',
      '@mui/icons-material/EditOutlined',
      '@mui/icons-material/Favorite',
      '@mui/icons-material/FavoriteBorderOutlined',
      '@mui/icons-material/FavoriteOutlined',
      '@mui/icons-material/GifBoxOutlined',
      '@mui/icons-material/Help',
      '@mui/icons-material/ImageOutlined',
      '@mui/icons-material/LightMode',
      '@mui/icons-material/LocationOnOutlined',
      '@mui/icons-material/LockOutlined',
      '@mui/icons-material/ManageAccountsOutlined',
      '@mui/icons-material/Menu',
      '@mui/icons-material/Message',
      '@mui/icons-material/MicOutlined',
      '@mui/icons-material/MoreHoriz',
      '@mui/icons-material/MoreHorizOutlined',
      '@mui/icons-material/Notifications',
      '@mui/icons-material/PersonAddOutlined',
      '@mui/icons-material/PersonRemoveOutlined',
      '@mui/icons-material/Search',
      '@mui/icons-material/SendOutlined',
      '@mui/icons-material/Share',
      '@mui/icons-material/ShareOutlined',
      '@mui/icons-material/WorkOutlineOutlined'
    ]
  }
});
