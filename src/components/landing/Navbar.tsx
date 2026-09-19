import { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo.png";



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("beranda");
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 30);
        const sections = document.querySelectorAll<HTMLElement>("section[id]");
        let cur = "beranda";
        sections.forEach((s) => {
          if (window.scrollY >= s.offsetTop - 100) cur = s.id;
        });
        setActive(cur);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { id: "beranda", label: "Beranda" },
    { id: "profil", label: "Profil" },
    { id: "layanan", label: "Layanan" },
    { id: "galeri", label: "Galeri" },
    { id: "kontak", label: "Kontak" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="th-container nav-wrap">
        <a href="#beranda" className="th-logo">
          <img src={logo} alt="Tomihonk" className="th-logo-img" />
        </a>
        <ul className={`nav-menu ${open ? "show" : ""}`}>
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className={active === l.id ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li style={{ display: "flex", alignItems: "center" }}>
            <a
              href="/login-pelanggan"
              className="th-btn th-btn-accent th-btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: 700,
                fontSize: ".84rem",
                textDecoration: "none",
                boxShadow: "0 10px 10px rgba(249,115,22,0.35)",
                marginLeft: 4,
              }}
              onClick={() => setOpen(false)}
            >
              <i className="fas fa-user-circle" /> Login
            </a>
          </li>
        </ul>
        <button className="menu-toggle" onClick={() => setOpen((v) => !v)}>
          <i className="fas fa-bars" />
        </button>
      </div>
    </nav>
  );
}
