import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { user, clearAuth } = useAuth();
  return (
    <BrowserRouter>
      <nav className="p-4 bg-white shadow flex justify-between">
        <div className="font-bold text-green-700">Landscaping Estimator</div>
        <div className="space-x-3">
          {!user ? (
            <>
              <Link to="/login" className="text-green-700">Login</Link>
              <Link to="/signup" className="text-green-700">Sign Up</Link>
            </>
          ) : (
            <>
              <span className="text-gray-600">Hi, {user.name}</span>
              <button onClick={clearAuth} className="text-red-600">Logout</button>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
