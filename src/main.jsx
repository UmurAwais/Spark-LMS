import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Courses from "./pages/Courses.jsx"
import ContactUs from "./pages/ContactUs.jsx"
import SingleCoursePage from "./pages/SingleCoursePage.jsx";
import AccessibilityPage from "./pages/AccessibilityPage.jsx";
import GalleryPage from "./pages/Gallery.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicy.jsx";
import TermsAndConditions from "./pages/TermsAndConditions.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterationPage from "./pages/RegisterationPage.jsx";
import OnlineCoursesSection from "./components/OnlineCoursesTab.jsx";
import OnlineCoursePage from "./pages/OnlineCoursesSinglePage";
import CartPage from "./pages/CartPage";
import { CartProvider } from "./components/CartContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import CheckoutPage from "./pages/CheckoutPage";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminCourses from "./pages/AdminCourses.jsx";
import AdminDrive from "./pages/AdminDrive.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import AdminContacts from "./pages/AdminContacts.jsx";
import AdminCertificates from "./pages/AdminCertificates.jsx";
import AdminBadges from "./pages/AdminBadges.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import StudentCoursePlayer from "./pages/StudentCoursePlayer.jsx";
import "./index.css";

import AdminActivityLog from "./pages/AdminActivityLog.jsx";
import StudentProtectedRoute from "./components/StudentProtectedRoute.jsx";
import AdminRoles from "./pages/AdminRoles.jsx";
import AcceptInvite from "./pages/AcceptInvite.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import OnlineCourses from "./pages/OnlineCourses.jsx";
import OnsiteCourses from "./pages/OnsiteCourses.jsx";
import AdminGallery from "./pages/AdminGallery.jsx";
import AdminCoupons from "./pages/AdminCoupons.jsx";

import { Navigate } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/admin",
    children: [
      { path: "login", element: <AdminLogin /> },
      { path: "accept-invite", element: <AcceptInvite /> },
      {
        element: <AdminProtectedRoute />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "courses", element: <AdminCourses /> },
          { path: "drive", element: <AdminDrive /> },
          { path: "orders", element: <AdminOrders /> },
          { path: "users", element: <AdminUsers /> },
          { path: "contacts", element: <AdminContacts /> },
          { path: "certificates", element: <AdminCertificates /> },
          { path: "badges", element: <AdminBadges /> },
          { path: "activity", element: <AdminActivityLog /> },
          { path: "roles", element: <AdminRoles /> },
          { path: "profile", element: <AdminProfile /> },
          { path: "gallery", element: <AdminGallery /> },
          { path: "coupons", element: <AdminCoupons /> },
        ]
      }
    ]
  },
  {
    path: "/student",
    element: <StudentProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      { path: "dashboard", element: <StudentDashboard /> },
      { path: "profile", element: <StudentProfile /> },
      { path: "course/:courseId", element: <StudentCoursePlayer /> },
    ]
  },
  // Fallback for legacy student dashboard path
  { path: "/student-dashboard", element: <Navigate to="/student/dashboard" replace /> },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <AboutUs /> },
      { path: "courses", element: <Courses />},
      { path: "contact", element: <ContactUs />},
      { path: "course/:id", element: <SingleCoursePage /> },
      { path: "accessibility", element: <AccessibilityPage /> },
      { path: "gallery", element: <GalleryPage /> },
      { path: "reviews", element: <ReviewsPage /> },
      { path: "privacypolicy", element: <PrivacyPolicyPage /> },
      { path: "termsandconditions", element: <TermsAndConditions /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterationPage /> },
      { path: "online-courses", element: <OnlineCourses /> },
      { path: "onsite-courses", element: <OnsiteCourses /> },
      { path: "online-course/:id", element: <OnlineCoursePage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <HelmetProvider>
      <CartProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </CartProvider>
    </HelmetProvider>
);