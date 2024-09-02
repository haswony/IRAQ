from flask import Flask, render_template, request, jsonify
from googleapiclient.discovery import build
import os

app = Flask(__name__)

# إعداد YouTube API
youtube_api_key = "AIzaSyAP0IZuR4dU2Jn7X8NmOp2dWqxiNg-7U7M"  # تأكد من إدخال مفتاح API الصحيح
youtube = build('youtube', 'v3', developerKey=youtube_api_key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()  # استقبال البيانات كـ JSON
    query = data.get('query')  # استخدم .get للوصول إلى البيانات بأمان
    try:
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
        print(f"Error fetching from YouTube API: {e}")
        return jsonify([]), 500

# تشغيل التطبيق مع إعدادات Heroku
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))