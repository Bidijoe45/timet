#!/usr/bin/env bash
# Renews the free Apple ID signing cert by rebuilding and reinstalling the Release
# app on your iPhone. This is an update-in-place (same bundle id) — app data
# (SQLite, settings, forest progress) is preserved, same as any normal app update.
#
# Requires: phone plugged in via USB, or already paired for wireless debugging
# (Xcode -> Window -> Devices and Simulators -> "Connect via network" ticked).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Looking for a connected iPhone..."

# Parse `xctrace list devices`: physical devices are listed before the blank line
# that precedes "== Simulators ==", and this Mac itself is always the first line.
DEVICES="$(xcrun xctrace list devices 2>&1 | sed -n '/== Devices ==/,/== Simulators ==/p' | sed '1d;$d' | grep -v "^$" | grep -v "$(scutil --get ComputerName 2>/dev/null || echo '__no_match__')")"

if [ -z "$DEVICES" ]; then
  echo "No iPhone found. Plug it in via USB (or make sure it's paired for wireless debugging) and try again."
  exit 1
fi

DEVICE_COUNT="$(echo "$DEVICES" | wc -l | tr -d ' ')"
if [ "$DEVICE_COUNT" -gt 1 ]; then
  echo "Multiple devices found, pick one:"
  echo "$DEVICES"
  exit 1
fi

# Extract the UDID in parentheses at the end of the line, e.g. "aphone (18.0) (UDID)".
DEVICE_UDID="$(echo "$DEVICES" | grep -oE '\(([0-9A-Fa-f-]{25,})\)$' | tr -d '()')"
DEVICE_NAME="$(echo "$DEVICES" | sed -E 's/ \([^)]*\)( \([^)]*\))?$//')"

if [ -z "$DEVICE_UDID" ]; then
  echo "Found a device line but couldn't parse its UDID:"
  echo "$DEVICES"
  exit 1
fi

echo "Installing on: $DEVICE_NAME ($DEVICE_UDID)"
echo "Make sure the phone is unlocked."
npx expo run:ios --device "$DEVICE_UDID" --configuration Release
