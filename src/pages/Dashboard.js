import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../lib/api";
export default function Dashboard() {
    const nav = useNavigate();
    // Redirect to login if no token
    useEffect(() => {
        const token = getToken();
        if (!token)
            nav("/");
    }, [nav]);
    function logout() {
        clearToken();
        nav("/");
    }
    return (_jsx("div", { className: "min-h-screen p-6 bg-gray-100", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-white p-6 rounded-xl shadow", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Dashboard" }), _jsx("button", { onClick: logout, className: "px-3 py-1 rounded bg-gray-200 hover:bg-gray-300", children: "Logout" })] }), _jsx("p", { className: "mt-4 text-gray-700", children: "You are logged in. Token stored in localStorage." })] }) }));
}
