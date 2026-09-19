import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import StatsSection from "@/components/landing/StatsSection";
import Partners from "@/components/landing/Partners";
import Features from "@/components/landing/Features";
import Profil from "@/components/landing/Profil";
import Layanan from "@/components/landing/Layanan";
import Galeri from "@/components/landing/Galeri";
import Kontak from "@/components/landing/Kontak";
import Footer from "@/components/landing/Footer";

import CalonModal from "@/components/modals/CalonModal";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeknisiDashboard from "@/components/dashboard/TeknisiDashboard";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import ChatbotWidget from "@/components/dashboard/ChatbotWidget";
import { useApp } from "@/context/AppContext";

const Index = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [calonOpen, setCalonOpen] = useState(false);
  const [defaultPaket, setDefaultPaket] = useState<string | undefined>();

  if (currentUser?.role === "admin") return <AdminDashboard />;
  if (currentUser?.role === "teknisi") return <TeknisiDashboard />;
  if (currentUser?.role === "sales") return <SalesDashboard />;
  if (currentUser?.role === "user") return <UserDashboard />;

  const handleDaftarPaket = (paketName: string) => {
    sessionStorage.setItem("selected_paket", paketName);
    navigate("/login-pelanggan");
  };

  return (
    <>
      <Navbar />
      <Hero />
      <StatsSection />
      {/* <Partners /> */}
      <Features />
      <Profil />
      <Layanan onDaftar={handleDaftarPaket} />
      <Galeri />
      <Kontak />
      <Footer />
      <CalonModal open={calonOpen} defaultPaket={defaultPaket} onClose={() => setCalonOpen(false)} />
      <ChatbotWidget />
    </>
  );
};

export default Index;
