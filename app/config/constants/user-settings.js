const USER_SETTINGS_DEFAULTS = Object.freeze({
  hidePresence: false,
  blurChatPreviews: false,
  localPrivacyMode: false,
  darkMode: false,
  compactMode: false,
  messageSize: "normal",
  showEmojiButton: true,
  enterToSend: true,
  notificationSound: true,
  desktopNotifications: true,
  dashboardNotificationBadges: true,
  keyboardShortcuts: true,
  boardOrder: [],
});
const DEFAULT_HUB_POSTGRES = {
  chatFilesBucket: "hub-chat-files",
  turnstileSiteKey: "",
};
