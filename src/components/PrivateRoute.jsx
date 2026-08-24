///import React, { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { SessionContext } from '../context/SessionContext';

const PrivateRoute = ({ children }) => {
  const session = localStorage.getItem("session");
  return session ? children : <Navigate to="/" />;
};

export default PrivateRoute;