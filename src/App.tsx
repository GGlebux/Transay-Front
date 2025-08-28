import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import People from "./pages/People";
import Person from "./pages/Person";

// НОВОЕ: обёртка секции Forms + две подстраницы
import FormsIndex from "./pages/Forms/index";                   // src/pages/forms/index.tsx
import Trans_Indicat from "./pages/Forms/Trans_Indicat";  // src/pages/forms/Trans_Indicat.tsx
import Units_Reasons from "./pages/Forms/Units_Reasons";  // src/pages/forms/Units_Reasons.tsx

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/people" element={<People />} />
          <Route path="/person" element={<Person />} />

          <Route path="/forms" element={<FormsIndex />}>
            <Route index element={<Navigate to="trans_indicat" replace />} />
            <Route path="trans_indicat" element={<Trans_Indicat />} />
            <Route path="units_reasons" element={<Units_Reasons />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
