// The boolean must come from is_clinician(), never profile presence or storage.
export function dashboardDestination(authorizedClinician: boolean, completed: boolean, skinWorkspace = false) {
  if (authorizedClinician && !skinWorkspace) return "/clinician/dashboard";
  return completed ? "/" : "/onboarding";
}