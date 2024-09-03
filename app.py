from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from googleapiclient.discovery import build
import os

# Initialize the app
app = Flask(__name__)
CORS(app)  # Enable CORS to allow access from any domain

# Set up YouTube API with your API key
youtube_api_key = "AIzaSyAP0IZuR4dU2Jn7X8NmOp2dWqxiNg-7U7M"  # Insert your correct API key
youtube = build('youtube', 'v3', developerKey=youtube_api_key)

# Main route
@app.route('/')
def index():
    return render_template('index.html')

# Search route
@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()  # Get data as JSON
    query = data.get('query')  # Extract the search query
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

# Run the app with Heroku settings
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))