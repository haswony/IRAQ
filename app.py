from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from googleapiclient.discovery import build
import os

# إعداد التطبيق
app = Flask(__name__)
CORS(app)

# قائمة مفاتيح YouTube API
youtube_api_keys = [
    "AIzaSyCzeLSFlWFTfl8307R29KExxX2h4GAUOwo",
    "AIzaSyDe_CKt-e8caZD7Vzn1w_gpRwWARQneJz8",
    "AIzaSyBdAxEp-4c0pbTGE6seOe1XqZySsGuSpWc"
]

# متغير لتتبع المفتاح الحالي
current_key_index = 0

def get_youtube_service():
    """إنشاء خدمة YouTube باستخدام المفتاح الحالي"""
    global current_key_index
    api_key = youtube_api_keys[current_key_index]
    return build('youtube', 'v3', developerKey=api_key)

# المسار الرئيسي للتطبيق
@app.route('/')
def index():
    return render_template('index.html')

# مسار البحث
@app.route('/search', methods=['POST'])
def search():
    global current_key_index
    data = request.get_json()
    query = data.get('query')
    try:
        youtube = get_youtube_service()
        request_youtube = youtube.search().list(
            q=query,
            part='snippet',
            type='video',
            maxResults=10
        )
        response = request_youtube.execute()
        videos = [{'title': item['snippet']['title'], 'videoId': item['id']['videoId'], 'thumbnail': item['snippet']['thumbnails']['default']['url']} for item in response['items']]
        return jsonify(videos)
    except Exception as e:
        # التحقق إذا كان الخطأ بسبب الحصة (quota exceeded)
        if "quotaExceeded" in str(e):
            current_key_index += 1
            # التحقق إذا كانت جميع المفاتيح قد استخدمت
            if current_key_index >= len(youtube_api_keys):
                current_key_index = 0  # إعادة استخدام المفتاح الأول
                return jsonify({'error': 'All API keys have exceeded their quota.'}), 500
            else:
                return search()  # محاولة استخدام المفتاح التالي
        else:
            print(f"Error fetching from YouTube API: {e}")
            return jsonify([]), 500

# تشغيل التطبيق
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
