const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value) => `${value.toFixed(1)}%`;

// Disables `button` until every input in `inputs` has a value, and lets
// pressing Enter in any text/number input trigger the button (same as a click).
function wireUpForm(inputs, button) {
  const updateDisabledState = () => {
    button.disabled = !inputs.every((input) => input.value.trim() !== "");
  };

  inputs.forEach((input) => {
    input.addEventListener("input", updateDisabledState);
    input.addEventListener("change", updateDisabledState);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        button.click();
      }
    });
  });

  updateDisabledState();
}

const num = (el) => parseFloat(el.value) || 0;

function interpretationBlock(sentence, benchmark) {
  return `
        <p class="result-interpretation">${sentence}</p>
        <p class="result-benchmark">&#128202; ${benchmark}</p>`;
}

// Clears every text/number input back to blank (selects are left as-is,
// since they always need some value) and disables the calculate button
// again, so a visitor can start from a clean slate instead of the example.
function wireClearButton(clearBtnId, inputs, button, resultEl) {
  const clearBtn = document.getElementById(clearBtnId);
  if (!clearBtn) return;
  clearBtn.addEventListener("click", () => {
    inputs.forEach((input) => {
      if (input.tagName !== "SELECT") input.value = "";
    });
    button.disabled = true;
    resultEl.innerHTML = "";
    const firstInput = inputs.find((input) => input.tagName !== "SELECT");
    if (firstInput) firstInput.focus();
  });
}

// ---------------------------------------------------------------------------
// Pricing Calculator
// ---------------------------------------------------------------------------
(() => {
  const bedroomsInput = document.getElementById("p_bedrooms");
  const bathroomsInput = document.getElementById("p_bathrooms");
  const hoursInput = document.getElementById("p_hours");
  const rateInput = document.getElementById("p_rate");
  const suppliesInput = document.getElementById("p_supplies");
  const travelInput = document.getElementById("p_travel");
  const otherInput = document.getElementById("p_other");
  const marginInput = document.getElementById("p_margin");
  const typeSelect = document.getElementById("p_type");
  const btn = document.getElementById("pricingBtn");
  const resultEl = document.getElementById("pricingResult");

  const typeLabels = { "0": "Regular cleaning", "25": "Deep cleaning", "40": "Move-in / Move-out" };

  wireUpForm([hoursInput, rateInput, suppliesInput, travelInput, otherInput, marginInput], btn);
  wireClearButton(
    "p_clearBtn",
    [bedroomsInput, bathroomsInput, hoursInput, rateInput, suppliesInput, travelInput, otherInput, marginInput],
    btn,
    resultEl
  );

  function calculate() {
    const hours = num(hoursInput);
    const rate = num(rateInput);
    const supplies = num(suppliesInput);
    const travel = num(travelInput);
    const other = num(otherInput);
    const marginPct = num(marginInput);
    const typeAdjustment = num(typeSelect) / 100;
    const typeLabel = typeLabels[typeSelect.value];

    const estimatedPrice = hours * rate + supplies + travel + other;
    const marginFraction = Math.min(marginPct / 100, 0.95);
    const recommendedPrice = (estimatedPrice / (1 - marginFraction)) * (1 + typeAdjustment);
    const estimatedProfit = recommendedPrice - estimatedPrice;

    const interpretation = `Charging ${formatMoney(recommendedPrice)} for this ${typeLabel.toLowerCase()} covers your ${formatMoney(estimatedPrice)} in labor and costs, and still bags you ${formatMoney(estimatedProfit)} in profit.`;
    const benchmark = "Deep cleans and move-in/move-out jobs take longer and use more supplies — pricing them like a regular clean is a common way to underprice your time.";

    resultEl.innerHTML = `
      <div class="result-box">
        <p class="result-headline-label">Recommended Price</p>
        <p class="result-headline-value result-highlight">${formatMoney(recommendedPrice)}</p>
        ${interpretationBlock(interpretation, benchmark)}

        <div class="result-breakdown">
          <p class="breakdown-title">Based on:</p>
          <div class="breakdown-row"><span>Labor (${hours} hrs &times; ${formatMoney(rate)})</span><span>${formatMoney(hours * rate)}</span></div>
          <div class="breakdown-row"><span>Supplies</span><span>${formatMoney(supplies)}</span></div>
          <div class="breakdown-row"><span>Travel</span><span>${formatMoney(travel)}</span></div>
          <div class="breakdown-row"><span>Other costs</span><span>${formatMoney(other)}</span></div>
          <div class="breakdown-row breakdown-total"><span>Estimated price</span><span>${formatMoney(estimatedPrice)}</span></div>
          <div class="breakdown-row"><span>${typeLabel} adjustment (+${(typeAdjustment * 100).toFixed(0)}%) &amp; ${formatPercent(marginPct)} margin</span><span>${formatMoney(estimatedProfit)}</span></div>
          <div class="breakdown-row breakdown-total"><span>Recommended price</span><span>${formatMoney(recommendedPrice)}</span></div>
        </div>

        <p class="result-tip">&#128161; Quote the round number, not the exact one&mdash;it reads more confident.</p>
        <p class="result-upgrade">Want this saved automatically for every job, with client tracking and a dashboard? <a href="#cta">Get The Cleaning Business Toolkit &rarr;</a></p>
      </div>
    `;
  }

  btn.addEventListener("click", () => {
    calculate();
    if (typeof gtag === "function") {
      gtag("event", "calculate_pricing_click");
    }
    showStickyBar();
  });

  calculate(); // show a working result immediately, using the pre-filled example
})();

// ---------------------------------------------------------------------------
// Sticky bottom CTA bar: stays hidden until the visitor scrolls past the
// hero or runs the calculator, so the first screen isn't a sales pitch.
// ---------------------------------------------------------------------------
const stickyBar = document.getElementById("stickyBar");
let stickyBarShown = false;

function showStickyBar() {
  if (!stickyBar || stickyBarShown) return;
  stickyBarShown = true;
  stickyBar.classList.add("visible");
  if (typeof gtag === "function") {
    gtag("event", "sticky_cta_shown");
  }
}

const hero = document.querySelector(".hero");
if (hero) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > hero.offsetHeight) {
      showStickyBar();
    }
  });
}

// ---------------------------------------------------------------------------
// Lightbox: click a product screenshot to view it full-size.
// ---------------------------------------------------------------------------
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");

  const openLightbox = (img) => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add("open");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
  };

  document.querySelectorAll(".product-screenshot").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img));
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
}
