import React from 'react'
import RegisterForm from '../components/RegisterForm.jsx'
import SEO from "../components/SEO";

const RegisterationPage = () => {
  return (
    <div>
      <SEO 
        title="Register - Join Spark Trainings Today" 
        description="Create an account at Spark Trainings and start your professional learning journey. Join thousands of students mastering new skills globally."
        keywords="register spark trainings, sign up for courses, student registration"
        canonical="/register"
      />
      <RegisterForm />
    </div>
  )
}

export default RegisterationPage