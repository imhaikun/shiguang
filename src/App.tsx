import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import ArticleDetail from "@/pages/ArticleDetail";
import Archives from "@/pages/Archives";
import About from "@/pages/About";
import TagResults from "@/pages/TagResults";
import SearchResults from "@/pages/SearchResults";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PostList from "@/pages/PostList";
import PostForm from "@/pages/PostForm";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<ArticleDetail />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/about" element={<About />} />
          <Route path="/tag/:tag" element={<TagResults />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>

        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="posts" element={<PostList />} />
          <Route path="posts/new" element={<PostForm />} />
          <Route path="posts/edit/:slug" element={<PostForm />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
