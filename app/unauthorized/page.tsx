export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
      <p className="text-lg text-gray-700">
        You don’t have access to this page or section of the dashboard.
      </p>
    </div>
  );
}

