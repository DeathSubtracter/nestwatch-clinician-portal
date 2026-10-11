import { Link, Outlet, createFileRoute, notFound } from "@tanstack/react-router";
import { getPatient } from "@/data/patients";

export const Route = createFileRoute("/patients/$patientId")({
  loader: ({ params }) => {
    const patient = getPatient(params.patientId);
    if (!patient) throw notFound();
    return { patient };
  },
  notFoundComponent: PatientNotFound,
  component: () => <Outlet />,
});

function PatientNotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-[22px] font-semibold tracking-tight">Patient not found</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">This patient isn't connected to Nestwatch.</p>
      <Link to="/" className="mt-5 inline-block text-[14px] font-medium text-primary hover:underline">View all patients</Link>
    </div>
  );
}
