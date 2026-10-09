import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AccountsPage } from "@/components/AccountsPage";
export default function AccountManagementPage() { return <ProtectedRoute adminOnly><AccountsPage /></ProtectedRoute>; }
