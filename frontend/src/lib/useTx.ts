"use client";

/**
 * useTx — orchestrates `signAndSend` for any Polkadot extrinsic.
 *
 * Returns a `submit` callback that:
 *   1. Throws if no wallet is connected.
 *   2. Pops a "Signing…" toast immediately.
 *   3. Morphs the toast through "Pending in block…" → "Confirmed".
 *   4. Decodes module errors into something a human can read.
 *   5. Calls `onSuccess` with the included `events` so the caller can
 *      update SWR caches (e.g. mutate the markets list).
 */

import { useCallback, useState } from "react";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { useWallet } from "./wallet";
import { useNotify } from "./notify";
import { getApi } from "./chain";

interface SubmitOpts {
  /** Title to show in the toast. */
  label: string;
  /** Friendly success message. Receives the success result. */
  successBody?: string;
  /** Called after finalization. Use it to refresh SWR caches. */
  onSuccess?: (result: ISubmittableResult) => void;
}

export interface UseTxReturn {
  isPending: boolean;
  submit: (
    tx: SubmittableExtrinsic<"promise", ISubmittableResult>,
    opts: SubmitOpts,
  ) => Promise<void>;
}

export function useTx(): UseTxReturn {
  const { active, signer } = useWallet();
  const { notify } = useNotify();
  const [isPending, setPending] = useState(false);

  const submit = useCallback<UseTxReturn["submit"]>(
    async (tx, opts) => {
      if (!active || !signer) {
        notify({
          kind: "error",
          title: "Connect a wallet first",
          body: "We need a signer before we can submit on-chain.",
        });
        throw new Error("no signer");
      }
      const handle = notify({
        kind: "loading",
        title: opts.label,
        body: "Awaiting your signature in the wallet…",
      });
      setPending(true);

      let api: ApiPromise;
      try {
        api = await getApi();
      } catch (e) {
        handle.update({
          kind: "error",
          title: "Chain unreachable",
          body: e instanceof Error ? e.message : String(e),
        });
        setPending(false);
        throw e;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          let unsub: (() => void) | undefined;
          tx
            .signAndSend(active.address, { signer }, (result) => {
              const { status, dispatchError, events } = result;
              if (dispatchError) {
                let message = dispatchError.toString();
                if (dispatchError.isModule) {
                  try {
                    const decoded = api.registry.findMetaError(
                      dispatchError.asModule,
                    );
                    message = `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
                  } catch {
                    /* fall through */
                  }
                }
                handle.update({ kind: "error", title: opts.label, body: message });
                unsub?.();
                reject(new Error(message));
                return;
              }
              if (status.isReady || status.isBroadcast) {
                handle.update({ body: "Broadcasting…" });
              }
              if (status.isInBlock) {
                handle.update({ body: `In block · ${status.asInBlock.toHex().slice(0, 10)}…` });
              }
              if (status.isFinalized) {
                const failed = events.find((e) => api.events.system?.ExtrinsicFailed?.is(e.event));
                if (failed) {
                  handle.update({
                    kind: "error",
                    title: opts.label,
                    body: "Extrinsic failed (see explorer for details).",
                  });
                  unsub?.();
                  reject(new Error("ExtrinsicFailed"));
                  return;
                }
                handle.update({
                  kind: "success",
                  title: opts.label,
                  body: opts.successBody ?? "Confirmed on-chain.",
                });
                opts.onSuccess?.(result);
                unsub?.();
                resolve();
              }
            })
            .then((u) => {
              unsub = u;
            })
            .catch(reject);
        });
      } finally {
        setPending(false);
      }
    },
    [active, signer, notify],
  );

  return { isPending, submit };
}
