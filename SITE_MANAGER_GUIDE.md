# Jalpai Site Manager - Simple Guide

## What this adds
This package adds a simple data system for your website.

## Files
- data/site-manager.json = all editable website data
- js/site-manager-loader.js = makes your website read the data file
- admin/site-manager.html = Android-friendly control panel
- admin/manifest.webmanifest + admin/sw.js = install support
- SITE_MANAGER_GUIDE.md = this guide

## Important
I could not directly push these files to your GitHub repo because GitHub returned:
Resource not accessible by integration.

So download this ZIP and upload the files manually to your repo.

## To connect the loader to your website
Open index.html and add this line just before </body>:

<script src="js/site-manager-loader.js"></script>

## To use the app on Android
1. Open your website admin page:
   /admin/site-manager.html
2. Tap browser menu ⋮
3. Tap Add to Home screen
4. It will look like a private app on your phone
5. Edit text
6. Download site-manager.json
7. Upload it to GitHub inside the data folder

## Photo update rule
Upload photos inside:
assets/gallery/
assets/members/

Then write the same path in data/site-manager.json.
Example:
assets/gallery/my-photo.jpg
