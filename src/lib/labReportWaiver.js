const WAIVER_STORAGE_KEY = "pepv.lab_report_waiver.v1";

export function hasAcceptedLabReportWaiver() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(WAIVER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLabReportWaiverAccepted() {
  try {
    localStorage.setItem(WAIVER_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
