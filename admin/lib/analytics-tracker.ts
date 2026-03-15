/**
 * 前端埋点 SDK，用于在 React Native / Web 中上报行为数据。
 * 需配合后端写入 user_analytics 表。
 */

type Payload = Record<string, unknown>;

export class AnalyticsTracker {
  private baseUrl: string;
  private userId: string | null = null;
  private sessionId: string;

  constructor(options?: { baseUrl?: string; userId?: string | null }) {
    this.baseUrl = options?.baseUrl ?? "";
    this.userId = options?.userId ?? null;
    this.sessionId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private track(
    eventName: string,
    subjectType: string,
    subjectValue: string,
    payload?: Payload
  ) {
    if (!this.baseUrl) return;
    fetch(`${this.baseUrl}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        subject_type: subjectType,
        subject_value: subjectValue,
        payload: {
          session_id: this.sessionId,
          ...payload,
        },
      }),
    }).catch(() => {});
  }

  trackPageView(path: string) {
    this.track("page_view", "path", path, { page_path: path });
  }

  trackClick(elementId: string, data?: Payload) {
    this.track("click", "element", elementId, data);
  }

  trackEvent(eventName: string, data?: Payload) {
    this.track(eventName, "custom", eventName, data);
  }

  trackDuration(path: string, durationMs: number) {
    this.track("page_duration", "path", path, {
      page_path: path,
      duration_ms: durationMs,
    });
  }
}
