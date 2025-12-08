# Nonoky - Video Chat Website

A complete video chat application similar to Omegle/Monkey built with HTML, CSS, JavaScript, WebRTC, and Firebase.

## Features

- 🎥 **Video Chat**: Peer-to-peer video communication using WebRTC
- 🔥 **Firebase Integration**: Real-time database for user matching and signaling
- 🎨 **Modern Design**: Dark theme with responsive layout
- 🚀 **Quick Matching**: Instant partner finding through queue system
- 🔊 **Audio Controls**: Mute/unmute functionality
- 📷 **Camera Controls**: Turn camera on/off
- ➡️ **Next Button**: Switch to new partner instantly
- 📱 **Mobile Responsive**: Works on all devices

## How It Works

1. **Landing Page**: Users see the welcome screen with a "Start Video Chat" button
2. **Camera Access**: User grants permission for camera and microphone
3. **Queue System**: User enters a waiting queue in Firebase
4. **Matching**: When another user joins, they're automatically paired
5. **WebRTC Connection**: Direct peer-to-peer video connection established
6. **Chat Interface**: Users can see each other and use controls
7. **Next Partner**: Users can instantly switch to a new partner

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Real-time Communication**: WebRTC
- **Database**: Firebase Realtime Database
- **Signaling**: Firebase for WebRTC offer/answer exchange
- **Deployment**: Vercel (with vercel.json configuration)

## Firebase Configuration

The app uses the following Firebase configuration:
- **Realtime Database** for user queue and room management
- **STUN servers** for WebRTC connection establishment
- **Automatic cleanup** of rooms and queue entries

## File Structure

```
├── index.html          # Main HTML structure
├── style.css           # CSS styling and responsive design
├── script.js           # JavaScript functionality and WebRTC logic
├── vercel.json         # Deployment configuration
└── README.md           # This file
```

## Setup Instructions

### Local Development

1. Clone or download the files
2. Open `index.html` in a modern web browser
3. Allow camera and microphone access when prompted
4. Start chatting!

### Deployment on Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Upload all files to your repository
3. Connect your repository to Vercel
4. Deploy automatically - the `vercel.json` handles the configuration

### Local Server (Alternative)

For testing with a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Mobile browsers (limited WebRTC support)

## Features Breakdown

### WebRTC Implementation
- Peer-to-peer video streaming
- ICE candidate exchange via Firebase
- Automatic reconnection handling
- Audio/video track management

### Firebase Realtime Database Structure
```
/queue/{userId}           # Users waiting for partners
/rooms/{roomId}/offer     # WebRTC offers
/rooms/{roomId}/answer    # WebRTC answers
/rooms/{roomId}/candidates # ICE candidates
```

### User Interface
- Responsive video layout
- Picture-in-picture local video
- Control buttons with visual feedback
- Status indicators
- Loading animations

## Security Features

- HTTPS required for camera access
- Secure WebRTC connections
- Automatic cleanup of user data
- No server-side data storage

## Troubleshooting

### Camera/Microphone Issues
- Ensure HTTPS connection (required for media access)
- Check browser permissions
- Try refreshing the page

### Connection Problems
- Check internet connection
- Disable VPN temporarily
- Try different browser
- Ensure both users have stable internet

### Performance Issues
- Close unnecessary browser tabs
- Check available bandwidth
- Use Chrome for best performance

## Development Notes

- Uses STUN servers for NAT traversal
- Implements proper cleanup on page unload
- Handles network disconnections gracefully
- Responsive design for mobile devices

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Nonoky** - Connect with people around the world through video chat! 🌍