import { useState } from "react";
import LandingPage   from "./pages/LandingPage";
import NGORegister   from "./pages/NGORegister";
import DonorRegister from "./pages/DonorRegister";
import MatchResult   from "./pages/MatchResult";

export default function App() {
  const [page, setPage]           = useState("home");
  const [donorData, setDonorData] = useState(null);

  const navigate = (p, data = null) => {
    if (data) setDonorData(data);
    setPage(p);
    window.scrollTo(0, 0);
  };

  if (page === "ngo")   return <NGORegister   navigate={navigate} />;
  if (page === "donor") return <DonorRegister navigate={navigate} />;
  if (page === "match") return <MatchResult   navigate={navigate} donorData={donorData} />;
  return <LandingPage navigate={navigate} />;
}
