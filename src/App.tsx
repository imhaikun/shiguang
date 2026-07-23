import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const ArticleDetail = lazy(() => import("@/pages/ArticleDetail"));
const Archives = lazy(() => import("@/pages/Archives"));
const About = lazy(() => import("@/pages/About"));
const TagResults = lazy(() => import("@/pages/TagResults"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PostList = lazy(() => import("@/pages/PostList"));
const PostForm = lazy(() => import("@/pages/PostForm"));
const Tags = lazy(() => import("@/pages/Tags"));
const Categories = lazy(() => import("@/pages/Categories"));
const Settings = lazy(() => import("@/pages/Settings"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="w-6 h-6 border-2 border-primary rounded-full animate-spin"
        style={{ borderColor: "var(--blog-primary)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<ArticleDetail />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/about" element={<About />} />
            <Route path="/tag/:tag" element={<TagResults />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchResults />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/forgot-password/reset" element={<ForgotPassword />} />

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
            <Route path="tags" element={<Tags />} />
            <Route path="categories" element={<Categories />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
