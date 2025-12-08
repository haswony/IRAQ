// ========================================
// Firebase Configuration and Initialization
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyAFQRTgO3iSBzpUNsNt6oC1_7SPnNBPyuw",
    authDomain: "reno-app-32f00.firebaseapp.com",
    databaseURL: "https://reno-app-32f00-default-rtdb.firebaseio.com",
    projectId: "reno-app-32f00",
    storageBucket: "reno-app-32f00.firebasestorage.app",
    messagingSenderId: "262558946501",
    appId: "1:262558946501:web:b8b58dfb1b9406d9c48cac",
    measurementId: "G-2MV7PH186B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ========================================
// Global Variables
// ========================================
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentRoomId = null;
let currentUserId = generateUserId();
let isInQueue = false;
let isMuted = false;
let isCameraOff = false;

// WebRTC Configuration
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    landingPage: document.getElementById('landingPage'),
    videoChat: document.getElementById('videoChat'),
    queuePage: document.getElementById('queuePage'),
    startBtn: document.getElementById('startBtn'),
    nextBtn: document.getElementById('nextBtn'),
    muteBtn: document.getElementById('muteBtn'),
    cameraBtn: document.getElementById('cameraBtn'),
    localVideo: document.getElementById('localVideo'),
    remoteVideo: document.getElementById('remoteVideo'),
    status: document.getElementById('status'),
    remoteStatus: document.getElementById('remoteStatus'),
    queueStatus: document.getElementById('queueStatus'),
    muteText: document.getElementById('muteText'),
    cameraText: document.getElementById('cameraText')
};

// ========================================
// Event Listeners
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateStatus('Ready to start');
});

function initializeEventListeners() {
    elements.startBtn.addEventListener('click', startVideoChat);
    elements.nextBtn.addEventListener('click', nextPartner);
    elements.muteBtn.addEventListener('click', toggleMute);
    elements.cameraBtn.addEventListener('click', toggleCamera);
}

// ========================================
// User ID Generation
// ========================================
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// ========================================
// Main Functions
// ========================================

// بدء المحادثة المرئية
async function startVideoChat() {
    try {
        updateStatus('Initializing camera...');
        showPage('queue');
        
        // الحصول على إذن الكاميرا والمايكروفون
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // عرض الفيديو المحلي
        elements.localVideo.srcObject = localStream;
        
        updateStatus('Finding a partner...');
        elements.queueStatus.textContent = 'Searching for someone to chat with...';
        
        // الدخول في قائمة الانتظار
        await joinQueue();
        
    } catch (error) {
        console.error('Error starting video chat:', error);
        updateStatus('Camera access denied. Please allow camera access.');
        showPage('landing');
    }
}

// ========================================
// Queue Management
// ========================================

