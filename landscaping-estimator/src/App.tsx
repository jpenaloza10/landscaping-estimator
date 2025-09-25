import React from "react";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          Landscaping Estimator
        </h1>
        <p className="text-center text-gray-600">
          Tailwind is working ✅
        </p>
      </div>
    </div>
  );
};

export default App;

