import type { Vent } from "../vent.js";

export interface Notifier {
  name: string;
  notify(vent: Vent): Promise<void>;
}

export async function dispatch(
  notifiers: Notifier[],
  vent: Vent,
): Promise<void> {
  await Promise.all(
    notifiers.map(async (n) => {
      try {
        await n.notify(vent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[agent-vent] notifier "${n.name}" failed: ${msg}\n`);
      }
    }),
  );
}
