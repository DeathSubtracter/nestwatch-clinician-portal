import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useDashboard } from "@/data/dashboardContext";
import { getPatient } from "@/data/patients";

export const Route = createFileRoute("/patients/$patientId")({
  notFoundComponent: PatientNotFound,
  component: PatientWorkspace,
});

function PatientWorkspace() {
  const data = useDashboard();
  return getPatient(data, Route.useParams().patientId) ? <Outlet /> : <PatientNotFound />;
}

function PatientNotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-[22px] font-semibold tracking-tight">Patient not found</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        This patient isn't connected to Nestwatch.
      </p>
      <Link
        to="/"
        className="mt-5 inline-block text-[14px] font-medium text-primary hover:underline"
      >
        View all patients
      </Link>
    </div>
  );
}
