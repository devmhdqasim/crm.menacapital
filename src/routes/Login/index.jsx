import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupAxiosInterceptor } from '../../services/authService'; // Update path as needed
import EnterEmailOrUsername from '../../components/login/EnterEmail'; // Updated component name
import EnterPassword from '../../components/login/EnterPassword';
import EnterOTP from '../../components/login/EnterOTP';
import ForgetPassword from '../../components/login/ForgetPassword';

const Login = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState(''); // Can be email or username
  const [loginBy, setLoginBy] = useState(''); // 'email' or 'username'
  const [isBranchLogin, setIsBranchLogin] = useState(false);
  const [currentStep, setCurrentStep] = useState('login'); // login, password, otp, forgotPassword
  const [userData, setUserData] = useState(null);

  // Setup axios interceptor on component mount
  useEffect(() => {
    setupAxiosInterceptor();
  }, []);

  // Handle successful login (after password verification)
  const handleLoginSuccess = (data) => {
    console.log('Login successful, user data:', data);
    console.log('Login type used:', loginBy);
    setUserData(data);
    
    // After successful login, move to OTP verification
    // The refresh token API has already been called automatically after login
    // setCurrentStep('otp');
    if(data?.userInfo?.branchName) {
      navigate('/br-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Handle successful OTP verification
  const handleOTPVerifySuccess = (data) => {
    console.log('OTP verified successfully:', data);
    
    // Navigate to dashboard after successful OTP verification
    navigate('/dashboard');
    
    // Or show a success message
    // alert('Verification successful! Welcome back.');
  };

  // Navigate to next screen
  const handleNext = (step, data = {}) => {
    if (data.login) {
      setLogin(data.login);
    }
    if (data.loginBy) {
      setLoginBy(data.loginBy);
    }
    setCurrentStep(step);
  };

  // Navigate to previous screen
  const handleBack = (step) => {
    setCurrentStep(step);
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentStep) {
      case 'login':
        return (
          <EnterEmailOrUsername
            setLogin={setLogin}
            setLoginBy={setLoginBy}
            setIsBranchLogin={setIsBranchLogin}
            onNext={() => handleNext('password')}
          />
        );
      
      case 'password':
        return (
          <EnterPassword
            login={login}
            loginBy={loginBy}
            setCurrentStep={setCurrentStep}
            onNext={handleLoginSuccess}
            isBranchLogin={isBranchLogin}
            onLoginSuccess={handleLoginSuccess}
            onBack={() => handleBack('login')}
            onForgotPassword={() => handleNext('forgotPassword')}
          />
        );
      
      case 'otp':
        return (
          <EnterOTP
            login={login}
            loginBy={loginBy}
            setCurrentStep={setCurrentStep}
            onVerifySuccess={handleOTPVerifySuccess}
            onBack={() => handleBack('password')}
          />
        );
      
      case 'forgotPassword':
        return (
          <ForgetPassword
            login={login}
            loginBy={loginBy}
            setCurrentStep={setCurrentStep}
            onNext={() => handleNext('otp')}
            onBack={() => handleBack('password')}
          />
        );
      
      default:
        return (
          <EnterEmailOrUsername 
            setLogin={setLogin}
            setLoginBy={setLoginBy}
            setCurrentStep={setCurrentStep} 
            onNext={() => handleNext('password')} 
          />
        );
    }
  };

  return <>{renderScreen()}</>;
};

export default Login;