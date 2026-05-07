/*
  Jalpai Ganesh Puja Committee - Site Manager Loader
  Add this before </body> in index.html:
  <script src="js/site-manager-loader.js"></script>
*/
(async function () {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  try {
    const res = await fetch("data/site-manager.json?cache=" + Date.now());
    if (!res.ok) throw new Error("Data file not found");
    const data = await res.json();

    document.title = `${data.site.committeeName} ${data.site.year || ""}`.trim();

    const h1 = document.querySelector(".hero h1");
    if (h1) h1.textContent = data.site.committeeName;

    const eyebrow = document.querySelector(".hero-eyebrow");
    if (eyebrow) eyebrow.textContent = data.site.heroEyebrow || "Sacred Celebration";

    const om = document.querySelector(".hero-om");
    if (om) om.textContent = data.site.heroOm || "ॐ श्री गणेशाय नमः";

    const sub = document.querySelector(".hero-sub");
    if (sub) sub.textContent = data.site.heroSubtitle || "";

    const tagline = document.querySelector(".hero-tagline");
    if (tagline) tagline.textContent = data.site.slogan || "";

    const date = document.querySelector(".hero-date");
    if (date) date.textContent = data.site.dateText || "";

    const footerLogo = document.querySelector(".footer-logo");
    if (footerLogo) footerLogo.textContent = data.site.committeeName;

    const footerTag = document.querySelector(".footer-tagline");
    if (footerTag) footerTag.textContent = data.site.slogan || "";

    if (data.theme && data.theme.avoidBlack) {
      const root = document.documentElement;
      root.style.setProperty("--deep", "#FFF8E7");
      root.style.setProperty("--dark", "#FFF3D6");
      root.style.setProperty("--mid", "#F7E5B8");
      root.style.setProperty("--surface", "#FFF9EA");
      root.style.setProperty("--cream", "#3A2206");
      root.style.setProperty("--cream-dim", "rgba(58,34,6,0.78)");
      root.style.setProperty("--cream-faint", "rgba(58,34,6,0.45)");
      root.style.setProperty("--gold", data.theme.primaryGold || "#B8860B");
      root.style.setProperty("--gold-bright", data.theme.brightGold || "#D4A72C");
    }

    const announcement = data.announcement;
    if (announcement?.enabled && !document.querySelector("#site-manager-announcement")) {
      const box = document.createElement("section");
      box.id = "site-manager-announcement";
      box.className = "section";
      box.innerHTML = `
        <div class="news-feature">
          <div class="news-eyebrow">Announcement</div>
          <h3>${esc(announcement.title)}</h3>
          <p class="news-body">${esc(announcement.message)}</p>
          ${announcement.buttonLink ? `<div class="invite-actions"><a class="btn-primary" href="${esc(announcement.buttonLink)}">${esc(announcement.buttonText || "Open")}</a></div>` : ""}
        </div>`;
      const nav = document.querySelector("nav");
      if (nav) nav.insertAdjacentElement("afterend", box);
      else document.body.prepend(box);
    }

    if (Array.isArray(data.gallery) && data.gallery.length) {
      const grid = document.querySelector(".gallery-grid");
      if (grid) {
        grid.innerHTML = data.gallery.map(item => `
          <div class="gallery-item">
            <img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">
            <button class="download-btn" onclick="window.open('${esc(item.image)}','_blank')">View</button>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.warn("Site Manager data was not loaded:", err);
  }
})();