// الدخول في قائمة الانتظار
async function joinQueue() {
    isInQueue = true;
    const queueRef = database.ref('queue');
    const userRef = queueRef.child(currentUserId);
    
    try {
        // إضافة المستخدم في قائمة الانتظار
        await userRef.set({
            userId: currentUserId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // مراقبة قائمة الانتظار للبحث عن شريك
        const unsubscribe = queueRef.on('value', (snapshot) => {
            if (!isInQueue) return;
            
            const users = snapshot.val();
            if (!users) return;
            
            // البحث عن مستخدم آخر في قائمة الانتظار
            const otherUsers = Object.keys(users).filter(id => id !== currentUserId);
            
            if (otherUsers.length > 0) {
                // العثور على شريك
                const partnerId = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                unsubscribe(); // إيقاف المراقبة
                createRoom(partnerId);
            }
        });
        
        // إزالة المستخدم من قائمة الانتظار عند مغادرة الصفحة
        window.addEventListener('beforeunload', () => {
            userRef.remove();
            queueRef.off('value', unsubscribe);
        });
        
    } catch (error) {
        console.error('Error joining queue:', error);
        updateStatus('Connection error. Please try again.');
        showPage('landing');
    }
}

// ========================================
// Room Management
// ========================================

// إنشاء غرفة جديدة
async function createRoom(partnerId) {
    try {
        isInQueue = false;
        currentRoomId = generateRoomId();
        
        // إزالة كلا المستخدم من قائمة الانتظار
        await Promise.all([
            database.ref(`queue/${currentUserId}`).remove(),
            database.ref(`queue/${partnerId}`).remove()
        ]);
        
        // إعداد WebRTC
        await setupWebRTC();
        
        // إنشاء عرض (offer)
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // حفظ العرض في Firebase
        await database.ref(`rooms/${currentRoomId}/offer`).set({
            sdp: offer.sdp,
            type: offer.type,
            from: currentUserId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        showPage('video');
        updateStatus('Connected! Waiting for partner to join...');
        
    } catch (error) {
        console.error('Error creating room:', error);
        updateStatus('Connection error. Please try again.');
        showPage('landing');
    }
}

// ========================================
// WebRTC Setup
// ========================================

// إعداد WebRTC
async function setupWebRTC() {
    try {
        // إنشاء PeerConnection
        peerConnection = new RTCPeerConnection(rtcConfiguration);
        
        // إضافة الفيديو المحلي
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // إنشاء remote stream
        remoteStream = new MediaStream();
        elements.remoteVideo.srcObject = remoteStream;
        
        // مراقبة أحداث WebRTC
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
            updateStatus('Connected! Video chat active.');
            elements.remoteStatus.textContent = 'Partner connected';
        };
        
        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                await database.ref(`rooms/${currentRoomId}/candidates`).push({
                    candidate: event.candidate.toJSON(),
                    from: currentUserId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
        };
        
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'disconnected' || 
                peerConnection.connectionState === 'failed') {
                handleDisconnection();
            }
        };
        
        // إعداد مستمعي إشارات Firebase
        setupFirebaseSignaling();
        
    } catch (error) {
        console.error('Error setting up WebRTC:', error);
        throw error;
    }
}

// ========================================
// Firebase Signaling
// ========================================

// إعداد إشارات Firebase
function setupFirebaseSignaling() {
    if (!currentRoomId) return;
    
    // مراقبة العرض (offer)
    const offerRef = database.ref(`rooms/${currentRoomId}/offer`);
    offerRef.on('value', async (snapshot) => {
        const offer = snapshot.val();
        if (offer && offer.from !== currentUserId) {
            await handleOffer(offer);
        }
    });
    
    // مراقبة الإجابة (answer)
    const answerRef = database.ref(`rooms/${currentRoomId}/answer`);
    answerRef.on('value', async (snapshot) => {
        const answer = snapshot.val();
        if (answer && answer.from !== currentUserId) {
            await handleAnswer(answer);
        }
    });
    
    // مراقبة ICE candidates
    const candidatesRef = database.ref(`rooms/${currentRoomId}/candidates`);
    candidatesRef.on('child_added', async (snapshot) => {
        const candidate = snapshot.val();
        if (candidate && candidate.from !== currentUserId) {
            await handleIceCandidate(candidate);
        }
    });
}

// ========================================
// WebRTC Handlers
// ========================================

// التعامل مع العرض (offer)
async function handleOffer(offer) {
    try {
        if (!peerConnection) {
            await setupWebRTC();
        }
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // حفظ الإجابة في Firebase
        await database.ref(`rooms/${currentRoomId}/answer`).set({
            sdp: answer.sdp,
            type: answer.type,
            from: currentUserId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        showPage('video');
        updateStatus('Connected! Establishing connection...');
        elements.remoteStatus.textContent = 'Partner is connecting...';
        
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

// التعامل مع الإجابة (answer)
async function handleAnswer(answer) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        updateStatus('Connection established!');
        elements.remoteStatus.textContent = 'Partner connected';
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

// التعامل مع ICE candidate
async function handleIceCandidate(candidate) {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate.candidate));
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
    }
}

// ========================================
// Control Functions
// ========================================

// تبديل الشريك
async function nextPartner() {
    try {
        updateStatus('Finding new partner...');
        elements.remoteStatus.textContent = 'Finding new partner...';
        
        // تنظيف الاتصال الحالي
        cleanupCurrentConnection();
        
        // العودة لقائمة الانتظار
        await joinQueue();
        
    } catch (error) {
        console.error('Error finding next partner:', error);
        updateStatus('Error finding partner. Please try again.');
    }
}

// كتم/إلغاء كتم الصوت
function toggleMute() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        isMuted = !isMuted;
        elements.muteText.textContent = isMuted ? 'Unmute' : 'Mute';
        elements.muteBtn.classList.toggle('active', isMuted);
        
        updateStatus(isMuted ? 'Microphone muted' : 'Microphone unmuted');
    }
}

// تشغيل/إيقاف الكاميرا
function toggleCamera() {
    if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        isCameraOff = !isCameraOff;
        elements.cameraText.textContent = isCameraOff ? 'Turn Camera On' : 'Turn Camera Off';
        elements.cameraBtn.classList.toggle('inactive', isCameraOff);
        
        updateStatus(isCameraOff ? 'Camera turned off' : 'Camera turned on');
    }
}

