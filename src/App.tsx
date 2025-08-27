import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import People from "./pages/People";
import Person from "./pages/Person";
import FormsPage from "./pages/FormsPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/people" element={<People />} />
          <Route path="/person" element={<Person />} />
          <Route path="/forms" element={<FormsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
