import type { Vent } from "../vent.js";
import type { Notifier } from "./index.js";

export class GChatNotifier implements Notifier {
  readonly name = "gchat";

  constructor(private readonly webhook: string | undefined) {}

  async notify(_vent: Vent): Promise<void> {
    if (!this.webhook) {
      throw new Error(
        "GChat notifier not configured: set VENT_GCHAT_WEBHOOK to a Google Chat incoming webhook URL.",
      );
    }
    throw new Error("GChat notifier not implemented yet (v2)");
  }
}
