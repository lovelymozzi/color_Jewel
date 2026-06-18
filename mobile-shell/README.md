# Mobile Autoplay Shell

Standard mobile browsers can block audible autoplay after refresh even if the page calls `play()` as soon as it loads. This folder provides native wrapper examples that load the existing web game while disabling the "user gesture required" media gate at the WebView layer.

## Android

Project path:

```text
mobile-shell/android
```

What it does:

- Loads the game URL in an Android `WebView`
- Enables JavaScript and DOM storage
- Sets `mediaPlaybackRequiresUserGesture = false`
- Points to `https://your-host.example/` by default

Change the game URL here before building:

```text
mobile-shell/android/app/src/main/java/com/colorjewel/mobile/MainActivity.kt
```

## iOS

Sample controller path:

```text
mobile-shell/ios/AutoplayWebViewController.swift
```

What it does:

- Creates a `WKWebViewConfiguration`
- Sets `mediaTypesRequiringUserActionForPlayback = []`
- Enables inline media playback
- Loads the game URL in a `WKWebView`

Change the game URL here before wiring it into your app target:

```text
mobile-shell/ios/AutoplayWebViewController.swift
```

## When to use this

Use this shell when you need:

- title BGM before any touch
- tutorial toast sounds before any touch
- reliable audio after refresh on mobile

If you keep opening the game in Safari or Chrome directly, autoplay policy can still block audible playback.
