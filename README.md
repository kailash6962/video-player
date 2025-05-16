# My Video Player Project

A simple video player application that streams local video files, displays them as cards with thumbnails, and features custom video controls. The application also tracks watch progress using a SQLite database.

## Features

- **Video Cards with Thumbnails:**  
  Displays available videos as cards. Each card shows a thumbnail image (if available) and the video title.

- **Streaming & Progress Tracking:**  
  Streams video files from a local folder and saves the watch progress in a SQLite database so playback can resume from the last watched position.

## Project Structure

```
my-video-player/
├── node_modules/                 # Installed Node.js modules
├── public/
│   ├── index.html                # Main HTML file with video cards and custom controls
│   ├── app.js                    # JavaScript for handling video card UI and custom controls
├── videos/                       # Folder for storing local video files and their thumbnails (e.g., movie1.mp4, movie1.jpg)
├── db.sqlite3                    # SQLite database file (will be created automatically)
├── package.json                  # Project manifest with dependencies and scripts
├── package-lock.json             # Auto-generated dependency tree
└── server.js                     # Express server for serving the application, video streaming, and API endpoints
```

## Installation

1. **Clone the Repository:**

   Open your terminal and run:

   ```bash
   git clone https://github.com/kailash6962/video-player.git
   cd video-player
   ```

2. **Install Dependencies:**

   Ensure you have [Node.js](https://nodejs.org/) installed, then run:

   ```bash
   npm install
   ```

## Setup

1. **Add Your Video Files:**

   - Place your video files (e.g., `movie1.mp4`, `movie2.mp4`) to any folder in meachine and set the path in {VIDEOS_DIR}.

2. **Configuration (Optional):**

   - Modify file paths, the server port, or any other configurations in `server.js` as needed.
   - Customize the UI by editing `public/index.html` and associated CSS or JavaScript files.

## Running the Application

1. **Start the Server:**

   Run the following command in your terminal:

   ```bash
   node server.js
   ```

   The server will start on port `3000` by default (or the port specified by the `PORT` environment variable).

2. **Open the Application:**

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000). You should see a grid of video cards with thumbnails and titles.

3. **Usage:**

   - **Video Playback:** Click a video card to load and play the video.
   - **Progress Tracking:** The player tracks your watch progress in the SQLite database (`db.sqlite3`). When you return to a video later, playback will resume from your last watched position.

## Troubleshooting

- **Video Not Resuming:**  
  Ensure that the video metadata is loaded before setting the playback position. The code uses the `loadedmetadata` event to update `currentTime`.

- **Database Errors:**  
  Check that your project has proper write permissions so that the SQLite database file can be created and updated.

- **Multiple SQL Statements Error:**  
  If you encounter errors with executing multiple SQL statements in one query (e.g., using `db.run`), split them into separate queries as demonstrated in the project code.

## Customization

- **Custom Video Controls:**  
  Edit `public/app.js` (or `public/customControls.js` if you have a separate file) to modify or add custom control features such as volume control, fullscreen mode, or playback speed.

- **Styling:**  
  Modify the CSS in `public/index.html` or add an external stylesheet to change the look and feel of your video player interface.

## License

This project is open-source. Feel free to use, modify, and distribute it under the terms of your preferred open-source license.

## Acknowledgements

- [Express](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/)
- Inspiration from Netflix-like video players and HTML5 video customizations.
