import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import People from "./pages/People";
import Person from "./pages/Person";
import FormsIndex from "./pages/Forms/index";
import Trans_Indicat from "./pages/Forms/Trans_Indicat";
import Units_Reasons from "./pages/Forms/Units_Reasons";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/people" element={<People />} />
          <Route path="/person/:id" element={<Person />} />

          <Route path="/forms" element={<FormsIndex />}>
            <Route index element={<Navigate to="trans_indicat" replace />} />
            <Route path="trans_indicat" element={<Trans_Indicat />} />
            <Route path="units_reasons" element={<Units_Reasons />} />
          </Route>

          {/* редирект на /people по умолчанию */}
          <Route path="*" element={<Navigate to="/people" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
