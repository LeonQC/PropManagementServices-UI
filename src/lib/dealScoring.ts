// How the AI deal score is built (design doc §6.3), for explaining it in the UI.
//
// MIRRORS AiService.Business.Workers.DealScore. The weights and band edges below are
// duplicated from that file by hand, so a change there has to be copied here — there is
// no endpoint serving them. That is a deliberate trade for now: a static explanation is
// worth more than an extra round trip, and the numbers move rarely. If they start moving
// often, publish them from the service instead of syncing by hand.
//
// The score itself is NOT computed here. It is a deterministic formula that runs in the
// background worker and arrives on the deal record already calculated; this file only
// describes it.

import type { DealResponse } from "../api/deals";
import { isTerminal, stageMeta } from "./dealStages";

export interface ScoreComponent {
  label: string;
  /** Share of the total, out of 100, when every component has data. */
  weight: number;
  /** What earns a low score and what earns a high one. */
  range: string;
  /** True for the four financial inputs, at least one of which is required. */
  financial: boolean;
}

export const SCORE_COMPONENTS: ScoreComponent[] = [
  {
    label: "Cap rate vs benchmark",
    weight: 30,
    range: "Matching the market benchmark scores 50. Two points above it scores 100, one point below scores 0.",
    financial: true,
  },
  {
    label: "Target IRR",
    weight: 20,
    range: "8% scores 0, 20% scores 100.",
    financial: true,
  },
  {
    label: "Equity multiple",
    weight: 15,
    range: "1.20× scores 0, 2.50× scores 100.",
    financial: true,
  },
  {
    label: "Occupancy",
    weight: 15,
    range: "70% scores 0, 95% scores 100.",
    financial: true,
  },
  {
    label: "Task completion",
    weight: 10,
    range: "The share of this deal's checklist that is done.",
    financial: false,
  },
  {
    label: "Stage momentum",
    weight: 10,
    range: "Time in the current stage against the pace this deal has kept. Half the usual time scores 100, twice it scores 0.",
    financial: false,
  },
];

/** Why a deal has no score. The worker publishes a number for every deal that has one, so
 *  a null score always has one of these explanations behind it. */
export type UnscoredReason =
  | { kind: "terminal"; stageLabel: string }
  | { kind: "no-financials"; missing: string[] }
  | { kind: "pending" };

/**
 * Works out why a deal shows no score, so the UI can say something true instead of
 * something generic.
 *
 * Mirrors DealScore's skip rules: terminal deals are never scored, and a deal needs at least
 * one financial input before a number means anything. Presence is all that is checked here —
 * DealScore additionally ignores a value out of range for a fraction, such as an occupancy
 * entered as 88 rather than 0.88, which would leave this reporting "pending".
 */
export function unscoredReason(deal: DealResponse): UnscoredReason {
  // Acquired as well as Dead. A finished deal has no trajectory left to score, so a number
  // projecting how it is going would be noise — and reporting it as pending would promise a
  // score that is never coming.
  if (isTerminal(deal.stage)) return { kind: "terminal", stageLabel: stageMeta(deal.stage).label };

  const missing: string[] = [];
  // The cap rate component needs both sides to mean anything.
  if (deal.projectedCapRate == null || deal.marketCapRateBenchmark == null) {
    missing.push("projected cap rate");
  }
  if (deal.targetIrr == null) missing.push("target IRR");
  if (deal.equityMultiple == null) missing.push("equity multiple");
  if (deal.occupancyRate == null) missing.push("occupancy");

  // Every financial component carries enough weight on its own to clear the floor, so one
  // present input is enough to produce a score.
  return missing.length === SCORE_COMPONENTS.filter((c) => c.financial).length
    ? { kind: "no-financials", missing }
    : { kind: "pending" };
}
