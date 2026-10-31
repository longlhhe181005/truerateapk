// Assembles one check, mirroring web/AnalyzeController.analyze. Everything here is code; only the
// explanation text may later be replaced by the AI reply from the backend.
import * as apr from './apr';
import { checkLicence } from './licence';
import { CIVIL_REFERENCE_PERCENT, CRIMINAL_REFERENCE_PERCENT, SIGNALS, classify } from './risk';
import * as scenarios from './scenarios';
import { validate } from './validate';
import { DISCLAIMER, fallbackExplain, rightsForLevel } from './explainer';

const round1 = (v) => Math.round(v * 10) / 10;

/** Keeps up to 8 fee lines with a name and a positive amount. */
export const cleanFees = (fees = []) =>
  fees
    .filter((f) => f && f.name && f.name.trim() && f.amountVnd > 0)
    .slice(0, 8)
    .map((f) => ({ name: f.name.trim().slice(0, 60), amountVnd: f.amountVnd }));

/** Returns { errors } when the input is invalid, otherwise { result }. */
export function analyze(input) {
  const errors = validate(input);
  if (Object.keys(errors).length) return { errors };

  const monthly = input.repaymentType === 'MONTHLY';
  const n = input.installments;
  const p = input.principalVnd;
  const r = input.totalRepayVnd;
  const days = monthly ? Math.round((n * 365) / 12) : input.termDays;
  const lender = input.lenderName.trim();
  const fees = cleanFees(input.fees);
  const listedFees = fees.reduce((s, f) => s + f.amountVnd, 0);
  const signalCodes = [...new Set((input.signals || []).filter((s) => SIGNALS[s]))];
  const stated = input.statedRatePercent ?? null;

  const aprPercent = monthly ? apr.instalmentSimplePercent(p, r, n) : apr.simplePercent(p, r, days);
  const compound = monthly
    ? apr.instalmentCompoundPercent(p, r, n)
    : apr.compoundPercent(p, r, days);
  const capped = apr.isCapped(aprPercent);
  const licence = checkLicence(lender);
  const risk = classify(licence.status, aprPercent, signalCodes.length);
  const extra = r - p;

  const cap20 = monthly
    ? apr.referenceCostInstalments(p, n, CIVIL_REFERENCE_PERCENT)
    : apr.referenceCostOneTime(p, days, CIVIL_REFERENCE_PERCENT);
  const cap100 = monthly
    ? apr.referenceCostInstalments(p, n, CRIMINAL_REFERENCE_PERCENT)
    : apr.referenceCostOneTime(p, days, CRIMINAL_REFERENCE_PERCENT);

  const result = {
    createdAt: new Date().toISOString(),
    repaymentType: monthly ? 'MONTHLY' : 'ONE_TIME',
    aprPercent: round1(aprPercent),
    aprCapped: capped,
    compoundPercent: round1(compound),
    compoundCapped: apr.isCapped(compound),
    principalVnd: p,
    totalRepayVnd: r,
    extraCostVnd: extra,
    extraPercent: round1((extra / p) * 100),
    termDays: days,
    lenderName: lender,
    licence,
    risk,
    legalCap: {
      cap20Vnd: cap20,
      cap100Vnd: cap100,
      actualVnd: extra,
      multipleOf20: cap20 > 0 ? round1(extra / cap20) : null,
    },
    rights: rightsForLevel(risk.level),
    disclaimer: DISCLAIMER,
    ...fallbackExplain({
      apr: aprPercent,
      capped,
      riskCode: risk.code,
      principal: p,
      totalRepay: r,
      days,
    }),
  };

  if (stated != null) {
    const list = monthly
      ? scenarios.monthly(p, r, n, stated, listedFees)
      : scenarios.oneTime(p, r, days, stated, listedFees);
    const top = scenarios.best(list);
    result.statedRatePercent = stated;
    result.scenarios = list.map((s) => ({ ...s, best: s === top }));
    if (top.status === 'HIDDEN') result.hiddenCostVnd = top.unexplainedVnd;
  }
  if (signalCodes.length) {
    result.signalCodes = signalCodes;
    result.signals = signalCodes.map((s) => SIGNALS[s]);
  }
  if (fees.length) {
    result.fees = fees;
    result.listedFeesVnd = listedFees;
  }
  if (input.monthlyIncomeVnd != null) {
    const payment = monthly ? Math.round(r / n) : r;
    result.burden = {
      incomeVnd: input.monthlyIncomeVnd,
      paymentVnd: payment,
      percent: round1((payment / input.monthlyIncomeVnd) * 100),
      basis: result.repaymentType,
    };
  }
  if (monthly) {
    result.installments = n;
    result.installmentVnd = Math.round(r / n);
    result.schedule = apr.schedule(p, r, n);
  }
  const contract = input.contractAmountVnd;
  if (contract != null && contract > p) {
    const gap = contract - p;
    result.contractGap = {
      contractAmountVnd: contract,
      shortfallVnd: gap,
      shortfallPercent: round1((gap / contract) * 100),
    };
  }
  return { result };
}