// ========================================
// Utility Functions
// ========================================

// تنظيف الاتصال الحالي
function cleanupCurrentConnection() {
    // إيقاف المراقبة
    if (currentRoomId) {
        database.ref(`rooms/${currentRoomId}/offer`).off();
        database.ref(`rooms/${currentRoomId}/answer`).off();
        database.ref(`rooms/${currentRoomId}/candidates`).off();
    }
    
    // إغلاق PeerConnection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // إيقاف التيارات
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    
    // إزالة الفيديوهات
    elements.localVideo.srcObject = null;
    elements.remoteVideo.srcObject = null;
    
    // تنظيف المتغيرات
    currentRoomId = null;
    isInQueue = false;
    isMuted = false;
    isCameraOff = false;
    
    // إعادة تعيين الأزرار
    elements.muteText.textContent = 'Mute';
    elements.muteBtn.classList.remove('active');
    elements.cameraText.textContent = 'Turn Camera Off';
    elements.cameraBtn.classList.remove('inactive');
}

// التعامل مع انقطاع الاتصال
function handleDisconnection() {
    updateStatus('Partner disconnected. Finding new partner...');
    elements.remoteStatus.textContent = 'Partner disconnected';
    
    // تأخير قصير قبل البحث عن شريك جديد
    setTimeout(() => {
        nextPartner();
    }, 2000);
}

// إنشاء معرف الغرفة
function generateRoomId() {
    return 'room_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// عرض الصفحة المطلوبة
function showPage(page) {
    // إخفاء جميع الصفحات
    elements.landingPage.classList.add('hidden');
    elements.videoChat.classList.add('hidden');
    elements.queuePage.classList.add('hidden');
    
    // عرض الصفحة المطلوبة
    switch(page) {
        case 'landing':
            elements.landingPage.classList.remove('hidden');
            elements.landingPage.classList.add('fade-in');
            break;
        case 'queue':
            elements.queuePage.classList.remove('hidden');
            elements.queuePage.classList.add('fade-in');
            break;
        case 'video':
            elements.videoChat.classList.remove('hidden');
            elements.videoChat.classList.add('fade-in');
            break;
    }
}

// تحديث حالة التطبيق
function updateStatus(message) {
    elements.status.textContent = message;
    console.log('Status:', message);
}

// ========================================
// Cleanup on Page Unload
// ========================================
window.addEventListener('beforeunload', () => {
    // إزالة المستخدم من قائمة الانتظار
    if (isInQueue) {
        database.ref(`queue/${currentUserId}`).remove();
    }
    
    // تنظيف الاتصال
    cleanupCurrentConnection();
});

// ========================================
// Error Handling
// ========================================
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    updateStatus('An error occurred. Please refresh the page.');
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    updateStatus('An error occurred. Please refresh the page.');
});

console.log('Nonoky Video Chat initialized successfully!');