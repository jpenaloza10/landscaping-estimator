export default function Home() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-3">Welcome</h1>
          <p className="text-gray-600">Create estimates and track expenses for landscaping projects.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <a href="/login" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Login</a>
            <a href="/signup" className="border border-green-600 text-green-700 px-4 py-2 rounded hover:bg-green-50">Sign Up</a>
          </div>
        </div>
      </div>
    );
  }
  