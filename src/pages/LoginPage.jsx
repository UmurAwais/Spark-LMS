import React from 'react';
import LoginForm from '../components/LoginForm';
import SEO from "../components/SEO";

function LoginPage() {
  return (
    <div>
      <SEO 
        title="Login - Access Your Dashboard" 
        description="Login to Spark Trainings to access your courses, track your progress, and continue your learning journey."
        keywords="login spark trainings, student login, access online courses"
        canonical="/login"
      />
        <LoginForm />
    </div>
  );
}

export default LoginPage;