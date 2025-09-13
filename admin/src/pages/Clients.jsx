import React, { useState, useEffect } from "react";
import SummaryCards from "../components/SummaryCards";
import FilterTabs from "../components/FilterTabs";
import ClientTable from "../components/ClientTable";

const Clients = () => {
  const [grievances, setGrievances] = useState([]);
  const backendUri = import.meta.env.VITE_BACKEND_URI;

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const response = await fetch(`${backendUri}/grievance/allGrievances`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setGrievances(data);
        } else {
          console.error("Error fetching grievances:", response.statusText);
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };
    fetchGrievances();
  }, []);

  return (
    <div>
      <SummaryCards grievances={grievances} />
      <ClientTable grievances={grievances} /> {/* ✅ Pass grievances as a prop */}
    </div>
  );
};

export default Clients;
