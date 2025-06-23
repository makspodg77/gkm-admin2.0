import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./contexts/AuthContext";
import Loading from "./components/ui/Loading";
import EditStop from "./pages/EditStop";
import EditLineType from "./pages/EditLineType";
import EditLine from "./pages/editLine/EditLine";

function App() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={token ? <MainLayout /> : <Login />}>
        <Route index element={<Home />} />
        <Route path="/stop/:id" element={<EditStop />} />
        <Route path="/stop/new" element={<EditStop />} />
        <Route path="/line-type/:id" element={<EditLineType />} />
        <Route path="/line-type/new" element={<EditLineType />} />
        <Route path="/line/:id" element={<EditLine />} />
        <Route path="/line/new" element={<EditLine />} />
      </Route>
    </Routes>
  );
}

export default App;
