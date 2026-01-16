import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map(({ path, element, layout: Layout }) => (
          <Route key={path} path={path} element={<Layout>{element}</Layout>} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
