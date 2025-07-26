// app/dashboard/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
      <p className="mt-4">You do not have permission to view this page.</p>
    </div>
  );
}
