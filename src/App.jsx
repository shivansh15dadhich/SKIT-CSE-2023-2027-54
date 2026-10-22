import { BrowserRouter, Routes, Route } from "react-router-dom";

import SessionProvider from "./context/SessionProvider";
import Home from "./pages/Home";
import About from "./pages/About";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/analysis" element={<Analysis />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/results" element={<Results />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
