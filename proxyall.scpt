#!/usr/bin/osascript
tell application "iTerm2"
    tell current session of current tab of current window
        write text "proxydb"
        split horizontally with default profile
        split vertically with default profile
    end tell
    tell second session of current tab of current window
        write text "rabbit"
        split horizontally with default profile
        split vertically with default profile
    end tell
    tell third session of current tab of current window
        write text "kubectl proxy"
    end tell
    tell fourth session of current tab of current window
        write text "proxy_beta"
    end tell
    tell fifth session of current tab of current window
        write text "redis"
        split horizontally with default profile
        split vertically with default profile
    end tell
    tell sixth session of current tab of current window
        write text "aigit"
        split vertically with default profile
    end tell
    tell seventh session of current tab of current window
        write text "proxydb_beta"
    end tell
    tell eighth session of current tab of current window
        write text "rabbit_manage"
    end tell
end tell