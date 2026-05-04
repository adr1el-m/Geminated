import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import PatientLayout from "./layouts/PatientLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PatientInput from "./pages/patient/PatientInput";
import PatientResult from "./pages/patient/PatientResult";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patient" replace />} />
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<PatientInput />} />
        <Route path="result" element={<PatientResult />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/patient" replace />} />
    </Routes>
  );
};

export default App;
