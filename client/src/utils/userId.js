export function getOrCreateUserId() {
    let userId = sessionStorage.getItem('userId'); // 👈 tab-specific
    if (!userId) {
      userId = crypto.randomUUID();
      sessionStorage.setItem('userId', userId);
    }
    return userId;
  }
  