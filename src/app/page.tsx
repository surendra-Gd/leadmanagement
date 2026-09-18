"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
