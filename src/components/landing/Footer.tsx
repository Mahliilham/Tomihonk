import logo from "../../assets/logo.png";

export default function Footer() {
  return (
    <footer className="th-footer">
      <div className="th-container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <img src={logo} alt="Tomihonk" className="th-logo-img" />
            </div>
            <p>
              PT. Tomihonk - Penyedia layanan internet terpercaya dengan komitmen menghadirkan
              koneksi handal untuk semua kebutuhan digital Anda.
            </p>
            <p style={{ marginTop: 10, color: "var(--th-accent)", fontWeight: 700 }}>
              "Koneksi Handal, Layanan Terpercaya"
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              {["beranda", "profil", "layanan", "galeri", "kontak"].map((l) => (
                <li key={l}>
                  <a href={`#${l}`} style={{ textTransform: "capitalize" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Layanan</h4>
            <ul>
              <li><a href="#layanan">Paket Rumahan</a></li>
              <li><a href="#layanan">Paket Gamers</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Kontak</h4>
            <div className="footer-contact-item">
              <i className="fas fa-map-marker-alt" />
              <span>Jl. Projosumarto I Desa Kaligayam Kec. Talang Kab. Tegal 52193</span>
            </div>
            <div className="footer-contact-item">
              <i className="fas fa-phone" />
              <span>+62 851-3822-2298</span>
            </div>
            <div className="footer-contact-item">
              <i className="fas fa-envelope" />
              <span>pt.tomihonknetworknusantara@tomihonk.co.id</span>
            </div>
            <div className="footer-contact-item">
              <i className="fab fa-whatsapp" />
              <span>+62 851-3822-2298</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; www.tomihonk.co.id. All Rights Reserved. Designed by Ilham Farras Baiquni | Universitas Harkat Negeri
        </div>
      </div>
    </footer>
  );
}
