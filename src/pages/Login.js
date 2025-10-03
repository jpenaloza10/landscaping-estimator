import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, setToken, getToken } from "../lib/api";
export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    useEffect(() => { if (getToken())
        nav("/dashboard"); }, [nav]);
    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const { token } = await loginRequest(email, password);
            setToken(token);
            nav("/dashboard");
        }
        catch (error) {
            if (error instanceof Error) {
                try {
                    const parsed = JSON.parse(error.message);
                    setErr(parsed.message || "Login failed");
                }
                catch {
                    setErr(error.message || "Login failed");
                }
            }
            else {
                setErr("Login failed");
            }
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300", children: _jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md", children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-center text-green-800", children: "Landscaping Estimator" }), _jsxs("form", { className: "space-y-4", onSubmit: onSubmit, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx("input", { type: "email", className: "mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-200", placeholder: "you@example.com", value: email, onChange: e => setEmail(e.target.value), required: true, autoComplete: "email" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsx("input", { type: "password", className: "mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-200", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: e => setPassword(e.target.value), required: true, autoComplete: "current-password" })] }), err && _jsx("p", { className: "text-sm text-red-600", children: err }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-60", children: loading ? "Logging in..." : "Login" })] }), _jsxs("p", { className: "text-center text-sm text-gray-600 mt-6", children: ["Don\u2019t have an account?", " ", _jsx("span", { className: "text-green-700 font-medium", children: "Sign up (coming soon)" })] })] }) }));
}
