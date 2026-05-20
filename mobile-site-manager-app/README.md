# JGPC Site Manager Mobile App

This is the private mobile app for updating the Jalpai Ganesh Puja Committee website.

## What it controls

The app edits this website file:

```txt
data/site-manager.json
```

The website reads that file automatically, so changes saved from the app appear on the public website after GitHub Pages refreshes.

## Safe token rule

Do not paste your GitHub token into public code, `index.html`, JSON files, screenshots, or chat.

Paste the token only inside the mobile app. The app stores it with Expo SecureStore on your phone.

## GitHub token permission needed

Create a GitHub fine-grained token for this repository only:

```txt
chandra77-coder/jalpai-ganesh-puja-commitee.github.io
```

Required permission:

```txt
Contents: Read and write
```

## Run on Android with Expo Go

1. Install Node.js on PC.
2. Open terminal inside this folder:

```txt
mobile-site-manager-app
```

3. Install packages:

```bash
npm install
npx expo install --fix
```

4. Start the app:

```bash
npx expo start
```

5. Install Expo Go on your Android phone.
6. Scan the QR code.
7. Paste your GitHub token inside the app.
8. Tap **Load Website Data**.
9. Change website content.
10. Tap **Save Website Data**.

## Image upload

The app can upload images to GitHub and automatically place the new image path inside the website JSON.

Gallery images go to:

```txt
images/gallery/
```

Member photos go to:

```txt
images/members/
```

Hero photos go to:

```txt
images/
```

## Verify after saving

After saving in the app:

1. Wait for GitHub Pages to refresh.
2. Open the website in a private/incognito browser tab.
3. Check homepage text, announcement, gallery, members, events, and links.
4. If changes do not appear, reload the page after clearing browser cache.

## Important

The public website should not contain admin passwords. Member verification codes are public display codes only. Real admin control must stay inside this private app with your GitHub token.

## Dependency note

This app uses Expo SDK 55 because Expo's current SDK table lists SDK 55 with React Native 0.83 and React 19.2. If Expo shows dependency warnings, run:

```bash
npx expo install --fix
```
